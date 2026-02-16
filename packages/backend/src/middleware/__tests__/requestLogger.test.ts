import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { requestLogger } from '../requestLogger.js';

describe('Request Logger Middleware', () => {
  let consoleLogSpy: any;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  it('should log request method and path', () => {
    const req = {
      method: 'GET',
      path: '/api/test',
    } as Request;
    const res = {
      on: vi.fn(),
    } as unknown as Response;
    const next = vi.fn() as NextFunction;

    requestLogger(req, res, next);

    expect(consoleLogSpy).toHaveBeenCalled();
    const logCall = consoleLogSpy.mock.calls[0][0];
    expect(logCall).toContain('GET');
    expect(logCall).toContain('/api/test');
    expect(next).toHaveBeenCalled();
  });

  it('should log response status and duration', (done) => {
    const req = {
      method: 'POST',
      path: '/api/create',
    } as Request;
    const res = {
      on: vi.fn((event, callback) => {
        if (event === 'finish') {
          // Simulate response finishing
          setTimeout(() => {
            callback();
            
            // Check that finish was logged
            expect(consoleLogSpy).toHaveBeenCalledTimes(2);
            const finishLog = consoleLogSpy.mock.calls[1][0];
            expect(finishLog).toContain('POST');
            expect(finishLog).toContain('/api/create');
            expect(finishLog).toMatch(/\d+ms/); // Should contain duration
            
            done();
          }, 10);
        }
      }),
      statusCode: 201,
    } as unknown as Response;
    const next = vi.fn() as NextFunction;

    requestLogger(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it('should handle requests without path', () => {
    const req = {
      method: 'GET',
      path: undefined,
    } as unknown as Request;
    const res = {
      on: vi.fn(),
    } as unknown as Response;
    const next = vi.fn() as NextFunction;

    requestLogger(req, res, next);

    expect(consoleLogSpy).toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
  });
});
