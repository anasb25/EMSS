import { Module } from '@nestjs/common';
import { RolesModule } from '../roles/roles.module';
import { UsersModule } from '../users/users.module';
import { DemoSeedService } from './demo-seed.service';
import { SeedService } from './seed.service';

@Module({
  imports: [RolesModule, UsersModule],
  providers: [SeedService, DemoSeedService],
  exports: [DemoSeedService],
})
export class DatabaseModule {}
