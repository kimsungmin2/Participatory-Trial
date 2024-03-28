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
import { OnlineBoards } from './online_board.entity';

@Entity()
export class OnlineBoardComments {
  @PrimaryGeneratedColumn({ type: 'int' })
  id: number;

  @Column({ type: 'int' })
  onlineBoardId: number;

  @Column({ type: 'int' })
  userId: number;

  @Column({ type: 'varchar', nullable: false })
  content: string;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;

  @ManyToOne(
    () => OnlineBoards,
    (onlineBoard) => onlineBoard.OnlineBoardComment,
  )
  @JoinColumn({ name: 'online_board_id', referencedColumnName: 'id' })
  onlineBoard: Users;

  @ManyToOne(() => Users, (user) => user.onlineBoard)
  @JoinColumn({ name: 'user_id', referencedColumnName: 'id' })
  user: Users;
}