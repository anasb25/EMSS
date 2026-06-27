import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BankController } from './bank.controller';
import { BankService } from './bank.service';
import { BankEntry } from './entities/bank-entry.entity';

@Module({
  imports: [TypeOrmModule.forFeature([BankEntry])],
  controllers: [BankController],
  providers: [BankService],
})
export class BankModule {}
