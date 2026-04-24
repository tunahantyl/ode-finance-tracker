import { AppError } from '../utils/AppError.js';

export function notFound(req, res, next) {
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404, 'NOT_FOUND'));
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, _next) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: { message: err.message, code: err.code, details: err.details },
    });
  }

  // Postgres unique violation
  if (err && err.code === '23505') {
    return res.status(409).json({
      error: { message: 'Bu kayıt zaten mevcut.', code: 'CONFLICT' },
    });
  }

  // FK violation
  if (err && err.code === '23503') {
    return res.status(409).json({
      error: { message: 'İlgili kayıt başka bir veriye bağlı, silinemez.', code: 'CONFLICT' },
    });
  }

  console.error('[unhandled]', err);
  res.status(500).json({
    error: { message: 'Beklenmeyen bir sunucu hatası oluştu.', code: 'INTERNAL_ERROR' },
  });
}
