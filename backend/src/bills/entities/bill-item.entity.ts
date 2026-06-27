import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Bill } from './bill.entity';

const decimalTransformer = {
  to: (value: number) => value,
  from: (value: string | null) => (value === null ? 0 : Number(value)),
};

@Entity('bill_items')
export class BillItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'bill_id', type: 'uuid' })
  billId: string;

  @ManyToOne(() => Bill, (bill) => bill.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'bill_id' })
  bill: Bill;

  @Column({ type: 'varchar', length: 300 })
  description: string;

  @Column({ type: 'text', nullable: true })
  note: string | null;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 1,
    transformer: decimalTransformer,
  })
  quantity: number;

  @Column({
    name: 'unit_price',
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
    transformer: decimalTransformer,
  })
  unitPrice: number;

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

  @Column({
    name: 'line_total',
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
    transformer: decimalTransformer,
  })
  lineTotal: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
