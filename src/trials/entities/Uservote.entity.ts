import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Users } from '../../users/entities/user.entity';
import { Votes } from './vote.entity';
@Entity()
export class EachVote {
  @PrimaryGeneratedColumn({ type: 'int' })
  id: number;
  @Column({ type: 'int' })
  voteId: number;
  @Column({ type: 'int', nullable: true })
  userId?: number;
  @Column({ type: 'varchar', nullable: true })
  ip?: string;
  @Column({ type: 'boolean' })
  voteFor: boolean;
  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;
  @ManyToOne(() => Votes, (votes) => votes.eachVote, { onDelete: 'CASCADE'  })
  @JoinColumn({ name: 'voteId', referencedColumnName: 'id' })
  votes: Votes;
  @ManyToOne(() => Users, (user) => user.eachVote, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userId', referencedColumnName: 'id' })
  user: Users;
}
