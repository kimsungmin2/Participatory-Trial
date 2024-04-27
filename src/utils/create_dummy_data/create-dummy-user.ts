import { DataSource } from 'typeorm';
import { faker } from '@faker-js/faker';
import { Users } from '../../users/entities/user.entity';
import { UserInfos } from '../../users/entities/user-info.entity';
import { HumorsHallOfFame } from '../../humors/entities/humor_hall_of_fame.entity';
import { HumorLike } from '../../humors/entities/humor_like.entity';
import { HumorBoards } from '../../humors/entities/humor-board.entity';
import { OnlineBoardComments } from '../../online_board_comment/entities/online_board_comment.entity';
import { OnlineBoards } from '../../online_boards/entities/online_board.entity';
import { PolticalDebateComments } from '../../poltical_debates/entities/poltical_debate_comments.entity';
import { PolticalDebateBoards } from '../../poltical_debates/entities/poltical_debate.entity';
import { Trials } from '../../trials/entities/trial.entity';
import { OnlineBoardLike } from '../../online_boards/entities/online_board_like.entity';
import { Votes } from '../../trials/entities/vote.entity';
import { EachVote } from '../../trials/entities/Uservote.entity';
import { HumorComments } from '../../humor-comments/entities/humor_comment.entity';
import { TrialHallOfFames } from '../../trials/entities/trial_hall_of_fame.entity';
import { TrialLike } from '../../trials/entities/trials.like.entity';
import { HumorVotes } from '../../humors/entities/HumorVote.entity';
import { EachHumorVote } from '../../humors/entities/UservoteOfHumorVote.entity';
import { PolticalDebateVotes } from '../../poltical_debates/entities/polticalVote.entity';
import { EachPolticalVote } from '../../poltical_debates/entities/userVoteOfPoltical_debate.entity';
import { TrialsChat } from '../../events/entities/trialsChat.entity';

const AppDataSource = new DataSource({
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  username: 'postgres',
  password: 'postgres',
  database: 'optimization',
  entities: [
    Users,
    UserInfos,
    HumorsHallOfFame,
    HumorLike,
    HumorBoards,
    HumorComments,
    OnlineBoardComments,
    OnlineBoards,
    OnlineBoardLike,
    PolticalDebateComments,
    PolticalDebateBoards,
    PolticalDebateVotes,
    Trials,
    TrialLike,
    TrialsChat,
    TrialHallOfFames,
    Votes,
    EachVote,
    HumorVotes,
    EachHumorVote,
    EachPolticalVote,
  ],
  synchronize: true,
  logging: false,
});

async function createDummyData() {
  await AppDataSource.initialize()
    .then(async () => {
      console.log(`==========[ Dummy Data Creater Started ]==========`);
      for (let i = 0; i < 100; i++) {
        const user = new Users();
        const createUser = await AppDataSource.manager.save(user);

        const userInfo = new UserInfos();
        userInfo.nickName = faker.company.name();
        userInfo.email = faker.internet.email();
        userInfo.password = faker.internet.password();
        userInfo.emailVerified = true;
        userInfo.birth = '19950626';
        userInfo.user = user;
        await AppDataSource.manager.save(userInfo);
      }
    })
    .catch((error) => console.log(error));
}

createDummyData();
