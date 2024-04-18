import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Users } from '../../users/entities/user.entity';
import { PolticalDebateVotes } from './polticalVote.entity';

@Entity()
export class EachPolticalVote {
  @PrimaryGeneratedColumn({ type: 'int' })
  id: number;

  @Column({ type: 'int' })
  polticalVoteId: number;

  @Column({ type: 'int', nullable: true })
  userId?: number;

  @Column({ type: 'varchar', nullable: true })
  userCode?: string;

  @Column({ type: 'boolean' })
  voteFor: boolean;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @ManyToOne(
    () => PolticalDebateVotes,
    (polticalDebateVotes) => polticalDebateVotes.eachPolticalVote,
  )
  @JoinColumn({ name: 'polticalVoteId', referencedColumnName: 'id' })
  polticalDebateVotes: PolticalDebateVotes;

  @ManyToOne(() => Users, (user) => user.eachPolticalVote, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userId', referencedColumnName: 'id' })
  user: Users;
}
