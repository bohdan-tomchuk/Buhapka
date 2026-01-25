import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { JwtPayload, RequestWithUser } from '../types/request-with-user.type';

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): JwtPayload => {
    const request = ctx.switchToHttp().getRequest<RequestWithUser>();
    return request.user;
  },
);
