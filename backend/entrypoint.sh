#!/bin/bash
set -e

echo "Waiting for database..."
while ! python -c "
import psycopg2, os, sys
try:
    psycopg2.connect(
        host=os.environ.get('DB_HOST','db'),
        dbname=os.environ.get('DB_NAME','crm_db'),
        user=os.environ.get('DB_USER','crm_user'),
        password=os.environ.get('DB_PASSWORD','crm_pass')
    )
    sys.exit(0)
except: sys.exit(1)
"; do
  echo "DB not ready, waiting 3s..."
  sleep 3
done
echo "DB ready."

echo "Running migrations..."
python manage.py makemigrations --noinput
python manage.py migrate --noinput

echo "Seeding CRM..."
python manage.py seed_crm

echo "Collecting static files..."
python manage.py collectstatic --noinput

echo "Starting Gunicorn..."
exec gunicorn config.wsgi:application --bind 0.0.0.0:8000 --workers 3 --timeout 120
