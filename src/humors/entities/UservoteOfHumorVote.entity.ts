import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { HumorVotes } from "./HumorVote.entity";
import { Users } from "src/users/entities/user.entity";

@Entity()
export class EachHumorVote {
    @PrimaryGeneratedColumn({ type: 'int' })
    id: number

    @Column({ type: 'int' })
    humorVoteId: number;

    @Column({ type: 'int', nullable :true})
    userId?: number;

    @Column({type:'varchar', nullable: true})
    userCode?: string;

    @Column({ type :'boolean'})
    voteFor: boolean;

    @CreateDateColumn({ type: 'timestamp'})
    createdAt: Date;

    @ManyToOne(() =>HumorVotes, (humorVotes) => humorVotes.eachHumorVote)
    @JoinColumn({ name: 'humorVoteId', referencedColumnName: 'id'})
    humorVotes: HumorVotes

    @ManyToOne(() => Users, (user) => user.eachHumorVote, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'userId', referencedColumnName: 'id' })
    user: Users


}