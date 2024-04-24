import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
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
import { HumorVotes } from './HumorVote.entity';

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

  @Column({ type: 'int', nullable: false, default: 0 })
  view: number;

  @Column({ type: 'int', nullable: false, default: 0 })
  like: number;

  @Column({ type: 'varchar', nullable: true })
  imageUrl: string;

  @Column({ type: 'varchar', nullable: true })
  topComments: string;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;

  @DeleteDateColumn({ type: 'timestamp', nullable: true })
  deleted_at: Date;

  @ManyToOne(() => Users, (user) => user.humorBoard)
  @JoinColumn({ name: 'userId', referencedColumnName: 'id' })
  user: Users;

  @OneToMany(() => HumorComments, (humorComment) => humorComment.humorBoard, {
    cascade: true,
  })
  humorComment: HumorComments[];

  @OneToMany(() => HumorLike, (humorLike) => humorLike.humorBoard, {
    cascade: true,
  })
  humorLike: HumorLike[];

  @OneToOne(() => HumorVotes, (humorVotes) => humorVotes.humorBoards)
  humorVotes: HumorVotes;
}
