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
import { HumorBoards } from './humor-board.entity';
import { EachHumorVote } from './UservoteOfHumorVote.entity';

@Entity()
export class HumorVotes {
  @PrimaryGeneratedColumn({ type: 'int' })
  id: number;

  @Column({ type: 'int' })
  humorId: number;

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

  @OneToMany(() => EachHumorVote, (eachHumorVote) => eachHumorVote.humorVotes, {
    cascade: true,
  })
  eachHumorVote: EachHumorVote[];

  @OneToOne(() => HumorBoards, (humorBoards) => humorBoards.humorVotes)
  @JoinColumn({ name: 'humorId', referencedColumnName: 'id' })
  humorBoards: HumorBoards;
}
