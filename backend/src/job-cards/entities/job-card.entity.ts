import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Customer } from '../../customers/entities/customer.entity';
import { User } from '../../users/entities/user.entity';
import { JobCardProduct } from './job-card-product.entity';

@Entity('job_cards')
export class JobCard {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    name: 'job_card_number',
    type: 'varchar',
    length: 30,
    unique: true,
    nullable: true,
  })
  jobCardNumber: string | null;

  @Column({ name: 'customer_id', type: 'uuid' })
  customerId: string;

  @ManyToOne(() => Customer, { eager: false })
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  @Column({ name: 'bl_number', type: 'varchar', length: 100, nullable: true })
  blNumber: string | null;

  @Column({
    name: 'declaration_number',
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  declarationNumber: string | null;

  @Column({
    name: 'container_number',
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  containerNumber: string | null;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ name: 'is_open', type: 'boolean', default: true })
  isOpen: boolean;

  @Column({ type: 'boolean', default: false })
  transport: boolean;

  @Column({ type: 'boolean', default: false })
  logistics: boolean;

  @Column({ name: 'is_import', type: 'boolean', default: false })
  isImport: boolean;

  @Column({ name: 'is_export', type: 'boolean', default: false })
  isExport: boolean;

  @Column({ type: 'boolean', default: false })
  freight: boolean;

  @OneToMany(() => JobCardProduct, (item) => item.jobCard, {
    cascade: true,
  })
  items: JobCardProduct[];

  @Column({ name: 'created_by_id', type: 'uuid', nullable: true })
  createdById: string | null;

  @ManyToOne(() => User, { eager: false })
  @JoinColumn({ name: 'created_by_id' })
  createdBy: User | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
