import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Customer } from '../../customers/entities/customer.entity';
import { Invoice } from '../../invoices/entities/invoice.entity';
import { ReceiptVoucher } from '../../receipt-vouchers/entities/receipt-voucher.entity';
import { User } from '../../users/entities/user.entity';
import { PaymentMethod } from './payment-method.entity';

const decimalTransformer = {
  to: (value: number) => value,
  from: (value: string | null) => (value === null ? 0 : Number(value)),
};

export enum ReceivableStatus {
  UNPAID = 'unpaid',
  PAID = 'paid',
}

@Entity('receivables')
export class Receivable {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'customer_id', type: 'uuid' })
  customerId: string;

  @ManyToOne(() => Customer, { eager: false })
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  @Column({ name: 'payment_method_id', type: 'int', nullable: true })
  paymentMethodId: number | null;

  @ManyToOne(() => PaymentMethod, { eager: false })
  @JoinColumn({ name: 'payment_method_id' })
  paymentMethod: PaymentMethod | null;

  @Column({ name: 'invoice_id', type: 'uuid', nullable: true, unique: true })
  invoiceId: string | null;

  @ManyToOne(() => Invoice, { eager: false })
  @JoinColumn({ name: 'invoice_id' })
  invoice: Invoice | null;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    transformer: decimalTransformer,
  })
  amount: number;

  @Column({ name: 'due_date', type: 'date', nullable: true })
  dueDate: string | null;

  @Column({
    type: 'varchar',
    length: 20,
    default: ReceivableStatus.UNPAID,
  })
  status: ReceivableStatus;

  @Column({ name: 'bank_detail', type: 'text', nullable: true })
  bankDetail: string | null;

  @Column({
    name: 'cheque_number',
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  chequeNumber: string | null;

  @Column({ name: 'cheque_date', type: 'date', nullable: true })
  chequeDate: string | null;

  @Column({
    name: 'transaction_reference',
    type: 'varchar',
    length: 200,
    nullable: true,
  })
  transactionReference: string | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ name: 'created_by_id', type: 'uuid', nullable: true })
  createdById: string | null;

  @ManyToOne(() => User, { eager: false })
  @JoinColumn({ name: 'created_by_id' })
  createdBy: User | null;

  @Column({ name: 'paid_at', type: 'timestamptz', nullable: true })
  paidAt: Date | null;

  @OneToOne(() => ReceiptVoucher, (voucher) => voucher.receivable)
  receiptVoucher: ReceiptVoucher | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
