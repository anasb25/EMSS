import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateProductDto } from './dto/create-product.dto';
import { QueryProductsDto } from './dto/query-products.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product } from './entities/product.entity';
import { ProductsPaginatedResult } from './interfaces/products-paginated-result.interface';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productsRepository: Repository<Product>,
  ) {}

  async findAll(query: QueryProductsDto): Promise<ProductsPaginatedResult> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const status = query.status ?? 'all';

    const qb = this.productsRepository.createQueryBuilder('product');

    if (query.search?.trim()) {
      const search = `%${query.search.trim()}%`;
      qb.andWhere('product.name ILIKE :search', { search });
    }

    if (status === 'active') {
      qb.andWhere('product.isActive = :isActive', { isActive: true });
    }

    if (status === 'inactive') {
      qb.andWhere('product.isActive = :isActive', { isActive: false });
    }

    qb.orderBy('product.createdAt', 'DESC');
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

  async findOne(id: string): Promise<Product> {
    const product = await this.productsRepository.findOne({ where: { id } });
    if (!product) {
      throw new NotFoundException(`Product with id ${id} not found`);
    }
    return product;
  }

  create(createProductDto: CreateProductDto): Promise<Product> {
    const product = this.productsRepository.create({
      ...createProductDto,
      isActive: createProductDto.isActive ?? true,
    });
    return this.productsRepository.save(product);
  }

  async update(id: string, updateProductDto: UpdateProductDto): Promise<Product> {
    const product = await this.findOne(id);
    Object.assign(product, updateProductDto);
    return this.productsRepository.save(product);
  }

  async remove(id: string): Promise<void> {
    const product = await this.findOne(id);
    await this.productsRepository.remove(product);
  }
}
