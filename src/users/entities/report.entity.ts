import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({ name: 'report' })
export class Reports {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  content: string;

  @Column()
  userId: number;

  @Column()
  onlineBoardId: number;

  @Column()
  onlineBoardCommentId: number;

  @Column()
  trialId: number;

  @Column()
  humorBoardId: number;

  @CreateDateColumn()
  createdAt: Date;
}
