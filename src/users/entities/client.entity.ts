import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  Unique,
  PrimaryColumn,
} from 'typeorm';

@Entity({ name: 'clients' })
export class Clients {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', nullable: true })
  clientId: string;

  @Column({ type: 'int', nullable: true })
  userId: number;

  @Column({ type: 'varchar', nullable: true })
  pushToken: string;
}
