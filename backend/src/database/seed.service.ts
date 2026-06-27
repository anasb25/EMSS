import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { RolesService } from '../roles/roles.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class SeedService implements OnModuleInit {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    private readonly rolesService: RolesService,
    private readonly usersService: UsersService,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.rolesService.ensureRolesExist();
    await this.usersService.ensureAdminUser();
    this.logger.log('Database seed completed (roles + admin user)');
  }
}
