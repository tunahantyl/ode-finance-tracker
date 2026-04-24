import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { Unauthorized } from '../utils/AppError.js';

export function requireAuth(req, _res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) return next(Unauthorized('Token gerekli.'));

  try {
    const payload = jwt.verify(token, env.auth.jwtSecret);
    req.user = { id: payload.sub, email: payload.email };
    next();
  } catch {
    next(Unauthorized('Geçersiz veya süresi dolmuş token.'));
  }
}
