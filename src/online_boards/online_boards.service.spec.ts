import { Test, TestingModule } from '@nestjs/testing';
import { OnlineBoardsService } from './online_boards.service';
import { Repository } from 'typeorm';
import { OnlineBoards } from './entities/online_board.entity';
import { UsersService } from 'src/users/users.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UserInfos } from 'src/users/entities/user-info.entity';
import { CreateOnlineBoardDto } from './dto/create-online_board.dto';
import { Users } from 'src/users/entities/user.entity';

describe('OnlineBoardsService', () => {
  let service: OnlineBoardsService;
  let onlineBoardsRepository: Repository<OnlineBoards>;
  let usersService: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OnlineBoardsService,
        UsersService,
        {
          provide: getRepositoryToken(OnlineBoards),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(UserInfos),
          useClass: Repository,
        },
      ],
    }).compile();

    service = module.get<OnlineBoardsService>(OnlineBoardsService);
    onlineBoardsRepository = module.get<Repository<OnlineBoards>>(
      getRepositoryToken(OnlineBoards),
    );
    usersService = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create a new board', async () => {
    // 테스트에 필요한 데이터 생성
    const dto: CreateOnlineBoardDto = {
      title: 'Test Board',
      content: 'Test content',
    };

    const userInfo: UserInfos = {
      id: 1,
      email: 'aaaa@gmail.com',
      password: '1234',
      nickName: '프로현질러',
      birth: '2000-10-10',
      provider: '1234',
      verifiCationCode: 1234,
      emailVerified: true,
      createdAt: '2024-04-02',
      updatedAt: ,
      user: Users,
    };

    // 사용자 서비스가 findByUserId 메서드를 호출했을 때 반환할 사용자 정보 설정
    const expectedResult = { id: 1, ...dto };
    jest.spyOn(usersService, 'findByUserId').mockResolvedValue(userInfo);

    // 저장소에서 save 메서드를 호출했을 때 반환할 결과 설정
    jest
      .spyOn(onlineBoardsRepository, 'save')
      .mockResolvedValue(expectedResult);

    // 서비스 메서드 실행 및 결과 확인
    const result = await service.createBoard(dto, userInfo);
    expect(result).toEqual(expectedResult);
  });
});
