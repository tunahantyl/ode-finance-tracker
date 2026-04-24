import { Router } from 'express';
import * as ctrl from './transactions.controller.js';
import { validate } from '../../middlewares/validate.js';
import { requireAuth } from '../../middlewares/auth.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import {
  createTransactionSchema,
  updateTransactionSchema,
  idParamSchema,
  listQuerySchema,
} from './transactions.schema.js';

const r = Router();
r.use(requireAuth);

r.get('/', validate(listQuerySchema, 'query'), asyncHandler(ctrl.list));
r.get('/:id', validate(idParamSchema, 'params'), asyncHandler(ctrl.getById));
r.post('/', validate(createTransactionSchema), asyncHandler(ctrl.create));
r.patch(
  '/:id',
  validate(idParamSchema, 'params'),
  validate(updateTransactionSchema),
  asyncHandler(ctrl.update)
);
r.delete('/:id', validate(idParamSchema, 'params'), asyncHandler(ctrl.remove));

export default r;
