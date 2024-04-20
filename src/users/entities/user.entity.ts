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
import { OnlineBoardComments } from '../../online_boards/entities/online_board_comment.entity';
import { Trials } from '../../trials/entities/trial.entity';
import { PolticalDebateBoards } from '../../poltical_debates/entities/poltical_debate.entity';
import { PolticalDebateComments } from '../../poltical_debates/entities/poltical_debate_comments.entity';
import { Role } from '../types/userRole.type';
import { EachVote } from '../../trials/entities/Uservote.entity';
import { TrialsChat } from '../../events/entities/trialsChat.entity';
import { EachPolticalVote } from '../../poltical_debates/entities/userVoteOfPoltical_debate.entity';
import { EachHumorVote } from '../../humors/entities/UservoteOfHumorVote.entity';
import { HumorBoards } from '../../humors/entities/humor-board.entity';

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

  @OneToMany(() => EachVote, (eachVote) => eachVote.user, { cascade: true })
  eachVote: EachVote[];

  @OneToMany(
    () => EachPolticalVote,
    (eachPolticalVote) => eachPolticalVote.user,
    { cascade: true },
  )
  eachPolticalVote: EachPolticalVote[];

  @OneToMany(() => EachHumorVote, (eachHumorVote) => eachHumorVote.user, {
    cascade: true,
  })
  eachHumorVote: EachHumorVote[];
  @OneToMany(() => TrialsChat, (trialsChat) => trialsChat.user)
  trialsChat: TrialsChat[];
}
