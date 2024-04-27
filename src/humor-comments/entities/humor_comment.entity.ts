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
import { HumorBoards } from '../../humors/entities/humor-board.entity';

@Entity()
export class HumorComments {
  @PrimaryGeneratedColumn({ type: 'int' })
  id: number;

  @Column({ type: 'int' })
  humorBoardId: number;

  @Column({ type: 'int' })
  userId: number;

  @Column({ type: 'varchar', nullable: false })
  content: string;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;

  @ManyToOne(() => HumorBoards, (humorBoard) => humorBoard.humorComment)
  @JoinColumn({ name: 'humorBoardId', referencedColumnName: 'id' })
  humorBoard: HumorBoards;

  // @ManyToOne(() => Users, (user) => user.humorComment)
  // @JoinColumn({ name: 'userId', referencedColumnName: 'id' })
  // user: Users;
}
