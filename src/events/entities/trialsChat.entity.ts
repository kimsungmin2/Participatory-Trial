import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Users } from '../../users/entities/user.entity';

@Entity()
@Index(['roomId'])
export class TrialsChat {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', nullable: false })
  message: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column('int', { name: 'userId', nullable: true })
  userId: number;

  @Column('int', { name: 'roomId', nullable: true })
  roomId: number;

  @CreateDateColumn()
  timestamp: Date;

  @Column()
  userName: string;

  @ManyToOne(() => Users, (user) => user.trialsChat, {
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE',
  })
  @JoinColumn([{ name: 'userId', referencedColumnName: 'id' }])
  user: Users;
}