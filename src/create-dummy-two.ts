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
    OnlineBoardComments,
    OnlineBoards,
    PolticalDebateComments,
    PolticalDebateBoards,
    Trials,
  ],
  synchronize: true,
  logging: false,
});

async function createDummyData() {
  await AppDataSource.initialize()
    .then(async () => {
      console.log(`==========[ Dummy Data Creater Started ]==========`);
      // 자유게시판 생성
      for (let i = 0; i < 100; i++) {
        const onlineBoard = new OnlineBoards();
        onlineBoard.title = faker.company.catchPhrase();
        onlineBoard.content = faker.lorem.text();
        await AppDataSource.manager.save(onlineBoard);

        // 해당 자유게시판에 속하는 댓글 생성
        for (let j = 0; j < 500; j++) {
          const onlineBoardComment = new OnlineBoardComments();
          onlineBoardComment.content = faker.lorem.sentence(1);
          onlineBoardComment.onlineBoard = onlineBoard;
          await AppDataSource.manager.save(onlineBoardComment);
        }
        console.log(
          `${i}-th Dummy Online Boards & Comments data creation complete.`,
        );
      }
    })
    .catch((error) => console.log(error));
}

createDummyData();
