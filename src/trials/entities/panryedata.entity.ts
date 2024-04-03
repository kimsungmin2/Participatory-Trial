import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('판례정보')
export class PanryeInfo {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' }) // BIGINT 사용
  판례정보일련번호: number;

  @Column('text')
  사건명: string;

  @Column('text')
  사건번호: string;

  @Column()
  선고일자: number;

  @Column('text')
  선고: string;

  @Column('text')
  법원명: string;

  @Column('text')
  사건종류명: string;

  @Column('text')
  판결유형: string;

  @Column('text')
  판시사항: string;

  @Column('text')
  판결요지: string;

  @Column('text')
  참조조문: string;

  @Column('text')
  참조판례: string;
}
