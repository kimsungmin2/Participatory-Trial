import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Users } from '../../users/entities/user.entity';
import { TrialsChannels } from './trialsChannel.entity';

@Entity()
export class TrialsChat {
  @PrimaryColumn({ type: 'int', unique: true })
  id: number;

  @Column({ type: 'varchar', nullable: false })
  content: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column('int', { name: 'userId', nullable: true })
  userId: number;

  @Column('int', { name: 'ChannelId', nullable: true })
  ChannelId: number;

  @ManyToOne(() => Users, (user) => user.trialsChat, {
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE',
  })
  @JoinColumn([{ name: 'userId', referencedColumnName: 'id' }])
  user: Users;

  @ManyToOne(
    () => TrialsChannels,
    (trialsChannels) => trialsChannels.trialsChat,
    {
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    },
  )
  @JoinColumn([{ name: 'ChannelId', referencedColumnName: 'id' }])
  trialsChannels: TrialsChannels;
}
