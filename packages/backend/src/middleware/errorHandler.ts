import { Request, Response, NextFunction } from 'express';

interface ErrorWithStatus extends Error {
  status?: number;
  statusCode?: number;
}

export function errorHandler(
  error: ErrorWithStatus,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Determine status code
  const status = error.status || error.statusCode || 500;

  // Get error message
  const message = error.message || 'Internal Server Error';

  // Log the error
  console.error('Error:', {
    status,
    message,
    stack: error.stack,
    path: req.path,
    method: req.method,
  });

  // Send error response
  res.status(status).json({
    error: message,
    status,
  });
}
