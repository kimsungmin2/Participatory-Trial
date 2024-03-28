import { SetMetadata } from '@nestjs/common';
import { Role } from '../../users/types/userRole.type';

export const Roles = (...roles: Role[]) => SetMetadata('roles', roles);
