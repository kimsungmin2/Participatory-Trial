import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity()
export class Alarm {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  message: string;

  @CreateDateColumn()
  timestamp: Date;

  @Column()
  userId: number;

  @Column()
  boardId: number;
}
