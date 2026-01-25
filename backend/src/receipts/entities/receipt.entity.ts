import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('receipts')
export class Receipt {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  file_path: string;

  @Column()
  file_name: string;

  @Column()
  mime_type: string;

  @CreateDateColumn()
  uploaded_at: Date;
}
