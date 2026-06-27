import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  RelationId,
  UpdateDateColumn,
} from 'typeorm';
import { Customer } from '../../customers/entities/customer.entity';
import { Invoice } from '../../invoices/entities/invoice.entity';
import { User } from '../../users/entities/user.entity';
import { PaymentMethod } from '../../receivables/entities/payment-method.entity';
import { Receivable } from '../../receivables/entities/receivable.entity';

const decimalTransformer = {
  to: (value: number) => value,
  from: (value: string | null) => (value === null ? 0 : Number(value)),
};

@Entity('receipt_vouchers')
export class ReceiptVoucher {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    name: 'voucher_number',
    type: 'varchar',
    length: 30,
    unique: true,
  })
  voucherNumber: string;

  @OneToOne(() => Receivable, (receivable) => receivable.receiptVoucher)
  @JoinColumn({ name: 'receivable_id' })
  receivable: Receivable;

  @RelationId((voucher: ReceiptVoucher) => voucher.receivable)
  receivableId: number;

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

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    transformer: decimalTransformer,
  })
  amount: number;

  @Column({ name: 'payment_method_id', type: 'int' })
  paymentMethodId: number;

  @ManyToOne(() => PaymentMethod, { eager: false })
  @JoinColumn({ name: 'payment_method_id' })
  paymentMethod: PaymentMethod;

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

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
