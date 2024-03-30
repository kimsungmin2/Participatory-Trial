import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Users } from '../../users/entities/user.entity';
import { PolticalDebateBoards } from './poltical_debate.entity';

@Entity()
export class PolticalDebateComments {
  @PrimaryGeneratedColumn({ type: 'int' })
  id: number;

  @Column({ type: 'int' })
  userId: number;

  @Column({ type: 'text', nullable: false })
  content: string;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;

  @ManyToOne(() => Users, (user) => user.polticalDebateComments)
  @JoinColumn({ name: 'user_id', referencedColumnName: 'id' })
  user: Users;

  @ManyToOne(
    () => PolticalDebateBoards,
    (polticalDebateBoard) => polticalDebateBoard.polticalDebateComments,
  )
  @JoinColumn({ name: 'polticalDebateId', referencedColumnName: 'id' })
  polticalDebateBoard: PolticalDebateBoards;
}
