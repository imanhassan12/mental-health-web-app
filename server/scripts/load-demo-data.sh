#!/bin/bash
# Simple script to run the demo-data.sql file

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
SQL_FILE="${SCRIPT_DIR}/demo-data.sql"

# Load environment variables from .env file if it exists
if [ -f "${SCRIPT_DIR}/../.env" ]; then
  source "${SCRIPT_DIR}/../.env"
fi

# Set default values if not provided in .env
DB_USERNAME=${DB_USERNAME:-root}
DB_PASSWORD=${DB_PASSWORD:-""}
DB_DATABASE=${DB_DATABASE:-mental_health_db}
DB_HOST=${DB_HOST:-127.0.0.1}

echo "🔄 Loading demo data from SQL file..."
echo "📄 SQL file: ${SQL_FILE}"
echo "🔌 Database: ${DB_DATABASE} on ${DB_HOST}"

# Create a temporary file in /tmp to avoid path issues
TMP_SQL_FILE="$(mktemp)"
cp "${SQL_FILE}" "${TMP_SQL_FILE}"
echo "📝 Created temporary SQL file: ${TMP_SQL_FILE}"

# Run the SQL file
if [ -z "$DB_PASSWORD" ]; then
  # No password
  mysql -h "${DB_HOST}" -u "${DB_USERNAME}" "${DB_DATABASE}" < "${TMP_SQL_FILE}"
else
  # With password (export as env var to avoid showing in process list)
  export MYSQL_PWD="${DB_PASSWORD}"
  mysql -h "${DB_HOST}" -u "${DB_USERNAME}" "${DB_DATABASE}" < "${TMP_SQL_FILE}"
  unset MYSQL_PWD
fi

# Check if it was successful
RESULT=$?
# Clean up the temporary file
rm "${TMP_SQL_FILE}"
echo "🧹 Cleaned up temporary file."

if [ $RESULT -eq 0 ]; then
  echo "✅ Demo data loaded successfully!"
  echo ""
  echo "You can now access the application with these accounts:"
  echo "- Username: jsmith, Password: password123"
  echo "- Username: mjohnson, Password: password123"
  exit 0
else
  echo "❌ Failed to load demo data."
  exit 1
fi 