import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { TrialsService } from "../trials.service";
import { Observable } from "rxjs";

@Injectable()
export class MyTrialsGuard implements CanActivate {
    constructor(private trialsService: TrialsService) {} 
    
    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const user = request.user;
        const trialsId = request.params.trialsId

        const myTrial = await this.trialsService.isMyTrials(user.id, trialsId)
        return !!myTrial
    }
}