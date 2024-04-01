import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Users } from '../../users/entities/user.entity';
import { OnlineBoardComments } from '../../online_board_comment/entities/online_board_comment.entity';
import { OnlineBoardLike } from './online_board_like.entity';

@Entity()
export class OnlineBoards {
  @PrimaryGeneratedColumn({ type: 'int' })
  id: number;

  @Column({ type: 'int' })
  userId: number;

  @Column({ type: 'varchar', unique: true, nullable: false })
  title: string;

  @Column({ type: 'varchar', nullable: false })
  content: string;

  @Column({ type: 'int', nullable: false })
  view: number;

  @Column({ type: 'int', nullable: false })
  like: number;

  @Column({ type: 'varchar', nullable: true })
  top_comments: string;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;

  @ManyToOne(() => Users, (user) => user.onlineBoard)
  @JoinColumn([{ name: 'userId', referencedColumnName: 'id' }])
  user: Users;

  @OneToMany(
    () => OnlineBoardComments,
    (OnlineBoardComment) => OnlineBoardComment.onlineBoard,
    { cascade: true },
  )
  OnlineBoardComment: OnlineBoardComments[];

  @OneToMany(
    () => OnlineBoardLike,
    (onlineBoardLike) => onlineBoardLike.onlineBoard,
    {
      cascade: true,
    },
  )
  onlineBoardLike: OnlineBoardLike[];
}
