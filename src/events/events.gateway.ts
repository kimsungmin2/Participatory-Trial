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
import { ChatsService } from '../chats/chats.service';
import { CustomSocket } from '../utils/interface/socket.interface';
import { VotesService } from '../trials/vote/vote.service';
import { Redis } from 'ioredis';
import { OptionalWsJwtGuard } from '../utils/guard/ws.guard';
import { HumorVotesService } from '../humors_votes/humors_votes.service';
import { PolticalVotesService } from '../poltical_debates_vote/poltical_debates_vote.service';
import { LikeService } from '../like/like.service';
import { PushService } from '../alarm/alarm.service';
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
    @Inject('REDIS_SUB_CLIENT') private redisSubClient: Redis,
    private readonly humorVotesService: HumorVotesService,
    private readonly polticalVotesService: PolticalVotesService,
    private readonly likesService: LikeService,
    private readonly pushService: PushService,
  ) {}
  async onModuleInit() {
    await this.redisSubClient.subscribe('notifications', 'userNotifications');
    this.redisSubClient.on('message', (channel, message) => {
      switch (channel) {
        case 'notifications':
          this.server.emit('notification', message);
          console.log('Notification:', message);
          break;
        case 'userNotifications':
          const data = JSON.parse(message);
          const userId = data.userId;
          this.server.to(`user:${userId}`).emit('userNotification', data);
          break;
      }
    });
  }

  @UseGuards(OptionalWsJwtGuard)
  @SubscribeMessage('like')
  async handleLikeEvent(
    @MessageBody() data: { roomId: number; channelType: string },
    @ConnectedSocket() socket: CustomSocket,
  ) {
    const { roomId, channelType } = data;
    const userId = socket.userId;

    try {
      const updatedLikes = await this.likesService.like(
        channelType,
        userId,
        roomId,
      );
      this.server.emit('likesUpdated', { id: roomId, likes: updatedLikes });
    } catch (error) {
      console.error('좋아요 처리 중 오류 발생:', error);
      socket.emit('error', '좋아요 처리에 실패하였습니다.');
    }
  }
  @SubscribeMessage('userNotifications')
  userSendNotification(@MessageBody() message: string) {
    this.server.emit('userNotifications', message);
  }
  handleNotificationMessage(channel: string, message: string) {
    if (channel === 'notifications') {
      this.server.emit('notification', message);
    }
  }
  @SubscribeMessage('join')
  async handleJoinMessage(
    @MessageBody() data: { roomId: number; channelType: string },
    @ConnectedSocket() socket: CustomSocket,
  ) {
    const { roomId, channelType } = data;
    await socket.join(`${channelType}:${roomId}`);
  }
  @SubscribeMessage('userConnect')
  handleConnection(@ConnectedSocket() socket: CustomSocket) {
  }
  @UseGuards(OptionalWsJwtGuard)
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
      const xForwardedFor = socket.request.headers['x-forwarded-for'];
      const ip = Array.isArray(xForwardedFor)
        ? xForwardedFor[0]
        : xForwardedFor;
      const user = await this.chatsService.createChannelChat(
        channelType,
        userId,
        message,
        roomId,
        ip,
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
  @UseGuards(OptionalWsJwtGuard)
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
    const userId = socket.userId;
    const { channelType, roomId, voteFor } = data;
    try {
      const xForwardedFor = socket.request.headers['x-forwarded-for'];
      const ip = Array.isArray(xForwardedFor)
        ? xForwardedFor[0]
        : xForwardedFor;
      if (channelType === 'trials') {
        await this.votesService.addVoteUserorNanUser(
          ip,
          userId,
          roomId,
          voteFor,
        );
        const votes = await this.votesService.getUserVoteCounts(roomId);
        this.server.to(`${channelType}:${roomId}`).emit('vote', {
          userId,
          votes: votes,
        });
      } else if (channelType === 'humors') {
        await this.humorVotesService.addHumorVoteUserorNanUser(
          ip,
          userId,
          roomId,
          voteFor,
        );
        const votes = await this.humorVotesService.getUserVoteCounts(roomId);
        this.server.to(`${channelType}:${roomId}`).emit('vote', {
          userId,
          votes: votes,
        });
      } else if (channelType === 'poltical-debates') {
        await this.polticalVotesService.addPolticalVoteUserorNanUser(
          ip,
          userId,
          roomId,
          voteFor,
        );
        const votes = await this.polticalVotesService.getUserVoteCounts(roomId);
        this.server.to(`${channelType}:${roomId}`).emit('vote', {
          userId,
          votes: votes,
        });
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
  @SubscribeMessage('userDisconnect')
  async handleDisconnect(@ConnectedSocket() socket: CustomSocket) {}
  @SubscribeMessage('notification')
  sendNotification(@MessageBody() message: string) {
    this.server.emit('notification', message);
  }
}
