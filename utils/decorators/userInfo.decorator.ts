import { ExecutionContext, InternalServerErrorException, createParamDecorator } from "@nestjs/common";
import { UserInfos } from "src/users/entities/user-info.entity";

export const UserInfo = createParamDecorator((data: keyof UserInfos | undefined, context: ExecutionContext) => {
    const req = context.switchToHttp().getRequest();

    const userInfo = req.user as UserInfos
    
    if(!userInfo){
        throw new InternalServerErrorException('Request에 user 프로터티가 존재하지 않습니다!');
    }

    if(data){
        return userInfo[data]
    }
    
    return userInfo;
});  