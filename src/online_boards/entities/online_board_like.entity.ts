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
import { OnlineBoards } from './online_board.entity';

@Entity()
@Index(['onlineBoardId', 'userId'], { unique: true })
export class OnlineBoardLike {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'int', nullable: false })
  onlineBoardId: number;

  @Column({ type: 'int', nullable: false })
  userId: number;

  @ManyToOne(() => OnlineBoards, (onlineBoard) => onlineBoard.onlineBoardLike)
  @JoinColumn({ name: 'onlineBoardId', referencedColumnName: 'id' })
  onlineBoard: OnlineBoards;

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
