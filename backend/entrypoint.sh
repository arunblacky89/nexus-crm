#!/bin/sh
set -e

echo "=== NexusCRM Backend Starting ==="

echo "Waiting for PostgreSQL..."
until python -c "
import psycopg2, os, sys
try:
    psycopg2.connect(
        host=os.environ.get('DB_HOST','db'),
        dbname=os.environ.get('DB_NAME','crm_db'),
        user=os.environ.get('DB_USER','crm_user'),
        password=os.environ.get('DB_PASSWORD','crm_pass'),
        connect_timeout=3
    )
    sys.exit(0)
except Exception as e:
    print(f'DB not ready: {e}')
    sys.exit(1)
"; do
  echo "DB not ready, retrying in 3s..."
  sleep 3
done
echo "PostgreSQL is ready!"

echo "Running makemigrations..."
python manage.py makemigrations --noinput 2>&1 || echo "makemigrations warning (continuing)"

echo "Running migrate..."
python manage.py migrate --noinput 2>&1

echo "Seeding CRM..."
python manage.py seed_crm 2>&1 || echo "Seed warning (may already exist)"

echo "Collecting static files..."
python manage.py collectstatic --noinput 2>&1

echo "=== Starting Gunicorn on 0.0.0.0:8000 ==="
exec gunicorn config.wsgi:application \
  --bind 0.0.0.0:8000 \
  --workers 2 \
  --timeout 120 \
  --access-logfile - \
  --error-logfile -
