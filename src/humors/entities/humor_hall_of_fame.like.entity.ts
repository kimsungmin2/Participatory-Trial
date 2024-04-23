import {
    Column,
    CreateDateColumn,
    Entity,
    PrimaryColumn,
    UpdateDateColumn,
  } from 'typeorm';
  
  @Entity()
  export class HumorsLikeHallOfFames {
    @PrimaryColumn({ type: 'int', unique: true })
    id: number;
  
    @Column({ type: 'int' })
    userId: number;
  
    @Column({ type: 'varchar', nullable: false })
    title: string;
  
    @Column({ type: 'varchar', nullable: false })
    content: string;
  
    @Column({ type: 'int'})
    total: number;
    
    @CreateDateColumn({ type: 'timestamp' })
    createdAt: Date;
  
    @UpdateDateColumn({ type: 'timestamp' })
    updatedAt: Date;
  }
  