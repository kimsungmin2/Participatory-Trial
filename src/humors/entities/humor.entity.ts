import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Users } from '../../users/entities/user.entity';
import { HumorComments } from './humor_comment.entity';

@Entity()
export class HumorBoards {
  @PrimaryGeneratedColumn({ type: 'int' })
  id: number;

  @Column({ type: 'int' })
  userId: number;

  @Column({ type: 'varchar', unique: true, nullable: false })
  title: string;

  @Column({ type: 'varchar', nullable: false })
  content: string;

  @Column({ type: 'int', nullable: false })
  view: number;

  @Column({ type: 'int', nullable: false })
  like: number;

  @Column({ type: 'varchar', nullable: true })
  top_comments: string;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;

  @ManyToOne(() => Users, (user) => user.humorBoard)
  @JoinColumn({ name: 'user_id', referencedColumnName: 'id' })
  user: Users;

  @OneToMany(() => HumorComments, (humorComment) => humorComment.humorBoard, {
    cascade: true,
  })
  humorComment: HumorComments[];
}