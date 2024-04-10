import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { TrialsService } from "../trials.service";
import { Observable } from "rxjs";
import { UserInfos } from "src/users/entities/user-info.entity";

@Injectable()
export class MyTrialsGuard implements CanActivate {
    constructor(private trialsService: TrialsService) {} 
    
    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        console.log(request)
        const user = request.user as UserInfos;
        console.log(user)
        const trialsId = request.params.trialsId

        const myTrial = await this.trialsService.isMyTrials(user.id, trialsId)
        return !!myTrial
    }
}