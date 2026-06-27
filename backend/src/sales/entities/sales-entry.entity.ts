import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Customer } from '../../customers/entities/customer.entity';
import { Invoice } from '../../invoices/entities/invoice.entity';
import { PaymentMethod } from '../../receivables/entities/payment-method.entity';
import { ReceiptVoucher } from '../../receipt-vouchers/entities/receipt-voucher.entity';
import { Receivable } from '../../receivables/entities/receivable.entity';
import { User } from '../../users/entities/user.entity';

const decimalTransformer = {
  to: (value: number) => value,
  from: (value: string | null) => (value === null ? 0 : Number(value)),
};

@Entity('sales_entries')
export class SalesEntry {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'sale_date', type: 'date' })
  saleDate: string;

  @Column({ name: 'receipt_voucher_id', type: 'int', unique: true })
  receiptVoucherId: number;

  @ManyToOne(() => ReceiptVoucher, { eager: false })
  @JoinColumn({ name: 'receipt_voucher_id' })
  receiptVoucher: ReceiptVoucher;

  @Column({ name: 'receivable_id', type: 'int' })
  receivableId: number;

  @ManyToOne(() => Receivable, { eager: false })
  @JoinColumn({ name: 'receivable_id' })
  receivable: Receivable;

  @Column({ name: 'customer_id', type: 'uuid' })
  customerId: string;

  @ManyToOne(() => Customer, { eager: false })
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  @Column({ name: 'invoice_id', type: 'uuid', nullable: true })
  invoiceId: string | null;

  @ManyToOne(() => Invoice, { eager: false })
  @JoinColumn({ name: 'invoice_id' })
  invoice: Invoice | null;

  @Column({ name: 'payment_method_id', type: 'int' })
  paymentMethodId: number;

  @ManyToOne(() => PaymentMethod, { eager: false })
  @JoinColumn({ name: 'payment_method_id' })
  paymentMethod: PaymentMethod;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    transformer: decimalTransformer,
  })
  amount: number;

  @Column({ type: 'varchar', length: 500 })
  description: string;

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
