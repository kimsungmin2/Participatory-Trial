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

@Entity()
export class Votes {
  @PrimaryGeneratedColumn({ type: 'int' })
  id: number;

  @Column({ type: 'int' })
  tiralId: number;

  @Column({ type: 'varchar', nullable: false })
  title1: string;

  @Column({ type: 'varchar', nullable: false })
  title2: string;

  @Column({ type: 'int', nullable: false })
  voteCount1: number;

  @Column({ type: 'int', nullable: false })
  voteCount2: number;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;

  @ManyToOne(() => Trials, (trial) => trial.vote)
  @JoinColumn({ name: 'tiral_id', referencedColumnName: 'id' })
  trial: Trials;
}
