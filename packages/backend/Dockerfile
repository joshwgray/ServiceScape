# specialized dockerfile for backend service
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root config
COPY package*.json ./
COPY tsconfig.json ./

# Copy package definitions
COPY packages/backend/package.json ./packages/backend/
COPY packages/shared/package.json ./packages/shared/

# Install dependencies
RUN npm ci

# Copy source code
COPY packages/shared ./packages/shared
COPY packages/backend ./packages/backend

# Build shared package first
WORKDIR /app/packages/shared
RUN npm run build

# Build backend
WORKDIR /app/packages/backend
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/packages/backend/package.json ./packages/backend/
COPY --from=builder /app/packages/shared/package.json ./packages/shared/

# Install only production dependencies
# Note: In workspaces, npm ci --omit=dev might be tricky if shared is a dev dependency?
# Usually shared is a dependency.
# However, local packages need to be present logic.
# Simpler: copy node_modules from builder or reinstall specific deps.
# Copying valid node_modules from builder is easiest for now.
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/packages/shared/package.json ./packages/shared/
COPY --from=builder /app/packages/backend/dist ./packages/backend/dist
COPY --from=builder /app/packages/backend/package.json ./packages/backend/

WORKDIR /app/packages/backend

EXPOSE 3000

CMD ["node", "dist/index.js"]
