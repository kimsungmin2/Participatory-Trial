import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity()
export class Chat {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  message: string;

  @CreateDateColumn()
  timestamp: Date;

  @Column()
  userId: number;

  @Column()
  RoomId: number;

  @Column()
  userName: string;
}
