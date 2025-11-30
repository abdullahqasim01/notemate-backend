import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { User } from '../common/interfaces/user.interface';

/**
 * Decorator to extract the authenticated user from the request
 * Use: @GetUser() user: User
 */
export const GetUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): User => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
