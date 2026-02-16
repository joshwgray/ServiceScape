import { Request, Response, NextFunction } from 'express';

export function requestLogger(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const start = Date.now();
  const timestamp = new Date().toISOString();
  
  // Log incoming request
  console.log(`[${timestamp}] ${req.method} ${req.path || req.url}`);

  // Log when response finishes
  res.on('finish', () => {
    const duration = Date.now() - start;
    const finishTimestamp = new Date().toISOString();
    console.log(
      `[${finishTimestamp}] ${req.method} ${req.path || req.url} ${res.statusCode} - ${duration}ms`
    );
  });

  next();
}
