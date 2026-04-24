export class AppError extends Error {
  constructor(message, statusCode = 400, code = 'BAD_REQUEST', details) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export const NotFound = (msg = 'Not found') => new AppError(msg, 404, 'NOT_FOUND');
export const Unauthorized = (msg = 'Unauthorized') => new AppError(msg, 401, 'UNAUTHORIZED');
export const Forbidden = (msg = 'Forbidden') => new AppError(msg, 403, 'FORBIDDEN');
export const Conflict = (msg = 'Conflict') => new AppError(msg, 409, 'CONFLICT');
export const BadRequest = (msg = 'Bad request', details) => new AppError(msg, 400, 'BAD_REQUEST', details);
