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
import { Votes } from './vote.entity';

@Entity()
export class Trials {
  @PrimaryGeneratedColumn({ type: 'int' })
  id: number;

  @Column({ type: 'int' })
  userId: number;

  @Column({ type: 'varchar', nullable: false })
  title: string;

  @Column({ type: 'varchar', nullable: false })
  content: string;

  @Column({ type: 'int', nullable: false, default: 1 })
  view: number;

  @Column({ type: 'int', nullable: false, default: 0 })
  like: number;

  @Column({ type: 'varchar', nullable: true })
  top_comments: string;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;

  @ManyToOne(() => Users, (user) => user.trial, {
    onDelete: 'CASCADE'
  })
  @JoinColumn({ name: 'user_id', referencedColumnName: 'id' })
  user: Users;

  @OneToMany(() => Votes, (vote) => vote.trial, { cascade: true })
  vote: Votes[];
}
