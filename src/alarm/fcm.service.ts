// import { Injectable, Logger } from '@nestjs/common';
// import * as admin from 'firebase-admin';
// import { ConfigService } from '@nestjs/config';
// import { UsersService } from 'src/users/users.service';
// import { InjectRepository } from '@nestjs/typeorm';
// import { Repository } from 'typeorm';
// import { Clients } from '../users/entities/client.entity';
// import { Trials } from '../trials/entities/trial.entity';
// import { HumorBoards } from '../humors/entities/humor-board.entity';
// import { PolticalDebateBoards } from '../poltical_debates/entities/poltical_debate.entity';
// import { OnlineBoards } from '../online_boards/entities/online_board.entity';
// import { RedisService } from '../cache/redis.service';

// @Injectable()
// export class FcmService {
//   private readonly logger = new Logger(FcmService.name);
//   private readonly MAX_RETRY_COUNT = 3;
//   private readonly RETRY_DELAYS = [1000, 2000, 4000];

//   constructor(
//     private configService: ConfigService,
//     private readonly redisService: RedisService,
//     @InjectRepository(Clients)
//     private readonly clientsRepository: Repository<Clients>,
//     @InjectRepository(Trials)
//     private readonly trialsRepository: Repository<Trials>,
//     @InjectRepository(HumorBoards)
//     private readonly humorsRepository: Repository<HumorBoards>,
//     @InjectRepository(PolticalDebateBoards)
//     private readonly polticalsRepository: Repository<PolticalDebateBoards>,
//     @InjectRepository(OnlineBoards)
//     private readonly onlineBoardsRepository: Repository<OnlineBoards>,
//   ) {
//     this.initializeFirebase();
//   }
//   // Firebase 초기화
//   private initializeFirebase(): void {
//     try {
//       console.log(1)
//       const privateKey = this.configService
//         .get<string>('FIREBASE_PRIVATE_KEY')
//         .replace(/\\n/g, '\n');
//       admin.initializeApp({
//         credential: admin.credential.cert({
//           projectId: this.configService.get<string>('FIREBASE_PROJECT_ID'),
//           privateKey: privateKey,
//           clientEmail: this.configService.get<string>('FIREBASE_CLIENT_EMAIL'),
//         }),
//       });
//     } catch (error) {
//       this.logger.error('Firebase 초기화 실패, initialization failed:', error);
//     }
//   }

//   async createAlarm(channelType: string, boardId: number, messageType: string) {
//     const writerId = await this.findByBoardId(channelType, boardId);
//     const alarmKey = `alarm:${writerId.userId}`;
//     const alarmIdentifier = `${boardId}:${messageType}`;

//     const timestamp = new Date().getTime();
//     const alarm = {
//       boardId: boardId,
//       channelType: channelType,
//       messageType: messageType,
//     };

//     const alarmValue = JSON.stringify(alarm);

//     try {
//       const redisCluster = this.redisService.getCluster();

//       await redisCluster.zrem(alarmKey, alarmIdentifier);

//       await redisCluster.zadd(alarmKey, timestamp, alarmValue);

//       return true;
//     } catch (error) {
//       console.error('레디스 저장 에러:', error);
//     }
//   }

//   async sendPushNotification(
//     channelType: string,
//     boardId: number,
//     messageType: string,
//   ) {
//     const writer = await this.findByBoardId(channelType, boardId);

//     const token = await this.clientsRepository.findOne({
//       where: { userId: writer.userId },
//       select: ['pushToken'],
//     });
//     console.log(token)

//     let message;
//     switch (messageType) {
//       case 'chat':
//         message = '채팅이';
//         break;
//       case 'comment':
//         message = '댓글이';
//         break;
//       case 'like':
//         message = '좋아요가';
//         break;
//     }

//     const payload = {
//       token: token.pushToken,
//       notification: {
//         title: `국민 참여 재판`,
//         body: `${writer.title} 게시글에 ${message} 추가되었습니다.`,
//       },
//     };
//     console.log(payload, 12313123)
//     try {
//       const response = await admin.messaging().send(payload);
//       console.log(response)

//       this.logger.log(
//         `알림 전송 성공, Notification sent successfully: ${response}`,
//       );
//     } catch (error) {
//       this.logger.error(
//         `알림 전송 실패, Failed to send notification: ${error.message}`,
//       );

//       if (this.isRetryError(error.code)) {
//         this.retrySendPushNotifications(payload, 0, writer.userId);
//       }
//     }
//   }

//   private isRetryError(code: string): boolean {
//     return (
//       code === 'messaging/internal-error' ||
//       code === 'messaging/server-unavailable'
//     );
//   }

//   private async retrySendPushNotifications(
//     payload: any,
//     attempt: number,
//     userId?: number,
//     clientId?: string,
//   ) {
//     if (attempt < this.MAX_RETRY_COUNT) {
//       setTimeout(async () => {
//         try {
//           const response = await admin.messaging().send(payload);

//           this.logger.log(
//             `재시도 성공, 시도 횟수 ${attempt + 1} success: ${response}`,
//           );
//         } catch (error) {
//           this.logger.error(
//             `재시도 실패, 시도 횟수 ${attempt + 1} failed: ${error.message}`,
//           );
//           if (attempt + 1 < this.MAX_RETRY_COUNT) {
//             this.retrySendPushNotifications(
//               payload,
//               attempt + 1,
//               userId,
//               clientId,
//             );
//           } else {
//             this.logger.error('재시도 3회 달성, 재시도 중단.');
//           }
//         }
//       }, this.RETRY_DELAYS[attempt]);
//     }
//   }

//   async findByBoardId(channelType: string, boardId: number) {
//     console.log(channelType, boardId)
//     const cacheKey = `writerId:${channelType}:${boardId}`;

//     const cachedWriterId = await this.redisService.getCluster().get(cacheKey);
//     console.log(cachedWriterId)
//     if (cachedWriterId) {
//       return JSON.parse(cachedWriterId);
//     } else{
//       console.log("연결안됨")
//     }

//     let channelRepository: Repository<any>;
//     console.log(channelType)
//     switch (channelType) {
//       case 'trials':
//         channelRepository = this.trialsRepository;
//         break;
//       case 'humors':
//         channelRepository = this.humorsRepository;
//         break;
//       case 'political-debates':
//         channelRepository = this.polticalsRepository;
//         break;
//       case 'online-boards':
//         channelRepository = this.onlineBoardsRepository;
//         break;
//     }

//     console.log(2)

//     const writerId = await channelRepository.findOne({
//       where: { id: boardId },
//       select: ['userId', 'title'],
//     });

//     console.log(3)

//     await this.redisService
//       .getCluster()
//       .set(cacheKey, JSON.stringify(writerId), 'EX', 60 * 60 * 3);

//     return writerId;
//   }
// }
