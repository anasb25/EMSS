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
import { Expense } from '../../expenses/entities/expense.entity';
import { LedgerAccount } from '../../ledger-accounts/entities/ledger-account.entity';
import { Payable } from '../../payables/entities/payable.entity';
import { User } from '../../users/entities/user.entity';
import { Vendor } from '../../vendors/entities/vendor.entity';

const decimalTransformer = {
  to: (value: number) => value,
  from: (value: string | null) => (value === null ? 0 : Number(value)),
};

export enum CashEntryType {
  EXPENSE = 'expense',
  VENDOR_PAYMENT = 'vendor_payment',
  OPENING_ADJUSTMENT = 'opening_adjustment',
  MANUAL = 'manual',
}

export enum CashEntryDirection {
  IN = 'in',
  OUT = 'out',
}

export enum CashAccountType {
  ACCOUNT = 'account',
  VENDOR = 'vendor',
  CUSTOMER = 'customer',
}

@Entity('cash_entries')
export class CashEntry {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'entry_date', type: 'date' })
  entryDate: string;

  @Column({ type: 'varchar', length: 30 })
  type: CashEntryType;

  @Column({ type: 'varchar', length: 10 })
  direction: CashEntryDirection;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    transformer: decimalTransformer,
  })
  amount: number;

  @Column({
    name: 'cash_in',
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
    transformer: decimalTransformer,
  })
  cashIn: number;

  @Column({
    name: 'cash_out',
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
    transformer: decimalTransformer,
  })
  cashOut: number;

  @Column({ type: 'varchar', length: 500 })
  description: string;

  @Column({ name: 'account_type', type: 'varchar', length: 20, nullable: true })
  accountType: CashAccountType | null;

  @Column({ name: 'ledger_account_id', type: 'int', nullable: true })
  ledgerAccountId: number | null;

  @ManyToOne(() => LedgerAccount, { eager: false })
  @JoinColumn({ name: 'ledger_account_id' })
  ledgerAccount: LedgerAccount | null;

  @Column({ name: 'vendor_id', type: 'uuid', nullable: true })
  vendorId: string | null;

  @ManyToOne(() => Vendor, { eager: false })
  @JoinColumn({ name: 'vendor_id' })
  vendor: Vendor | null;

  @Column({ name: 'customer_id', type: 'uuid', nullable: true })
  customerId: string | null;

  @ManyToOne(() => Customer, { eager: false })
  @JoinColumn({ name: 'customer_id' })
  customer: Customer | null;

  @Column({ name: 'sales_person_name', type: 'varchar', length: 200, nullable: true })
  salesPersonName: string | null;

  @Column({ type: 'text', nullable: true })
  remarks: string | null;

  @Column({ name: 'expense_id', type: 'int', nullable: true, unique: true })
  expenseId: number | null;

  @ManyToOne(() => Expense, { eager: false })
  @JoinColumn({ name: 'expense_id' })
  expense: Expense | null;

  @Column({ name: 'payable_id', type: 'int', nullable: true, unique: true })
  payableId: number | null;

  @ManyToOne(() => Payable, { eager: false })
  @JoinColumn({ name: 'payable_id' })
  payable: Payable | null;

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
