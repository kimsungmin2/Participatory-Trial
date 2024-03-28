

import { SetMetadata } from '@nestjs/common';
import { Role } from 'src/users/types/userRole.type';

export const Roles = (...roles: Role[]) => SetMetadata('roles', roles);
