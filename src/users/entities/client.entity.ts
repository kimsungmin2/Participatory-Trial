import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

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

  @Column({ type: 'varchar', nullable: true })
  endpoint: string;

  @Column({ type: 'json', nullable: true })
  keys: {
    p256dh: string;
    auth: string;
  };
}
