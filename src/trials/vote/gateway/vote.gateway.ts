// // votes.gateway.ts
// import {
//   ConnectedSocket,
//   MessageBody,
//   OnGatewayConnection,
//   OnGatewayDisconnect,
//   SubscribeMessage,
//   WebSocketGateway,
//   WebSocketServer,
// } from '@nestjs/websockets';
// import { Server, Socket } from 'socket.io';
// import { VotesService } from '../vote.service';
// import { ChannelTypeDto } from '../../../events/dto/channel.dto';

// @WebSocketGateway({
//   namespace: '',
//   cors: {
//     origin: '*',
//     credentials: true,
//   },
// })
// export class VotesGatewayimplements
//   implements OnGatewayConnection, OnGatewayDisconnect
// {
//   @WebSocketServer() public server: Server;
//   constructor(private readonly votesService: VotesService) {}

//   @SubscribeMessage('join')
//   async handleJoinMessage(socket: Socket, roomId: string) {
//     socket.join(roomId);
//     socket.broadcast.to(roomId).emit('enter', { userId: socket.id });
//   }

//   @SubscribeMessage('joinRoom')
//   async handleJoinRoom(
//     @MessageBody() data: { roomId: string; channelTypeDto: ChannelTypeDto },
//     @ConnectedSocket() socket: Socket,
//   ) {
//     const { roomId } = data;
//     socket.join(roomId);
//     this.server.to(roomId).emit(`${roomId}토론방에 입장하였습니다.`);
//   }

//   @SubscribeMessage('offer')
//   handleOfferMessage(socket: Socket, { offer, selectedRoom }) {
//     console.log('gg');
//     socket.broadcast
//       .to(selectedRoom)
//       .emit('offer', { userId: socket.id, offer });
//   }

//   @SubscribeMessage('answer')
//   handleAnswerMessage(socket: Socket, { answer, selectedRoom }) {
//     socket.broadcast.to(selectedRoom).emit('answer', {
//       userId: socket.id,
//       answer,
//     });
//   }

//   @SubscribeMessage('userConnect')
//   handleConnection(socket: Socket) {
//     const request = socket.request;
//     const cookies = request.headers.cookie;
//     console.log(cookies);
//     console.log(`Client connected: ${socket.id}`);
//     console.log(`Cookies: ${cookies}`);
//   }

//   @SubscribeMessage('userDisconnect')
//   handleDisconnect(socket: Socket) {
//     console.log(`123Client disconnected: ${socket.id}`);
//   }

//   @SubscribeMessage('icecandidate')
//   handleIcecandidateMessage(socket: Socket, { candidate, selectedRoom }) {
//     console.log('됐나?');
//     socket.broadcast.to(selectedRoom).emit('icecandidate', {
//       userId: socket.id,
//       candidate,
//     });
//   }
// }
