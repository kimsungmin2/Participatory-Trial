import { Socket } from 'socket.io';

export interface CustomSocket extends Socket {
  userId: number;
  cookies: { [key: string]: string };
}
