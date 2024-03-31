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
import { HumorBoards } from './humor-board.entity';
import { Users } from '../../users/entities/user.entity';

@Entity()
@Index(['humorBoardId', 'userId'], { unique: true })
export class HumorLike {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'int', nullable: false })
  humorBoardId: number;

  @Column({ type: 'int', nullable: false })
  userId: number;

  @ManyToOne(() => HumorBoards, (humorBoard) => humorBoard.humorLike)
  @JoinColumn({ name: 'humorBoardId', referencedColumnName: 'id' })
  humorBoard: HumorBoards;

  @ManyToOne(() => Users, (user) => user.humorLike)
  @JoinColumn({ name: 'userId', referencedColumnName: 'id' })
  user: Users;

  @Column({ type: 'timestamp' })
  @CreateDateColumn()
  createdAt: Date;

  @Column({ type: 'timestamp' })
  @UpdateDateColumn()
  updatedAt: Date;
}
