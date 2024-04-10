import { DataSource } from 'typeorm';
import { faker } from '@faker-js/faker';
import { Users } from './users/entities/user.entity';
import { UserInfos } from './users/entities/user-info.entity';
import { HumorHallOfFames } from './humors/entities/humor_hall_of_fame.entity';
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
    HumorHallOfFames,
    HumorLike,
    HumorBoards,
    HumorComments,
    OnlineBoardComments,
    OnlineBoards,
    OnlineBoardLike,
    PolticalDebateComments,
    PolticalDebateBoards,
    Trials,
    TrialHallOfFames,
    Votes,
    EachVote,
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
      console.log(`==========[ Dummy Data Creater Started ]==========`);
      // 자유게시판 생성
      for (let i = 0; i < 3; i++) {
        const userId = await getRandomUserId();

        const trial = new Trials();
        trial.title = faker.company.catchPhrase();
        trial.content = faker.lorem.text();
        trial.userId = userId;
        await AppDataSource.manager.save(trial);

        const vote = new Votes();
        vote.title1 = faker.lorem.lines(1);
        vote.title2 = faker.lorem.lines(1);
        vote.trialId = trial.id;
        await AppDataSource.manager.save(vote);

        // 해당 자유게시판에 속하는 댓글 생성
        for (let j = 0; j < 5; j++) {
          const userId = await getRandomUserId();
          const eachVote = new EachVote();
          eachVote.voteId = vote.id;
          eachVote.userId = userId;
          eachVote.voteFor = true;
          await AppDataSource.manager.save(eachVote);
        }
        `${i}-th Dummy Trials and Votes data creation complete.`;
      }
    })
    .catch((error) => console.log(error));
}

createDummyData();
