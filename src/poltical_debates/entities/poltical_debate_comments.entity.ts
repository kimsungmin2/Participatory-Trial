import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Users } from '../../users/entities/user.entity';
import { PolticalDebateBoards } from './poltical_debate.entity';

@Entity()
export class PolticalDebateComments {
  @PrimaryGeneratedColumn({ type: 'int' })
  id: number;

  @Column({ type: 'int' })
  polticalDebateId: number;

  @Column({ type: 'int' })
  userId: number;

  @Column({ type: 'varchar', nullable: false })
  content: string;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;

  @ManyToOne(
    () => PolticalDebateBoards,
    (polticalDebateBoard) => polticalDebateBoard.polticalDebateComments,
  )
  @JoinColumn({ name: 'poltical_debate_id', referencedColumnName: 'id' })
  polticalDebateBoard: PolticalDebateBoards;

  @ManyToOne(() => Users, (user) => user.polticalDebateComments)
  @JoinColumn({ name: 'user_id', referencedColumnName: 'id' })
  user: Users;
}
