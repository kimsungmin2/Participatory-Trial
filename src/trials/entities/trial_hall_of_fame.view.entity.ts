import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    OneToMany,
    OneToOne,
    PrimaryColumn,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
  } from 'typeorm';
  import { Users } from '../../users/entities/user.entity';
  import { Votes } from './vote.entity';
  
  @Entity()
  export class TrialViewHallOfFames {
    @PrimaryColumn({ type: 'int', unique: true })
    id: number;
  
    @Column({ type: 'int' })
    userId: number;
  
    @Column({ type: 'varchar', nullable: false })
    title: string;
  
    @Column({ type: 'varchar', nullable: false })
    content: string;
  
    @Column({ type: 'varchar'})
    totalview: number;
    
    @CreateDateColumn({ type: 'timestamp' })
    createdAt: Date;
  
    @UpdateDateColumn({ type: 'timestamp' })
    updatedAt: Date;
  }
  