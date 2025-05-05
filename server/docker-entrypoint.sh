#!/bin/sh
set -e

# Install production dependencies if node_modules is empty (optional)
if [ ! -d "node_modules" ] || [ -z "$(ls -A node_modules)" ]; then
  echo "Installing dependencies..."
  npm install --omit=dev
fi

# Wait for MySQL to be ready
if [ -n "$DB_HOST" ]; then
  echo "Waiting for MySQL at $DB_HOST to be ready..."
  MYSQL_PWD="$DB_PASSWORD"
  until mysqladmin ping -h"$DB_HOST" -P"${DB_PORT:-3306}" -u"$DB_USERNAME" --silent; do
    echo "MySQL is unavailable - sleeping"
    sleep 5
  done
  echo "MySQL is up - continuing"
fi

# Run migrations / seeders (optional - guard with env var)
if [ "$RUN_MIGRATIONS" != "false" ]; then
  echo "Running database migrations/seeds..."
  npm run db:demo-setup || true
  npm run update-passwords || true
  npx sequelize-cli db:seed:all || true
fi

# Start the application
exec "$@" 