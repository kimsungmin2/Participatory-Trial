import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Users } from '../../users/entities/user.entity';
import { HumorBoards } from './humor.entity';

@Entity()
export class HumorComments {
  @PrimaryGeneratedColumn({ type: 'int' })
  id: number;

  @Column({ type: 'int' })
  humorBoardId: number;

  @Column({ type: 'int' })
  userId: number;

  @Column({ type: 'varchar', nullable: false })
  content: string;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;

  @ManyToOne(() => HumorBoards, (humorBoard) => humorBoard.humorComment)
  @JoinColumn({ name: 'humor_board_id', referencedColumnName: 'id' })
  humorBoard: HumorBoards;

  @ManyToOne(() => Users, (user) => user.humorBoard)
  @JoinColumn({ name: 'user_id', referencedColumnName: 'id' })
  user: Users;
}
