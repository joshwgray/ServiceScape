# ServiceScape Backend

Backend API server for ServiceScape - a 3D organizational visualization platform.

## Setup

### Prerequisites

- Node.js 20+
- Docker and Docker Compose
- PostgreSQL 15 (or use Docker Compose)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Copy environment file:
```bash
cp .env.example .env
```

3. Start PostgreSQL database:
```bash
docker-compose up -d
```

4. Run database migrations:
```bash
npm run migrate
```

## Development

Start the development server with hot reload:
```bash
npm run dev
```

The server will start on `http://localhost:3000`

## Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run migrate` - Run database migrations
- `npm test` - Run tests
- `npm run test:watch` - Run tests in watch mode
- `npm run typecheck` - Type check without emitting files

## API Endpoints

### Health Check
- `GET /health` - Server health check

Returns:
```json
{
  "status": "healthy",
  "timestamp": "2026-02-16T12:00:00.000Z"
}
```

## Database Schema

The database schema includes five main tables:

- **domains** - Top-level organizational domains
- **teams** - Teams within domains
- **services** - Services owned by teams
- **members** - Team members with roles
- **dependencies** - Service dependencies (DECLARED or OBSERVED)

See `src/db/migrations/001_initial_schema.sql` for full schema details.

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DB_HOST` | PostgreSQL host | localhost |
| `DB_PORT` | PostgreSQL port | 5432 |
| `DB_NAME` | Database name | servicescape |
| `DB_USER` | Database user | servicescape_user |
| `DB_PASSWORD` | Database password | servicescape_pass |
| `PORT` | Server port | 3000 |
| `NODE_ENV` | Environment | development |

## Testing

Run the test suite:
```bash
npm test
```

Run tests in watch mode:
```bash
npm run test:watch
```

## Architecture

- **Express** - Web framework
- **PostgreSQL** - Database
- **TypeScript** - Type safety
- **Vitest** - Testing framework

### Middleware Stack

1. CORS - Cross-origin resource sharing
2. JSON Parser - Parse JSON request bodies
3. Request Logger - Log all requests
4. Error Handler - Global error handling
