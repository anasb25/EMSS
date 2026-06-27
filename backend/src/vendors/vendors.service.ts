import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateVendorDto } from './dto/create-vendor.dto';
import { QueryVendorsDto } from './dto/query-vendors.dto';
import { UpdateVendorDto } from './dto/update-vendor.dto';
import { Vendor } from './entities/vendor.entity';
import { VendorsPaginatedResult } from './interfaces/vendors-paginated-result.interface';

@Injectable()
export class VendorsService {
  constructor(
    @InjectRepository(Vendor)
    private readonly vendorsRepository: Repository<Vendor>,
  ) {}

  async findAll(query: QueryVendorsDto): Promise<VendorsPaginatedResult> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const status = query.status ?? 'all';

    const qb = this.vendorsRepository.createQueryBuilder('vendor');

    if (query.search?.trim()) {
      const search = `%${query.search.trim()}%`;
      qb.andWhere(
        `(vendor.name ILIKE :search
          OR vendor.email ILIKE :search
          OR vendor.phoneNumber ILIKE :search
          OR vendor.mobileNumber ILIKE :search
          OR vendor.country ILIKE :search
          OR vendor.address ILIKE :search)`,
        { search },
      );
    }

    if (status === 'active') {
      qb.andWhere('vendor.isActive = :isActive', { isActive: true });
    }

    if (status === 'inactive') {
      qb.andWhere('vendor.isActive = :isActive', { isActive: false });
    }

    qb.orderBy('vendor.createdAt', 'DESC');
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

  async findOne(id: string): Promise<Vendor> {
    const vendor = await this.vendorsRepository.findOne({ where: { id } });
    if (!vendor) {
      throw new NotFoundException(`Vendor with id ${id} not found`);
    }
    return vendor;
  }

  create(createVendorDto: CreateVendorDto): Promise<Vendor> {
    const vendor = this.vendorsRepository.create({
      ...createVendorDto,
      isActive: createVendorDto.isActive ?? true,
    });
    return this.vendorsRepository.save(vendor);
  }

  async update(id: string, updateVendorDto: UpdateVendorDto): Promise<Vendor> {
    const vendor = await this.findOne(id);
    Object.assign(vendor, updateVendorDto);
    return this.vendorsRepository.save(vendor);
  }

  async remove(id: string): Promise<void> {
    const vendor = await this.findOne(id);
    await this.vendorsRepository.remove(vendor);
  }
}
