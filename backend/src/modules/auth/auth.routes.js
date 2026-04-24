import { Router } from 'express';
import * as ctrl from './auth.controller.js';
import { validate } from '../../middlewares/validate.js';
import { requireAuth } from '../../middlewares/auth.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { registerSchema, loginSchema } from './auth.schema.js';

const r = Router();

r.post('/register', validate(registerSchema), asyncHandler(ctrl.register));
r.post('/login', validate(loginSchema), asyncHandler(ctrl.login));
r.get('/me', requireAuth, asyncHandler(ctrl.me));

export default r;
