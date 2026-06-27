import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { QueryCustomersDto } from './dto/query-customers.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { Customer } from './entities/customer.entity';
import { CustomersPaginatedResult } from './interfaces/customers-paginated-result.interface';

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer)
    private readonly customersRepository: Repository<Customer>,
  ) {}

  async findAll(query: QueryCustomersDto): Promise<CustomersPaginatedResult> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const status = query.status ?? 'all';

    const qb = this.customersRepository.createQueryBuilder('customer');

    if (query.search?.trim()) {
      const search = `%${query.search.trim()}%`;
      qb.andWhere(
        `(customer.name ILIKE :search
          OR customer.email ILIKE :search
          OR customer.phoneNumber ILIKE :search
          OR customer.mobileNumber ILIKE :search
          OR customer.country ILIKE :search
          OR customer.trnNumber ILIKE :search
          OR customer.address ILIKE :search)`,
        { search },
      );
    }

    if (status === 'active') {
      qb.andWhere('customer.isActive = :isActive', { isActive: true });
    }

    if (status === 'inactive') {
      qb.andWhere('customer.isActive = :isActive', { isActive: false });
    }

    qb.orderBy('customer.createdAt', 'DESC');
    qb.skip((page - 1) * limit).take(limit);

    const [data, total] = await qb.getManyAndCount();

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }

  async findOne(id: string): Promise<Customer> {
    const customer = await this.customersRepository.findOne({ where: { id } });
    if (!customer) {
      throw new NotFoundException(`Customer with id ${id} not found`);
    }
    return customer;
  }

  create(createCustomerDto: CreateCustomerDto): Promise<Customer> {
    const customer = this.customersRepository.create({
      ...createCustomerDto,
      isActive: createCustomerDto.isActive ?? true,
    });
    return this.customersRepository.save(customer);
  }

  async update(
    id: string,
    updateCustomerDto: UpdateCustomerDto,
  ): Promise<Customer> {
    const customer = await this.findOne(id);
    Object.assign(customer, updateCustomerDto);
    return this.customersRepository.save(customer);
  }

  async remove(id: string): Promise<void> {
    const customer = await this.findOne(id);
    await this.customersRepository.remove(customer);
  }
}
