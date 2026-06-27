import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { RoleName } from '../roles/entities/role.entity';
import { RolesService } from '../roles/roles.service';
import { CreateUserDto } from './dto/create-user.dto';
import { QueryUsersDto } from './dto/query-users.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import {
  SafeUser,
  UsersPaginatedResult,
} from './interfaces/users-paginated-result.interface';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly rolesService: RolesService,
  ) {}

  findByUsername(username: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { username } });
  }

  findById(id: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { id } });
  }

  toSafeUser(user: User): SafeUser {
    return {
      id: user.id,
      username: user.username,
      role: user.role.name,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  async findAll(query: QueryUsersDto): Promise<UsersPaginatedResult> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const status = query.status ?? 'all';
    const role = query.role ?? 'all';

    const qb = this.usersRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.role', 'role');

    if (query.search?.trim()) {
      const search = `%${query.search.trim()}%`;
      qb.andWhere('user.username ILIKE :search', { search });
    }

    if (status === 'active') {
      qb.andWhere('user.isActive = :isActive', { isActive: true });
    }

    if (status === 'inactive') {
      qb.andWhere('user.isActive = :isActive', { isActive: false });
    }

    if (role !== 'all') {
      qb.andWhere('role.name = :roleName', { roleName: role });
    }

    qb.orderBy('user.createdAt', 'DESC');
    qb.skip((page - 1) * limit).take(limit);

    const [data, total] = await qb.getManyAndCount();

    return {
      data: data.map((user) => this.toSafeUser(user)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }

  async findOne(id: string): Promise<SafeUser> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }
    return this.toSafeUser(user);
  }

  async createUser(
    username: string,
    plainPassword: string,
    roleName: RoleName,
    isActive = true,
  ): Promise<User> {
    const role = await this.rolesService.findByName(roleName);
    if (!role) {
      throw new Error(`Role ${roleName} not found`);
    }

    const password = await bcrypt.hash(plainPassword, 10);
    const user = this.usersRepository.create({
      username,
      password,
      role,
      roleId: role.id,
      isActive,
    });

    return this.usersRepository.save(user);
  }

  async create(dto: CreateUserDto): Promise<SafeUser> {
    const username = dto.username.trim();
    const existing = await this.findByUsername(username);
    if (existing) {
      throw new ConflictException('Username is already taken.');
    }

    const user = await this.createUser(
      username,
      dto.password,
      dto.role,
      dto.isActive ?? true,
    );
    return this.toSafeUser(user);
  }

  async update(
    id: string,
    dto: UpdateUserDto,
    currentUserId: string,
  ): Promise<SafeUser> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    const nextRole = dto.role ?? user.role.name;
    const nextIsActive = dto.isActive ?? user.isActive;

    if (user.id === currentUserId) {
      if (dto.isActive === false) {
        throw new BadRequestException('You cannot deactivate your own account.');
      }

      if (dto.role !== undefined && dto.role !== RoleName.ADMIN) {
        throw new BadRequestException('You cannot remove your own admin role.');
      }
    }

    if (
      user.role.name === RoleName.ADMIN &&
      (nextRole !== RoleName.ADMIN || !nextIsActive)
    ) {
      const activeAdminCount = await this.countActiveAdmins();
      const isLastActiveAdmin =
        user.isActive && user.role.name === RoleName.ADMIN && activeAdminCount <= 1;

      if (isLastActiveAdmin) {
        throw new BadRequestException(
          'At least one active admin account must remain.',
        );
      }
    }

    if (dto.username !== undefined) {
      const username = dto.username.trim();
      if (!username) {
        throw new BadRequestException('Username is required.');
      }

      const existing = await this.findByUsername(username);
      if (existing && existing.id !== id) {
        throw new ConflictException('Username is already taken.');
      }

      user.username = username;
    }

    if (dto.password !== undefined) {
      user.password = await bcrypt.hash(dto.password, 10);
    }

    if (dto.role !== undefined) {
      const role = await this.rolesService.findByName(dto.role);
      if (!role) {
        throw new BadRequestException(`Role ${dto.role} not found.`);
      }
      user.role = role;
      user.roleId = role.id;
    }

    if (dto.isActive !== undefined) {
      user.isActive = dto.isActive;
    }

    const saved = await this.usersRepository.save(user);
    return this.toSafeUser(saved);
  }

  async remove(id: string, currentUserId: string): Promise<void> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    if (user.id === currentUserId) {
      throw new BadRequestException('You cannot delete your own account.');
    }

    if (user.role.name === RoleName.ADMIN) {
      const adminCount = await this.countAdmins();
      if (adminCount <= 1) {
        throw new BadRequestException(
          'At least one admin account must remain.',
        );
      }
    }

    await this.usersRepository.remove(user);
  }

  async ensureAdminUser(): Promise<void> {
    const existing = await this.findByUsername('admin');
    if (!existing) {
      await this.createUser('admin', 'admin123', RoleName.ADMIN);
    }
  }

  private async countActiveAdmins(): Promise<number> {
    return this.usersRepository
      .createQueryBuilder('user')
      .leftJoin('user.role', 'role')
      .where('role.name = :roleName', { roleName: RoleName.ADMIN })
      .andWhere('user.isActive = :isActive', { isActive: true })
      .getCount();
  }

  private async countAdmins(): Promise<number> {
    return this.usersRepository
      .createQueryBuilder('user')
      .leftJoin('user.role', 'role')
      .where('role.name = :roleName', { roleName: RoleName.ADMIN })
      .getCount();
  }
}
