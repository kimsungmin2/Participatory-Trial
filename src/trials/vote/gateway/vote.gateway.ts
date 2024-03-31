// // votes.gateway.ts
// import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
// import { Server } from 'socket.io';

// @WebSocketGateway()
// export class VotesGateway {
//   @WebSocketServer()
//   server: Server;

//   sendVoteUpdate(voteResult: any) {
//     this.server.emit('voteUpdate', voteResult);
//   }
// }
