import { Inject, Req, UseGuards } from '@nestjs/common';
import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { WsJwtGuard } from '../utils/guard/ws.guard';
import { ChatsService } from '../chats/chats.service';
import { CustomSocket } from '../utils/interface/socket.interface';
import { VotesService } from '../trials/vote/vote.service';
import { Redis } from 'ioredis';
import { HumorVotesService } from '../humors/humors_votes/humors_votes.service';
import { PolticalVotesService } from '../poltical_debates/poltical_debates_vote/poltical_debates_vote.service';

@WebSocketGateway({
  namespace: '',
  cors: {
    origin: '*',
    credentials: true,
  },
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() public server: Server;

  constructor(
    private readonly chatsService: ChatsService,
    private readonly votesService: VotesService,
    private readonly humorVotesService: HumorVotesService,
    private readonly polticalVotesService: PolticalVotesService,
    @Inject('REDIS_SUB_CLIENT') private redisSubClient: Redis,
  ) {}

  async onModuleInit() {
    await this.redisSubClient.subscribe('notifications');
    this.redisSubClient.on('message', (channel, message) => {
      if (channel === 'notifications') {
        this.server.emit('notification', message);
        console.log(message);
      }
    });
  }

  handleNotificationMessage(channel: string, message: string) {
    if (channel === 'notifications') {
      this.server.emit('notification', message);
    }
  }

  @SubscribeMessage('join')
  async handleJoinMessage(
    @MessageBody() data: { roomId: number; channelType: string },
    @ConnectedSocket() socket: Socket,
  ) {
    const { roomId, channelType } = data;

    await socket.join(`${channelType}:${roomId}`);
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('createChat')
  async handleCreateChat(
    @MessageBody()
    data: {
      channelType: string;
      message: string;
      roomId: number;
    },
    @ConnectedSocket() socket: CustomSocket,
  ) {
    const userId = socket.userId;
    const { channelType, roomId, message } = data;
    try {
      const user = await this.chatsService.createChannelChat(
        channelType,
        userId,
        message,
        roomId,
      );

      this.server.to(`${channelType}:${roomId}`).emit('message', {
        userId,
        message,
        userName: user,
      });
    } catch (error) {
      socket.emit('error', '채팅 생성에 실패하였습니다.');
    }
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('createVote')
  async handleCreateVote(
    @MessageBody()
    data: {
      channelType: string;
      roomId: number;
      voteFor: boolean;
    },
    @ConnectedSocket() socket: CustomSocket,
  ) {
    const userCode = socket.id;
    const userId = socket.userId;
    const { channelType, roomId, voteFor } = data;
    try {
      console.log(channelType);
      if (channelType === 'trials') {
        await this.votesService.addVoteUserorNanUser(
          userCode,
          userId,
          roomId,
          voteFor,
        );
        const votes = await this.votesService.getUserVoteCounts(roomId);

        this.server.to(`${channelType}:${roomId}`).emit('vote', {
          userId,
          votes: votes,
        });

        if (votes.totalVotes >= 1) {
          const notificationMessage = `${channelType}의 ${roomId}게시물이 핫합니다.`;
          this.chatsService.publishNotification(notificationMessage);
        }
      } else if (channelType === 'humors') {
        await this.humorVotesService.addHumorVoteUserorNanUser(
          userCode,
          userId,
          roomId,
          voteFor,
        );
        const votes = await this.humorVotesService.getUserVoteCounts(roomId);

        this.server.to(`${channelType}:${roomId}`).emit('vote', {
          userId,
          votes: votes,
        });

        if (votes.totalVotes >= 1) {
          const notificationMessage = `${channelType}의 ${roomId}게시물이 핫합니다.`;
          this.chatsService.publishNotification(notificationMessage);
        }
      } else if (channelType === 'poltical-debates') {
        await this.polticalVotesService.addPolticalVoteUserorNanUser(
          userCode,
          userId,
          roomId,
          voteFor,
        );
        const votes = await this.polticalVotesService.getUserVoteCounts(roomId);

        this.server.to(`${channelType}:${roomId}`).emit('vote', {
          userId,
          votes: votes,
        });

        if (votes.totalVotes >= 1) {
          const notificationMessage = `${channelType}의 ${roomId}게시물이 핫합니다.`;
          this.chatsService.publishNotification(notificationMessage);
        }
      }
    } catch (error) {
      console.error('투표 생성 과정에서 오류가 발생했습니다:', error);
      socket.emit('error', '투표 생성에 실패하였습니다.');
    }
  }

  @SubscribeMessage('requestChannel')
  async handleRequestChannel(
    @MessageBody() data: { channelTypes: string; roomId: number; page: number },
    @ConnectedSocket() socket: Socket,
  ) {
    try {
      const { channelTypes, roomId, page } = data;

      if (channelTypes === 'trials') {
        const chats = await this.chatsService.getChannel(
          channelTypes,
          roomId,
          page,
        );

        const votes = await this.votesService.getUserVoteCounts(data.roomId);
        socket.emit('channelsResponse', { chats, votes });
      } else if (channelTypes === 'humors') {
        const votes = await this.humorVotesService.getUserVoteCounts(
          data.roomId,
        );
        socket.emit('votesResponse', votes);
      } else if (channelTypes === 'poltical-debates') {
        const votes = await this.polticalVotesService.getUserVoteCounts(
          data.roomId,
        );
        socket.emit('votesResponse', votes);
      }
    } catch (error) {
      console.error('채팅 메시지 조회 과정에서 오류가 발생했습니다:', error);
      socket.emit('error', '채팅 메시지 조회에 실패하였습니다.');
    }
  }

  @SubscribeMessage('userConnect')
  handleConnection(socket: CustomSocket) {}

  @SubscribeMessage('userDisconnect')
  async handleDisconnect(@ConnectedSocket() socket: CustomSocket) {}

  @SubscribeMessage('notification')
  sendNotification(@MessageBody() message: string) {
    this.server.emit('notification', message);
  }
}
