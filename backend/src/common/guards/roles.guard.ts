import { Request, Response, NextFunction } from 'express';
import { ForbiddenError } from '../errors/app-error';
import { UserRole } from '@prisma/client';

export const authorize = (...roles: UserRole[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new ForbiddenError('Authentication required');
    }
    if (!roles.includes(req.user.role as UserRole)) {
      throw new ForbiddenError('Insufficient permissions');
    }
    next();
  };
};
