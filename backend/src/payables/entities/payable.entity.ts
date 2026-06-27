import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Bill } from '../../bills/entities/bill.entity';
import { PaymentMethod } from '../../receivables/entities/payment-method.entity';
import { User } from '../../users/entities/user.entity';
import { Vendor } from '../../vendors/entities/vendor.entity';

const decimalTransformer = {
  to: (value: number) => value,
  from: (value: string | null) => (value === null ? 0 : Number(value)),
};

export enum PayableStatus {
  UNPAID = 'unpaid',
  PAID = 'paid',
}

@Entity('payables')
export class Payable {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'vendor_id', type: 'uuid' })
  vendorId: string;

  @ManyToOne(() => Vendor, { eager: false })
  @JoinColumn({ name: 'vendor_id' })
  vendor: Vendor;

  @Column({ name: 'payment_method_id', type: 'int', nullable: true })
  paymentMethodId: number | null;

  @ManyToOne(() => PaymentMethod, { eager: false })
  @JoinColumn({ name: 'payment_method_id' })
  paymentMethod: PaymentMethod | null;

  @Column({ name: 'bill_id', type: 'uuid', nullable: true, unique: true })
  billId: string | null;

  @ManyToOne(() => Bill, { eager: false })
  @JoinColumn({ name: 'bill_id' })
  bill: Bill | null;

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
    default: PayableStatus.UNPAID,
  })
  status: PayableStatus;

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

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
