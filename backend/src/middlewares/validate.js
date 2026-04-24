import { BadRequest } from '../utils/AppError.js';

export const validate = (schema, source = 'body') => (req, res, next) => {
  const result = schema.safeParse(req[source]);
  if (!result.success) {
    const details = result.error.issues.map((i) => ({
      path: i.path.join('.'),
      message: i.message,
    }));
    return next(BadRequest('Geçersiz veri girişi.', details));
  }
  req[source] = result.data;
  next();
};
