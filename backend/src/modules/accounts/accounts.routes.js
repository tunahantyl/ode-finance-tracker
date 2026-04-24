import { Router } from 'express';
import * as ctrl from './accounts.controller.js';
import { validate } from '../../middlewares/validate.js';
import { requireAuth } from '../../middlewares/auth.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import {
  createAccountSchema,
  updateAccountSchema,
  idParamSchema,
} from './accounts.schema.js';

const r = Router();

r.use(requireAuth);

r.get('/', asyncHandler(ctrl.list));
r.get('/:id', validate(idParamSchema, 'params'), asyncHandler(ctrl.getById));
r.post('/', validate(createAccountSchema), asyncHandler(ctrl.create));
r.patch(
  '/:id',
  validate(idParamSchema, 'params'),
  validate(updateAccountSchema),
  asyncHandler(ctrl.update)
);
r.delete('/:id', validate(idParamSchema, 'params'), asyncHandler(ctrl.remove));
r.post(
  '/:id/recalculate',
  validate(idParamSchema, 'params'),
  asyncHandler(ctrl.recalculate)
);

export default r;
