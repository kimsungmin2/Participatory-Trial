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
import { OnlineBoardComments } from '../../online_board_comment/entities/online_board_comment.entity';
import { Users } from '../../users/entities/user.entity';

import { OnlineBoardLike } from './online_board_like.entity';

@Entity()
export class OnlineBoards {
  @PrimaryGeneratedColumn({ type: 'int' })
  id: number;

  @Column({ type: 'int' })
  userId: number;

  @Column({ type: 'varchar', unique: false, nullable: false })
  title: string;

  @Column({ type: 'varchar', nullable: false })
  content: string;

  @Column({ type: 'int', nullable: false, default: 1 })
  view: number;

  @Column({ type: 'int', nullable: false, default: 0 })
  like: number;

  @Column({ type: 'varchar', nullable: true })
  imageUrl: string;

  @Column({ type: 'varchar', nullable: true })
  topComments: string;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;

  @DeleteDateColumn({ type: 'timestamp', nullable: true })
  deleted_at: Date;

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
