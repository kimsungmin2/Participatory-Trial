import { InjectQueue } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bull';
import { TrialsService } from '../trials.service';

@Injectable()
export class TrialsProcessor {
  constructor(
    @InjectQueue('trial-queue') private trialQueue: Queue,
    private trialsService: TrialsService,
  ) {
    this.initializeProcessor();
    this.initializeEventListeners();
  }

  private initializeProcessor() {
    this.trialQueue.process('updateTimeDone', async (job) => {
      const { trialId } = job.data;
      await this.trialsService.updateTimeDone(trialId);
      console.log(`${trialId}번 재판 게시물이 비활성화 되었습니다.`);
    });
  }

  private initializeEventListeners() {
    this.trialQueue.on('completed', (job, result) => {
      console.log(`task ${job.id}is completed. outcome: ${result}`);
    });

    this.trialQueue.on('failed', (job, err) => {
      console.log(`task ${job.id}is failed. outcome: ${err} `);
    });
  }
}
