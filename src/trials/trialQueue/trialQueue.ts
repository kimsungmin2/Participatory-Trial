import { InjectQueue } from "@nestjs/bull";
import { Injectable } from "@nestjs/common";
import Bull, { Queue } from "bull";
import { TrialsService } from "../trials.service";

@Injectable()
export class TrialsProcessor {
    constructor(
        @InjectQueue('trial-queue') private trialQueue: Queue,
        private trialsService: TrialsService,
    ) {
        this.initializeProcessor();
    }

    private initializeProcessor() {
        this.trialQueue.process(async (job) => {
            const { trialId } = job.data;
            await this.trialsService.updateTimeDone(trialId)
            console.log(`${trialId}번 재판 게시물이 비활성화 되었습니다.`)
        })
    }
}

