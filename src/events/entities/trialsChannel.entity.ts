import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToMany,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { TrialsChat } from './trialsChat.entity';
import { Trials } from '../../trials/entities/trial.entity';

@Entity()
export class TrialsChannels {
  @PrimaryGeneratedColumn({ type: 'int', name: 'id' })
  id: number;

  @Column('varchar', { name: 'name', length: 30 })
  name: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column('int', { name: 'trialsId', nullable: true })
  trialsId: number;

  @OneToMany(() => TrialsChat, (trialsChat) => trialsChat.trialsChannels)
  trialsChat: TrialsChat[];

  @OneToOne(() => Trials, (trials) => trials.trialsChannels, {
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'id' })
  trials: Trials;
}
