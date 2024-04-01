import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Users } from './user.entity';
import { OnlineBoards } from '../../online_boards/entities/online_board.entity';
import { OnlineBoardComments } from '../../online_boards/entities/online_board_comment.entity';
import { Trials } from '../../trials/entities/trial.entity';
import { HumorBoards } from '../../humors/entities/humor.entity';

@Entity()
export class Reports {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  content: string;

  @Column()
  user_id: number;

  @Column()
  onlineBoard_id: number;

  @Column()
  onlineBoardComment_id: number;

  @Column()
  trial_id: number;

  @Column()
  humorBoard_id: number;

  @CreateDateColumn()
  createdAt: Date;
}
