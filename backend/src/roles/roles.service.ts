import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role, RoleName } from './entities/role.entity';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role)
    private readonly rolesRepository: Repository<Role>,
  ) {}

  findByName(name: RoleName): Promise<Role | null> {
    return this.rolesRepository.findOne({ where: { name } });
  }

  async ensureRolesExist(): Promise<void> {
    for (const name of [RoleName.USER, RoleName.ADMIN]) {
      const existing = await this.findByName(name);
      if (!existing) {
        await this.rolesRepository.save(this.rolesRepository.create({ name }));
      }
    }
  }
}
