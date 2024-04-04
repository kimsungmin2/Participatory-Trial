import { Injectable, OnModuleInit } from '@nestjs/common';
import { EventsGateway } from '../events/events.gateway';
import Redis from 'ioredis';

@Injectable()
export class RedisPubSubService implements OnModuleInit {
  private redisSubscriber: Redis;

  constructor(private readonly eventsGateway: EventsGateway) {
    this.redisSubscriber = new Redis();
  }

  async onModuleInit() {
    await this.redisSubscriber.subscribe('chatChannel');

    this.redisSubscriber.on('message', (channel, message) => {
      const chatMessage = JSON.parse(message);
      this.eventsGateway.server.to(`/chat`).emit('message', chatMessage);
    });
  }
}
