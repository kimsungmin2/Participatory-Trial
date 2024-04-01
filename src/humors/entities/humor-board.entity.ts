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
import { HumorComments } from '../../humor-comments/entities/humor_comment.entity';
import { HumorLike } from './humor_like.entity';

@Entity()
export class HumorBoards {
  @PrimaryGeneratedColumn({ type: 'int' })
  id: number;

  @Column({ type: 'int' })
  userId: number;

  @Column({ type: 'varchar', nullable: false })
  title: string;

  @Column({ type: 'varchar', nullable: false })
  content: string;

  @Column({ type: 'int', nullable: false, default: 1 })
  view: number;

  @Column({ type: 'int', nullable: false, default: 1 })
  like: number;

  @Column({ type: 'varchar', nullable: true })
  imageUrl: string;

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

  @OneToMany(() => HumorLike, (humorLike) => humorLike.humorBoard, {
    cascade: true,
  })
  humorLike: HumorLike[];
}
