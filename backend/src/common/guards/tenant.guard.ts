import { Request, Response, NextFunction } from 'express';
import { ForbiddenError } from '../errors/app-error';

export const requireOrganization = (req: Request, _res: Response, next: NextFunction): void => {
  if (!req.user?.organizationId) {
    throw new ForbiddenError('Organization context required');
  }
  next();
};
