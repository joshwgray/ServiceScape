#!/bin/bash

# Seed the database with mock organization data

set -e

echo "🌱 ServiceScape Database Seeder"
echo "================================"
echo ""

# Check if database is running
if ! docker ps | grep -q postgres; then
  echo "⚠️  Database is not running."
  echo "   Starting database with docker-compose..."
  cd "$(dirname "$0")/../.." || exit 1
  docker-compose up -d
  
  # Wait for database to be ready
  echo "   Waiting for database to be ready..."
  sleep 3
else
  echo "✓ Database is running"
fi

# Run migrations
echo ""
echo "Running database migrations..."
cd "$(dirname "$0")/.." || exit 1
npm run migrate

# Run seed script
echo ""
echo "Running seed script..."
npm run seed:run

echo ""
echo "🎉 Seeding complete!"
