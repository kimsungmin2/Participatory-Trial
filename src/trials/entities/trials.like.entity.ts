import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Users } from '../../users/entities/user.entity';
import { Trials } from './trial.entity';

@Entity()
@Index(['trialId', 'userId'], { unique: true })
export class TrialLike {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'int', nullable: false })
  trialId: number;

  @Column({ type: 'int', nullable: false })
  userId: number;

  @ManyToOne(() => Trials, (trials) => trials.trialLike)
  @JoinColumn({ name: 'trialId', referencedColumnName: 'id' })
  trial: Trials;

  @ManyToOne(() => Users, (user) => user.onlineBoardLike)
  @JoinColumn({ name: 'userId', referencedColumnName: 'id' })
  user: Users;

  @Column({ type: 'timestamp' })
  @CreateDateColumn()
  createAt: Date;

  @Column({ type: 'timestamp' })
  @UpdateDateColumn()
  updateAt: Date;
}
