import { Req, UseGuards } from '@nestjs/common';
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
import { v4 as uuidv4 } from 'uuid';
import { Redis } from 'ioredis';
import { createAdapter } from 'socket.io-redis';

@WebSocketGateway({
  namespace: '',
  cors: {
    origin: '*',
    credentials: true,
  },
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() public server: Server;
  private redisSubClient: Redis;

  constructor(
    private readonly chatsService: ChatsService,
    private readonly votesService: VotesService,
  ) {
    this.redisSubClient = new Redis({
      host: process.env.REDIS_HOST,
      port: Number(process.env.REDIS_PORT),
    });
  }

  async onModuleInit() {
    const pubClient = new Redis({
      host: process.env.REDIS_HOST,
      port: Number(process.env.REDIS_PORT),
    });
    const subClient = pubClient.duplicate();
    this.server.adapter(createAdapter(pubClient as any, subClient as any));

    await this.redisSubClient.subscribe('notifications');
    this.redisSubClient.on(
      'message',
      this.handleNotificationMessage.bind(this),
    );
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
        userName: user.nickName,
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
      const chats = await this.chatsService.getChannel(
        data.channelTypes,
        data.roomId,
        data.page,
      );

      const votes = await this.votesService.getUserVoteCounts(data.roomId);
      socket.emit('channelsResponse', { chats, votes });
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
