import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Users } from '../../users/entities/user.entity';
import { OnlineBoards } from '../../online_boards/entities/online_board.entity';

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

  @DeleteDateColumn({ type: 'timestamp' })
  deleted_at: Date;

  @ManyToOne(
    () => OnlineBoards,
    (onlineBoard) => onlineBoard.OnlineBoardComment,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'online_board_id', referencedColumnName: 'id' })
  onlineBoard: OnlineBoards;

  @ManyToOne(() => Users, (user) => user.onlineBoard, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id', referencedColumnName: 'id' })
  user: Users;
}
