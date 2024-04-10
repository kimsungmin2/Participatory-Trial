import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserInfos } from './user-info.entity';
import { OnlineBoards } from '../../online_boards/entities/online_board.entity';
import { OnlineBoardComments } from '../../online_board_comment/entities/online_board_comment.entity';
import { Trials } from '../../trials/entities/trial.entity';
import { HumorBoards } from '../../humors/entities/humor-board.entity';
import { HumorComments } from '../../humor-comments/entities/humor_comment.entity';
import { PolticalDebateBoards } from '../../poltical_debates/entities/poltical_debate.entity';
import { PolticalDebateComments } from '../../poltical_debates/entities/poltical_debate_comments.entity';
import { Role } from '../types/userRole.type';
import { EachVote } from '../../trials/entities/Uservote.entity';
import { HumorLike } from '../../humors/entities/humor_like.entity';
import { OnlineBoardLike } from '../../online_boards/entities/online_board_like.entity';
import { EachHumorVote } from 'src/humors/entities/UservoteOfHumorVote.entity';
import { EachPolticalVote } from 'src/poltical_debates/entities/userVoteOfPoltical_debate.entity';

@Entity({
  name: 'users',
})
export class Users {
  @PrimaryGeneratedColumn({ type: 'int' })
  id: number;

  @Column({ type: 'enum', enum: Role, default: Role.User })
  role: Role;

  @CreateDateColumn({ type: 'date' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'date' })
  updatedAt: Date;

  @OneToOne(() => UserInfos, (userInfo) => userInfo.user)
  userInfo: UserInfos;

  @OneToMany(() => OnlineBoards, (onlineBoard) => onlineBoard.user)
  onlineBoard: OnlineBoards[];

  @OneToMany(
    () => OnlineBoardComments,
    (onlineBoardComment) => onlineBoardComment.user,
  )
  onlineBoardComment: OnlineBoardComments[];

  @OneToMany(() => Trials, (trial) => trial.user, {
    eager: true,
  })
  trial: Trials[];

  @OneToMany(() => HumorBoards, (humorBoard) => humorBoard.user)
  humorBoard: HumorBoards[];

  @OneToMany(() => HumorComments, (humorComment) => humorComment.user)
  humorComment: HumorComments[];

  @OneToMany(
    () => PolticalDebateBoards,
    (polticalDebateBoards) => polticalDebateBoards.user,
    { cascade: true },
  )
  polticalDebateBoards: PolticalDebateBoards[];

  @OneToMany(
    () => PolticalDebateComments,
    (polticalDebateComments) => polticalDebateComments.user,
    { cascade: true },
  )
  polticalDebateComments: PolticalDebateComments[];

  @OneToMany(
    () => EachVote,
    (eachVote) => eachVote.user,
    { cascade: true },
  )
  eachVote: EachVote[];

  @OneToMany(
    () => EachPolticalVote,
    (eachPolticalVote) => eachPolticalVote.user,
    { cascade: true },
  )
  eachPolticalVote: EachPolticalVote[]

  @OneToMany(
    () => EachHumorVote,
    (eachHumorVote) => eachHumorVote.user,
    { cascade: true },
  )
  eachHumorVote: EachHumorVote[]
  @OneToMany(() => HumorLike, (humorLike) => humorLike.user, {
    cascade: true,
  })
  humorLike: HumorLike[];
  @OneToMany(() => OnlineBoardLike, (onlineBoardLike) => onlineBoardLike.user, {
    cascade: true,
  })
  onlineBoardLike: OnlineBoardLike[];
}
