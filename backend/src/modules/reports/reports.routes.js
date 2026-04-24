import { Router } from 'express';
import * as ctrl from './reports.controller.js';
import { validate } from '../../middlewares/validate.js';
import { requireAuth } from '../../middlewares/auth.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import {
  rangeSchema,
  byCategorySchema,
  timelineSchema,
} from './reports.schema.js';

const r = Router();
r.use(requireAuth);

r.get('/summary', validate(rangeSchema, 'query'), asyncHandler(ctrl.summary));
r.get('/by-category', validate(byCategorySchema, 'query'), asyncHandler(ctrl.byCategory));
r.get('/timeline', validate(timelineSchema, 'query'), asyncHandler(ctrl.timeline));
r.get('/recent-transactions', asyncHandler(ctrl.recent));

export default r;
