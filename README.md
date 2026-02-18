# ServiceScape 3D City Visualizer

An interactive 3D visualization tool for microservices architecture. ServiceScape transforms service catalogs into a LEGO-style cityscape — domains become colored districts, teams stack into towers, and each service is a brick with studs on top. Dependency edges arc between buildings in real time.

## Features

- **LEGO Cityscape**: Services render as LEGO bricks with studs, teams stack them into towers, and domains form snap-on colored baseplates over a shared green world plate.
- **Authentic LEGO Aesthetic**: Classic LEGO color palette, plastic material shading, and studio-lit toy photography lighting.
- **Dependency Visualization**: Toggle dependency edges (declared vs. observed) with smooth arc routing between buildings.
- **Interactive**: Click buildings to inspect service details; hover for team and domain info.
- **Search & Filter**: Find services, teams, and domains instantly; filter dependency types independently.
- **LOD Rendering**: Level-of-detail system — detailed bricks up close, simplified geometry at distance for smooth performance.
- **camelCase API**: Full snake_case → camelCase conversion layer between PostgreSQL and the frontend API contract.

## Technology Stack

| Layer | Stack |
|---|---|
| Frontend | React 18, TypeScript, Three.js, @react-three/fiber, @react-three/drei, Vite |
| Backend | Node.js, Express, PostgreSQL, Knex |
| Testing | Vitest, React Testing Library |
| DevOps | Docker, Docker Compose |

## Prerequisites

- Node.js 18+
- Docker & Docker Compose

## Local Development

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start Database**:
   ```bash
   docker-compose up -d postgres
   ```

3. **Run Migrations & Seeds**:
   ```bash
   npm run migrate -w @servicescape/backend
   npm run seed -w @servicescape/backend
   ```

4. **Start Development Servers**:
   ```bash
   npm run dev
   ```

5. **Access Application**:
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3000

## Running Tests

```bash
# All packages
npm test

# Backend only
npm test -w @servicescape/backend

# Frontend only
npm test -w @servicescape/frontend
```

## Production Deployment (Docker)

```bash
docker-compose -f docker-compose.prod.yml up --build -d
```

Access the app at http://localhost:8080.

## Project Structure

```
packages/
  backend/      # Express API, PostgreSQL repositories, case-conversion utilities
  frontend/     # React + Three.js 3D scene, LEGO components, stores, hooks
  shared/       # Shared TypeScript types and utilities
plans/          # Implementation plan history
```

### Key Frontend Components

| Component | Role |
|---|---|
| `Scene.tsx` | Three.js canvas, lighting, camera |
| `CityLayout.tsx` | Top-level layout orchestration |
| `Domain.tsx` | District baseplates per domain |
| `Building.tsx` | Tower per team |
| `LegoBrick.tsx` | LEGO brick geometry (box + studs) |
| `LegoBaseplate.tsx` | Instanced stud-grid baseplate |
| `ServiceFloor.tsx` | Single service floor inside a building |
| `DependencyLayer.tsx` | Dependency edge arcs |
| `CameraController.tsx` | Orbit controls and camera reset |

### Key Backend Modules

| Module | Role |
|---|---|
| `routes/` | REST endpoints (`/domains`, `/teams`, `/services`, `/dependencies`) |
| `services/` | Business logic and case-conversion orchestration |
| `repositories/` | PostgreSQL query layer |
| `utils/caseConverters.ts` | snake_case → camelCase API response transformation |

## API Reference

See [packages/backend/API.md](packages/backend/API.md) for full endpoint documentation.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feat/your-feature`)
3. Commit changes following [Conventional Commits](https://www.conventionalcommits.org/)
4. Push and open a Pull Request

## License

MIT
