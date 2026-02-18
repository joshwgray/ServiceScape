# ServiceScape 3D City Visualizer

A 3D visualization tool for microservices architecture, transforming service maps into an interactive city layout.

## Features

- **3D Visualization**: Render services, teams, and domains as buildings, floors, and districts.
- **Interactive**: Click to inspect service details, hover for info.
- **Search**: Find services, teams, and domains quickly.
- **Filtering**: Toggle dependency visibility (declared vs observed).
- **Responsive**: Works on desktop and mobile.

## Technology Stack

- **Frontend**: React, TypeScript, Three.js (@react-three/fiber), Vite
- **Backend**: Node.js, Express, PostgreSQL
- **DevOps**: Docker, Docker Compose

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
   - Backend: http://localhost:3000

## Production Deployment (Docker)

1. **Build and Run**:
   ```bash
   docker-compose -f docker-compose.prod.yml up --build -d
   ```

2. **Access Application**:
   - Frontend: http://localhost:8080

## Project Structure

- `packages/backend`: API server and database logic
- `packages/frontend`: React application with 3D scene
- `packages/shared`: Shared TypeScript types and utilities

## Contributing

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request

## License

MIT
