import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Users } from '../../users/entities/user.entity';
import { PolticalDebateComments } from './poltical_debate_comments.entity';
import { PolticalDebateVotes } from './polticalVote.entity';

@Entity()
export class PolticalDebateBoards {
  @PrimaryGeneratedColumn({ type: 'int' })
  id: number;

  @Column({ type: 'int' })
  userId: number;

  @Column({ type: 'varchar', nullable: false })
  title: string;

  @Column({ type: 'varchar', nullable: false })
  content: string;

  @Column({ type: 'int', nullable: false, default: 0 })
  view: number;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;

  @DeleteDateColumn({ type: 'timestamp', nullable: true })
  deleted_at: Date;

  @ManyToOne(() => Users, (user) => user.polticalDebateBoards)
  @JoinColumn({ name: 'userId', referencedColumnName: 'id' })
  user: Users;

  @OneToMany(
    () => PolticalDebateComments,
    (polticalDebateComment) => polticalDebateComment.polticalDebateBoard,
    { cascade: true },
  )
  polticalDebateComments: PolticalDebateComments[];

  @OneToOne(() => PolticalDebateVotes, (polticalDebateVotes) => polticalDebateVotes.polticalDebateBoards)
  polticalDebateVotes: PolticalDebateVotes
}

