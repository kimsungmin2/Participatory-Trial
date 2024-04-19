import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
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
    (onlineBoard) => onlineBoard.onlineBoardComment,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'onlineBoardId', referencedColumnName: 'id' })
  onlineBoard: Users;

  @ManyToOne(() => Users, (user) => user.onlineBoard, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId', referencedColumnName: 'id' })
  user: Users;

  @OneToMany(
    () => OnlineBoardComments,
    (onlineboardComment) => onlineboardComment.onlineBoard,
    { onDelete: 'CASCADE' },
  )
  onlineBoardComment: OnlineBoards;
}
