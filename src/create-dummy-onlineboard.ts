import { DataSource } from 'typeorm';
import { faker } from '@faker-js/faker';
import { Users } from './users/entities/user.entity';
import { UserInfos } from './users/entities/user-info.entity';
import { HumorsHallOfFame } from './humors/entities/humor_hall_of_fame.entity';
import { HumorLike } from './humors/entities/humor_like.entity';
import { HumorBoards } from './humors/entities/humor-board.entity';
import { OnlineBoardComments } from './online_board_comment/entities/online_board_comment.entity';
import { OnlineBoards } from './online_boards/entities/online_board.entity';
import { PolticalDebateComments } from './poltical_debates/entities/poltical_debate_comments.entity';
import { PolticalDebateBoards } from './poltical_debates/entities/poltical_debate.entity';
import { Trials } from './trials/entities/trial.entity';
import { OnlineBoardLike } from './online_boards/entities/online_board_like.entity';
import { Votes } from './trials/entities/vote.entity';
import { EachVote } from './trials/entities/Uservote.entity';
import { HumorComments } from './humor-comments/entities/humor_comment.entity';
import { TrialHallOfFames } from './trials/entities/trial_hall_of_fame.entity';
import { TrialLike } from './trials/entities/trials.like.entity';
import { HumorVotes } from './humors/entities/HumorVote.entity';
import { EachHumorVote } from './humors/entities/UservoteOfHumorVote.entity';
import { PolticalDebateVotes } from './poltical_debates/entities/polticalVote.entity';
import { EachPolticalVote } from './poltical_debates/entities/userVoteOfPoltical_debate.entity';
import { TrialsChat } from './events/entities/trialsChat.entity';

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

async function getRandomUserId() {
  const userRepository = AppDataSource.getRepository(Users);
  const users = await userRepository.find();
  const randomIndex = Math.floor(Math.random() * users.length);
  return users[randomIndex].id; // 무작위로 하나의 사용자 ID 반환
}

async function createDummyData() {
  await AppDataSource.initialize()
    .then(async () => {
      // 자유게시판 생성
      for (let i = 0; i < 3; i++) {
        console.log(
          `==========[ Dummy Online Boards and Comments Data Creater Started ]==========`,
        );
        const userId = await getRandomUserId();

        const onlineBoard = new OnlineBoards();
        onlineBoard.title = faker.company.catchPhrase();
        onlineBoard.content = faker.lorem.text();
        onlineBoard.userId = userId;

        const createOnlineBoard = await AppDataSource.manager.save(onlineBoard);

        // 해당 자유게시판에 속하는 댓글 생성
        for (let j = 0; j < 5; j++) {
          const userId = await getRandomUserId();
          const onlineBoardComment = new OnlineBoardComments();
          onlineBoardComment.content = faker.lorem.sentence(1);
          onlineBoardComment.onlineBoardId = onlineBoard.id;
          onlineBoardComment.onlineBoard = onlineBoard;
          onlineBoardComment.userId = userId;
          const createComment =
            await AppDataSource.manager.save(onlineBoardComment);
        }
      }
    })
    .catch((error) => console.log(error));
}

createDummyData();
