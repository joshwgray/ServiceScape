# ServiceScape API - Organization Endpoints

## Overview

RESTful API endpoints for querying ServiceScape organization structure (domains, teams, services).

## Base URL

```
http://localhost:3000/api
```

## Endpoints

### Domains

#### GET /api/domains
List all domains with team counts.

**Response:**
```json
[
  {
    "id": "uuid",
    "name": "Engineering",
    "metadata": {},
    "teamCount": 5,
    "created_at": "2026-01-01T00:00:00.000Z",
    "updated_at": "2026-01-01T00:00:00.000Z"
  }
]
```

#### GET /api/domains/:id
Get a single domain by ID.

**Response:**
```json
{
  "id": "uuid",
  "name": "Engineering",
  "metadata": {},
  "teamCount": 5,
  "created_at": "2026-01-01T00:00:00.000Z",
  "updated_at": "2026-01-01T00:00:00.000Z"
}
```

### Teams

#### GET /api/domains/:domainId/teams
List all teams for a specific domain.

**Response:**
```json
[
  {
    "id": "uuid",
    "domain_id": "uuid",
    "name": "Backend Team",
    "metadata": {},
    "serviceCount": 12,
    "created_at": "2026-01-01T00:00:00.000Z",
    "updated_at": "2026-01-01T00:00:00.000Z"
  }
]
```

#### GET /api/teams/:id
Get a single team by ID with members and service count.

**Response:**
```json
{
  "id": "uuid",
  "domain_id": "uuid",
  "name": "Backend Team",
  "metadata": {},
  "serviceCount": 12,
  "members": [
    {
      "id": "uuid",
      "team_id": "uuid",
      "name": "John Doe",
      "role": "Engineer",
      "email": "john@example.com"
    }
  ],
  "created_at": "2026-01-01T00:00:00.000Z",
  "updated_at": "2026-01-01T00:00:00.000Z"
}
```

### Services

#### GET /api/teams/:teamId/services
List all services for a specific team.

**Response:**
```json
[
  {
    "id": "uuid",
    "team_id": "uuid",
    "name": "API Gateway",
    "type": "REST",
    "tier": "T1",
    "metadata": {},
    "upstreamCount": 3,
    "downstreamCount": 5,
    "created_at": "2026-01-01T00:00:00.000Z",
    "updated_at": "2026-01-01T00:00:00.000Z"
  }
]
```

#### GET /api/services/:id
Get a single service by ID with dependency counts.

**Response:**
```json
{
  "id": "uuid",
  "team_id": "uuid",
  "name": "API Gateway",
  "type": "REST",
  "tier": "T1",
  "metadata": {},
  "upstreamCount": 3,
  "downstreamCount": 5,
  "created_at": "2026-01-01T00:00:00.000Z",
  "updated_at": "2026-01-01T00:00:00.000Z"
}
```

#### GET /api/services
List all services across all teams.

**Response:**
```json
[
  {
    "id": "uuid",
    "team_id": "uuid",
    "name": "API Gateway",
    "type": "REST",
    "tier": "T1",
    "metadata": {},
    "created_at": "2026-01-01T00:00:00.000Z",
    "updated_at": "2026-01-01T00:00:00.000Z"
  }
]
```

## Error Responses

### 404 Not Found
```json
{
  "error": "Domain not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Failed to fetch domains"
}
```

## Architecture

The API follows a layered architecture:

1. **Repository Layer** (`src/repositories/`): Pure SQL queries, database access
   - `domainRepository.ts`
   - `teamRepository.ts`
   - `serviceRepository.ts`
   - `memberRepository.ts`
   - `dependencyRepository.ts`

2. **Service Layer** (`src/services/`): Business logic, computed fields
   - `organizationService.ts` - Adds counts (team count, service count, dependency counts)

3. **Route Layer** (`src/routes/`): HTTP endpoints, request/response handling
   - `domains.ts`
   - `teams.ts`
   - `services.ts`

## Testing

All endpoints have comprehensive test coverage:
- Repository layer: Unit tests with mocked database
- Service layer: Unit tests with mocked repositories
- Route layer: Integration tests with supertest

Run tests:
```bash
npm test
```

## Database Schema

See `src/db/migrations/001_initial_schema.sql` for table definitions.

Key tables:
- `domains` - Top-level organizational units
- `teams` - Teams within domains
- `services` - Services owned by teams
- `members` - People on teams
- `dependencies` - Service dependencies (upstream/downstream)
