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
import { Votes } from './vote.entity';
import { TrialLike } from './trials.like.entity';

@Entity({
  name: 'trials',
})
export class Trials {
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

  @Column({ type: 'int', nullable: false, default: 0 })
  like: number;

  @Column({ type: 'timestamp' })
  trialTime: Date;

  @Column({ type: 'varchar', nullable: true })
  top_comments: string;

  @Column({ type: 'boolean', nullable: false, default: true })
  is_time_over: boolean;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;

  @DeleteDateColumn({ type: 'timestamp', nullable: true })
  deletedAt: Date;

  @ManyToOne(() => Users, (user) => user.trial, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userId', referencedColumnName: 'id' })
  user: Users;

  @OneToOne(() => Votes, (votes) => votes.trial, { cascade: true })
  votes: Votes;

  @OneToOne(() => TrialLike, (trialLike) => trialLike.trial, { cascade: true })
  trialLike: TrialLike;
}
