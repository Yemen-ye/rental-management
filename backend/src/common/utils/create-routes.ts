import { Router } from 'express';
import { authenticate } from '../guards/auth.guard';
import { requireOrganization } from '../guards/tenant.guard';
import { asyncHandler } from './async-handler';
import { parsePagination } from './pagination';

type ControllerMethods = {
  findAll?: (req: any, res: any) => Promise<void>;
  findById?: (req: any, res: any) => Promise<void>;
  create?: (req: any, res: any) => Promise<void>;
  update?: (req: any, res: any) => Promise<void>;
  delete?: (req: any, res: any) => Promise<void>;
};

export const createCrudRoutes = (controller: ControllerMethods): Router => {
  const router = Router();

  router.use(authenticate, requireOrganization);

  if (controller.findAll) {
    router.get('/', asyncHandler(async (req, res) => {
      (req as any).pagination = parsePagination(req.query as any);
      await controller.findAll!(req, res);
    }));
  }

  if (controller.findById) {
    router.get('/:id', asyncHandler(async (req, res) => {
      await controller.findById!(req, res);
    }));
  }

  if (controller.create) {
    router.post('/', asyncHandler(async (req, res) => {
      await controller.create!(req, res);
    }));
  }

  if (controller.update) {
    router.put('/:id', asyncHandler(async (req, res) => {
      await controller.update!(req, res);
    }));
  }

  if (controller.delete) {
    router.delete('/:id', asyncHandler(async (req, res) => {
      await controller.delete!(req, res);
    }));
  }

  return router;
};
