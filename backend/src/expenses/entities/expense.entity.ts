import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Currency } from '../../common/enums/currency.enum';
import { Source } from '../../common/enums/source.enum';
import { Category } from '../../common/enums/category.enum';
import { User } from '../../users/entities/user.entity';
import { Receipt } from '../../receipts/entities/receipt.entity';

@Entity('expenses')
export class Expense {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('decimal', { precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'enum', enum: Currency })
  currency: Currency;

  @Column('decimal', { precision: 10, scale: 4, nullable: true })
  exchange_rate: number | null;

  @Column({ type: 'date', nullable: true })
  rate_date: Date | null;

  @Column('decimal', { precision: 10, scale: 2 })
  amount_uah: number;

  @Column({ type: 'date' })
  date: Date;

  @Column({ type: 'enum', enum: Source })
  source: Source;

  @Column({ type: 'enum', enum: Category })
  category: Category;

  @Column('text')
  description: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column()
  user_id: string;

  @ManyToOne(() => Expense, { nullable: true })
  @JoinColumn({ name: 'parent_expense_id' })
  parent_expense: Expense;

  @Column({ nullable: true })
  parent_expense_id: string | null;

  @OneToMany(() => Expense, (expense) => expense.parent_expense)
  children: Expense[];

  @ManyToOne(() => Receipt, { nullable: true })
  @JoinColumn({ name: 'receipt_id' })
  receipt: Receipt;

  @Column({ nullable: true })
  receipt_id: string | null;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
