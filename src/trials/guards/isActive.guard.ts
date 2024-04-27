import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { TrialsService } from "../trials.service";

@Injectable()
export class IsActiveGuard implements CanActivate {
    constructor(private trialsService: TrialsService) {} 
    
    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const trialsId = request.params.trialsId

        const myTrial = await this.trialsService.checkIsActiveGuard(trialsId)
        return !!myTrial
    }
}