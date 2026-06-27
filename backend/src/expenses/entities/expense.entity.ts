import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { PaymentMethod } from '../../receivables/entities/payment-method.entity';
import { Vendor } from '../../vendors/entities/vendor.entity';
import { User } from '../../users/entities/user.entity';
import { ExpenseCategory } from './expense-category.entity';

const decimalTransformer = {
  to: (value: number) => value,
  from: (value: string | null) => (value === null ? 0 : Number(value)),
};

@Entity('expenses')
export class Expense {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'expense_date', type: 'date' })
  expenseDate: string;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    transformer: decimalTransformer,
  })
  amount: number;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
    transformer: decimalTransformer,
  })
  subtotal: number;

  @Column({
    name: 'vat_amount',
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
    transformer: decimalTransformer,
  })
  vatAmount: number;

  @Column({ name: 'include_vat', type: 'boolean', default: false })
  includeVat: boolean;

  @Column({
    name: 'vat_percent',
    type: 'decimal',
    precision: 5,
    scale: 2,
    default: 5,
    transformer: decimalTransformer,
  })
  vatPercent: number;

  @Column({ type: 'varchar', length: 500 })
  description: string;

  @Column({ name: 'category_id', type: 'int' })
  categoryId: number;

  @ManyToOne(() => ExpenseCategory, { eager: false })
  @JoinColumn({ name: 'category_id' })
  category: ExpenseCategory;

  @Column({ name: 'payment_method_id', type: 'int' })
  paymentMethodId: number;

  @ManyToOne(() => PaymentMethod, { eager: false })
  @JoinColumn({ name: 'payment_method_id' })
  paymentMethod: PaymentMethod;

  @Column({ name: 'vendor_id', type: 'uuid', nullable: true })
  vendorId: string | null;

  @ManyToOne(() => Vendor, { eager: false })
  @JoinColumn({ name: 'vendor_id' })
  vendor: Vendor | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

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
