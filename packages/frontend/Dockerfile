# Frontend build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root config
COPY package*.json ./
COPY tsconfig.json ./

# Copy package manifests (including shared)
COPY packages/frontend/package.json ./packages/frontend/
COPY packages/shared/package.json ./packages/shared/

# Install all dependencies (need dev deps for build)
RUN npm ci

# Copy source
COPY packages/shared ./packages/shared
COPY packages/frontend ./packages/frontend
# Ensure tsconfig is copied for build (it extends root)
COPY packages/frontend/tsconfig.json ./packages/frontend/
COPY packages/shared/tsconfig.json ./packages/shared/

# Build shared
WORKDIR /app/packages/shared
RUN npm run build

# Build frontend
WORKDIR /app/packages/frontend
RUN npm run build

# Production stage
FROM nginx:alpine

# Remove default nginx static assets
RUN rm -rf /usr/share/nginx/html/*

# Copy built assets from builder
COPY --from=builder /app/packages/frontend/dist /usr/share/nginx/html

# Copy custom nginx config if we had one. Standard one works for SPA?
# SPA needs try_files to index.html for routing.
RUN echo 'server { \
    listen 80; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html index.htm; \
        try_files $uri $uri/ /index.html; \
    } \
    location /api/ { \
        proxy_pass http://backend:3000/api/; \
        proxy_set_header Host $host; \
        proxy_set_header X-Real-IP $remote_addr; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
