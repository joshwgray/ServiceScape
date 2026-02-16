import { app } from './server.js';
import { config } from 'dotenv';
import { createPool } from './db/connection.js';

// Load environment variables
config();

const PORT = process.env.PORT || 3000;

// Initialize database pool and attach to app
const pool = createPool();
app.locals.pool = pool;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🗄️  Database pool initialized`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing HTTP server and database pool');
  await pool.end();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT signal received: closing HTTP server and database pool');
  await pool.end();
  process.exit(0);
});
