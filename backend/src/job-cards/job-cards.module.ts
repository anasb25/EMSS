import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Customer } from '../customers/entities/customer.entity';
import { Product } from '../products/entities/product.entity';
import { User } from '../users/entities/user.entity';
import { JobCardProduct } from './entities/job-card-product.entity';
import { JobCard } from './entities/job-card.entity';
import { JobCardsController } from './job-cards.controller';
import { JobCardsService } from './job-cards.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([JobCard, JobCardProduct, Customer, Product, User]),
  ],
  controllers: [JobCardsController],
  providers: [JobCardsService],
  exports: [JobCardsService],
})
export class JobCardsModule {}
