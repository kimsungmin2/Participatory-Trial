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
import { Trials } from './trial.entity';
import { EachVote } from './Uservote.entity';

@Entity()
export class Votes {
  @PrimaryGeneratedColumn({ type: 'int' })
  id: number;

  @Column({ type: 'int' })
  trialId: number;

  @Column({ type: 'varchar', nullable: false })
  title1: string;

  @Column({ type: 'varchar', nullable: false })
  title2: string;

  @Column({ type: 'int', nullable: false, default: 0 })
  voteCount1: number;

  @Column({ type: 'int', nullable: false, default: 0 })
  voteCount2: number;

  @Column({ type: 'int', nullable: false})
  userCode: number

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;

  @OneToMany(() => EachVote, (eachVote) => eachVote.vote, { cascade: true })
  eachVote: EachVote[];
  
  @ManyToOne(() => Trials, (trial) => trial.vote)
  @JoinColumn({ name: 'trialId', referencedColumnName: 'id' })
  trial: Trials;
}
