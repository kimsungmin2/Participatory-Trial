import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { PolticalDebateBoards } from './poltical_debate.entity';
import { EachPolticalVote } from './userVoteOfPoltical_debate.entity';

@Entity()
export class PolticalDebateVotes {
  @PrimaryGeneratedColumn({ type: 'int' })
  id: number;

  @Column({ type: 'int' })
  polticalId: number;

  @Column({ type: 'varchar', nullable: false })
  title1: string;

  @Column({ type: 'varchar', nullable: false })
  title2: string;

  @Column({ type: 'int', nullable: false, default: 0 })
  voteCount1: number;

  @Column({ type: 'int', nullable: false, default: 0 })
  voteCount2: number;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;

  @OneToMany(
    () => EachPolticalVote,
    (eachPolticalVote) => eachPolticalVote.polticalDebateVotes,
    { cascade: true },
  )
  eachPolticalVote: EachPolticalVote[];

  @OneToOne(
    () => PolticalDebateBoards,
    (polticalDebateBoards) => polticalDebateBoards.polticalDebateVotes,
  )
  @JoinColumn({ name: 'polticalId', referencedColumnName: 'id' })
  polticalDebateBoards: PolticalDebateBoards;
}
