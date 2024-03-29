import { Test, TestingModule } from '@nestjs/testing';
import { HumorCommentsService } from './humor-comments.service';
import { HumorComments } from './entities/humor_comment.entity';
import { HumorBoards } from '../humors/entities/humor-board.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { MockRepository, createMockRepository } from '../utils/type/mock-type';
import { Role } from '../users/types/userRole.type';
import { UserInfos } from '../users/entities/user-info.entity';
import { OnlineBoards } from '../online_boards/entities/online_board.entity';
import { OnlineBoardComments } from '../online_boards/entities/online_board_comment.entity';
import { Trials } from '../trials/entities/trial.entity';
import { PolticalDebateBoards } from '../poltical_debates/entities/poltical_debate.entity';
import { PolticalDebateComments } from '../poltical_debates/entities/poltical_debate_comments.entity';

const mockedUser = {
  id: 1,
  role: Role.User,
  createdAt: new Date(),
  updatedAt: new Date(),
  userInfo: new UserInfos(),
  onlineBoard: [new OnlineBoards()],
  onlineBoardComment: [new OnlineBoardComments()],
  trial: [new Trials()],
  humorBoard: [new HumorBoards()],
  humorComment: [new HumorComments()],
  polticalDebateBoards: [new PolticalDebateBoards()],
  polticalDebateComments: [new PolticalDebateComments()],
};

const mockRepo = {
  findOne: jest.fn(),
};
describe('HumorCommentsService', () => {
  let humorCommentsService: HumorCommentsService;
  let humorCommentRepository: MockRepository<HumorComments>;
  let humorBoardRepository: MockRepository<HumorBoards>;

  beforeEach(async () => {
    jest.clearAllMocks();
    jest.resetAllMocks();
    humorCommentRepository = createMockRepository<HumorComments>();
    humorBoardRepository = createMockRepository<HumorBoards>();
    console.log(1);
    console.log(humorBoardRepository);
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HumorCommentsService,
        {
          provide: getRepositoryToken(HumorBoards),
          useValue: humorBoardRepository,
        },

        {
          provide: getRepositoryToken(HumorComments),
          useValue: humorCommentRepository,
        },
      ],
    }).compile();
    console.log(2);

    humorCommentsService =
      module.get<HumorCommentsService>(HumorCommentsService);
  }, 100000);

  it('should be defined', () => {
    expect(humorCommentsService).toBeDefined();
  });

  // describe('humorCommentsService Methods', () => {
  //   describe('createComment', () => {
  //     it('success', async () => {
  //       const createHumorCommentDto = {
  //         content: 'mocked comment content',
  //       };
  //       const mockParams = {
  //         boardId: 1,
  //         user: mockedUser,
  //       };
  //       console.log(1);
  //       humorBoardRepository.findOneBy.mockResolvedValue('i am board');
  //       const result = await humorCommentsService.createComment(
  //         createHumorCommentDto,
  //         mockParams.boardId,
  //         mockParams.user,
  //       );
  //       expect(humorBoardRepository.findOneBy).toHaveBeenCalledTimes(1);
  //     });
  //   });
  // });
});
