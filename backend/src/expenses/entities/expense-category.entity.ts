import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('expense_categories')
export class ExpenseCategory {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100, unique: true })
  name: string;
}
