// import { Test, TestingModule } from '@nestjs/testing';
// import { FcmService } from './fcm.service';
// import { ConfigService } from '@nestjs/config';
// import { RedisService } from '../cache/redis.service';
// import { Repository } from 'typeorm';
// import { getRepositoryToken } from '@nestjs/typeorm';

// import * as admin from 'firebase-admin';
// import { Clients } from '../users/entities/client.entity';
// import { Trials } from '../trials/entities/trial.entity';
// import { HumorBoards } from '../humors/entities/humor-board.entity';
// import { PolticalDebateBoards } from '../poltical_debates/entities/poltical_debate.entity';
// import { OnlineBoards } from '../online_boards/entities/online_board.entity';

// jest.mock('firebase-admin', () => ({
//   messaging: () => ({
//     send: jest.fn(),
//   }),
//   credential: {
//     cert: jest.fn(),
//   },
//   initializeApp: jest.fn(),
// }));

// describe('FcmService', () => {
//   let service: FcmService;
//   let mockConfigService: Partial<ConfigService>;
//   let mockTrialsRepository: Partial<Repository<Trials>>;

//   const mockClientsRepository = {
//     findOne: jest.fn(),
//   };
//   beforeEach(async () => {
//     mockConfigService = {
//       get: jest
//         .fn()
//         .mockImplementation((key) =>
//           key === 'FIREBASE_PRIVATE_KEY' ? 'key' : 'value',
//         ),
//     };
//     const mockCluster = {
//       get: jest.fn(),
//       set: jest.fn(),
//     };
//     const mockRedisService = {
//       getCluster: jest.fn(() => mockCluster),
//     };

//     mockTrialsRepository = { findOne: jest.fn() };

//     const module: TestingModule = await Test.createTestingModule({
//       providers: [
//         FcmService,
//         { provide: ConfigService, useValue: mockConfigService },
//         { provide: RedisService, useValue: mockRedisService },
//         {
//           provide: getRepositoryToken(Clients),
//           useValue: mockClientsRepository,
//         },
//         { provide: getRepositoryToken(Trials), useValue: mockTrialsRepository },
//         { provide: getRepositoryToken(HumorBoards), useValue: {} },
//         { provide: getRepositoryToken(PolticalDebateBoards), useValue: {} },
//         { provide: getRepositoryToken(OnlineBoards), useValue: {} },
//       ],
//     }).compile();

//     service = module.get<FcmService>(FcmService);
//   });

//   it('should initialize firebase', () => {
//     expect(admin.initializeApp).toHaveBeenCalled();
//   });

//   it('should send push notification', async () => {
//     const expectedUserId = 123;
//     mockClientsRepository.findOne.mockResolvedValue({
//       pushToken: 'valid_token',
//     });

//     await service.sendPushNotification('trials', 1, 'comment');

//     expect(mockClientsRepository.findOne).toHaveBeenCalledWith({
//       where: { userId: expectedUserId },
//       select: ['pushToken'],
//     });
//     expect(admin.messaging().send).toHaveBeenCalledWith(expect.any(Object)); // Adjust based on actual expected payload
//   });

//   describe('findByBoardId', () => {
//     it('should handle Redis connection errors', async () => {
//       jest.spyOn(mockRedisService, 'getCluster').mockImplementation(() => {
//         throw new Error('Redis connection failed');
//       });

//       await expect(service.findByBoardId('trials', 1)).rejects.toThrow(
//         'Unable to connect to Redis',
//       );
//     });
//   });
// });
