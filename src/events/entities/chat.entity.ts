import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class Chat {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  message: string;

  @Column()
  timestamp: Date;

  @Column()
  userId: number;

  @Column()
  RoomId: number;
}
