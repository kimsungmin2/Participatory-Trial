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
import { ChannelTypeDto } from './dto/channel.dto';
import { WsJwtGuard } from '../utils/guard/ws.guard';
import { ChatsService } from '../chats/chats.service';
import { CustomSocket } from '../utils/interface/socket.interface';
import { VotesService } from '../trials/vote/vote.service';

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
  ) {}

  @SubscribeMessage('join')
  async handleJoinMessage(socket: Socket, roomId: string) {
    socket.join(roomId);
    socket.broadcast.to(roomId).emit('enter', { userId: socket.id });
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('joinRoom')
  async handleJoinRoom(
    @MessageBody() data: { roomId: string; channelTypeDto: ChannelTypeDto },
    @ConnectedSocket() socket: Socket,
  ) {
    const { roomId } = data;
    socket.join(roomId);
    this.server.to(roomId).emit(`${roomId}토론방에 입장하였습니다.`);
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

    try {
      await this.chatsService.createChannelChats(
        data.channelType,
        userId,
        data.message,
        data.roomId,
      );

      this.server.to(data.roomId.toString()).emit('message', {
        userId,
        message: data.message,
      });
    } catch (error) {
      console.error('채팅 생성 과정에서 오류가 발생했습니다:', error);
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
    const userId = socket.userId;

    try {
      await this.votesService.addVoteUserorNanUser(
        userId,
        data.roomId,
        data.voteFor,
      );
      const votes = await this.votesService.getUserVoteCounts(data.roomId);
      this.server.to(data.roomId.toString()).emit('vote', {
        userId,
        votes: votes,
      });
    } catch (error) {
      console.error('투표 생성 과정에서 오류가 발생했습니다:', error);
      socket.emit('error', '투표 생성에 실패하였습니다.');
    }
  }

  @SubscribeMessage('requestChannel')
  async handleRequestChannel(
    @MessageBody() data: { channelTypes: string; roomId: number },
    @ConnectedSocket() socket: Socket,
  ) {
    try {
      const chats = await this.chatsService.getChannel(
        data.channelTypes,
        data.roomId,
      );
      const votes = await this.votesService.getUserVoteCounts(data.roomId);
      socket.emit('channelsResponse', { chats, votes });
    } catch (error) {
      console.error('채팅 메시지 조회 과정에서 오류가 발생했습니다:', error);
      socket.emit('error', '채팅 메시지 조회에 실패하였습니다.');
    }
  }

  @SubscribeMessage('userConnect')
  handleConnection(socket: Socket) {
    const request = socket.request;
    const cookies = request.headers.cookie;
    console.log(cookies);
    console.log(`Client connected: ${socket.id}`);
    console.log(`Cookies: ${cookies}`);
  }
  @SubscribeMessage('userDisconnect')
  handleDisconnect(socket: Socket) {
    console.log(`123Client disconnected: ${socket.id}`);
  }
}
