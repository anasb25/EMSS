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
import { JobCard } from '../../job-cards/entities/job-card.entity';
import { User } from '../../users/entities/user.entity';
import { InvoiceItem } from './invoice-item.entity';

const decimalTransformer = {
  to: (value: number) => value,
  from: (value: string | null) => (value === null ? 0 : Number(value)),
};

@Entity('invoices')
export class Invoice {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    name: 'invoice_number',
    type: 'varchar',
    length: 30,
    unique: true,
  })
  invoiceNumber: string;

  @Column({ name: 'job_card_id', type: 'uuid', unique: true })
  jobCardId: string;

  @ManyToOne(() => JobCard, { eager: false })
  @JoinColumn({ name: 'job_card_id' })
  jobCard: JobCard;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
    transformer: decimalTransformer,
  })
  subtotal: number;

  @Column({
    name: 'vat_total',
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
    transformer: decimalTransformer,
  })
  vatTotal: number;

  @Column({
    name: 'grand_total',
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
    transformer: decimalTransformer,
  })
  grandTotal: number;

  @Column({ name: 'due_date', type: 'date', nullable: true })
  dueDate: string | null;

  @Column({ name: 'created_by_id', type: 'uuid', nullable: true })
  createdById: string | null;

  @ManyToOne(() => User, { eager: false })
  @JoinColumn({ name: 'created_by_id' })
  createdBy: User | null;

  @OneToMany(() => InvoiceItem, (item) => item.invoice, {
    cascade: true,
  })
  items: InvoiceItem[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
