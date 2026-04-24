import { Router } from 'express';
import * as ctrl from './categories.controller.js';
import { validate } from '../../middlewares/validate.js';
import { requireAuth } from '../../middlewares/auth.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import {
  createCategorySchema,
  updateCategorySchema,
  idParamSchema,
  listQuerySchema,
} from './categories.schema.js';

const r = Router();
r.use(requireAuth);

r.get('/', validate(listQuerySchema, 'query'), asyncHandler(ctrl.list));
r.post('/', validate(createCategorySchema), asyncHandler(ctrl.create));
r.patch(
  '/:id',
  validate(idParamSchema, 'params'),
  validate(updateCategorySchema),
  asyncHandler(ctrl.update)
);
r.delete('/:id', validate(idParamSchema, 'params'), asyncHandler(ctrl.remove));

export default r;
