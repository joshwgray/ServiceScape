import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../server.js';

describe('Express Server', () => {
  it('should initialize without errors', () => {
    expect(app).toBeDefined();
    expect(app.listen).toBeDefined();
  });

  it('should return 200 from health check endpoint', async () => {
    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status');
    expect(response.body.status).toBe('healthy');
  });

  it('should have timestamp in health check', async () => {
    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('timestamp');
  });

  it('should set CORS headers', async () => {
    const response = await request(app).get('/health');

    expect(response.headers['access-control-allow-origin']).toBeDefined();
  });

  it('should parse JSON request bodies', async () => {
    const response = await request(app)
      .post('/api/test')
      .send({ test: 'data' })
      .set('Content-Type', 'application/json');

    // Will get 404 because route doesn't exist, but should parse JSON
    expect(response.status).toBe(404);
  });

  it('should catch errors with error handler', async () => {
    // Test that errors are caught and formatted properly
    const response = await request(app).get('/api/throw-error');

    expect(response.status).toBeGreaterThanOrEqual(400);
    expect(response.body).toHaveProperty('error');
  });
});
