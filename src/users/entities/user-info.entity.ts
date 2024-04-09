import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  OneToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Users } from './user.entity';
@Entity({ name: 'userInfos' })
@Index(['email'])
export class UserInfos {
  @PrimaryColumn({ type: 'int' })
  id: number;

  @Column({ type: 'varchar', unique: true, nullable: false })
  email: string;

  @Column({ type: 'varchar', select: false, nullable: false })
  password: string;

  @Column({ type: 'varchar', nullable: false })
  nickName: string;

  @Column({ type: 'varchar', nullable: false })
  birth: string;

  @Column({ type: 'varchar', select: true, nullable: false, default: 'local' })
  provider: string;

  @Column({ type: 'boolean', nullable: false, default: false })
  emailVerified: boolean;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;

  @OneToOne(() => Users, (user) => user.userInfo)
  @JoinColumn({ name: 'id' })
  user: Users;
}
