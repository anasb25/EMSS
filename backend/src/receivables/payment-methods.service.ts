import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaymentMethod } from './entities/payment-method.entity';

const DEFAULT_PAYMENT_METHODS = ['Cash', 'Online', 'Cheque'] as const;

@Injectable()
export class PaymentMethodsService {
  constructor(
    @InjectRepository(PaymentMethod)
    private readonly paymentMethodsRepository: Repository<PaymentMethod>,
  ) {}

  findAll(): Promise<PaymentMethod[]> {
    return this.paymentMethodsRepository.find({
      order: { id: 'ASC' },
    });
  }

  async findOne(id: number): Promise<PaymentMethod | null> {
    return this.paymentMethodsRepository.findOne({ where: { id } });
  }

  findByName(name: string): Promise<PaymentMethod | null> {
    return this.paymentMethodsRepository.findOne({ where: { name } });
  }

  async ensurePaymentMethodsExist(): Promise<void> {
    for (const name of DEFAULT_PAYMENT_METHODS) {
      const existing = await this.paymentMethodsRepository.findOne({
        where: { name },
      });
      if (!existing) {
        await this.paymentMethodsRepository.save(
          this.paymentMethodsRepository.create({ name }),
        );
      }
    }
  }
}
