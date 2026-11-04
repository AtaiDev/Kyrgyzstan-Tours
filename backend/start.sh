#!/bin/sh
set -e

python manage.py migrate --noinput

if [ -n "$DJANGO_SUPERUSER_USERNAME" ] && [ -n "$DJANGO_SUPERUSER_PASSWORD" ]; then
  python manage.py ensure_superuser || echo "Administrator was not created: check the DJANGO_SUPERUSER_* values above."
fi

# With a persistent external database the demo data baked into the image is not used, so fill the database once, on
# the very first start. It runs in the background so the web server binds its port right away; later starts skip it.
if [ -n "$DATABASE_URL" ] && [ "${SEED_DEMO_IF_EMPTY:-true}" = "true" ]; then
  python manage.py seed_demo --if-empty &
fi

exec gunicorn config.wsgi:application \
  --bind "0.0.0.0:${PORT:-8000}" \
  --workers "${WEB_CONCURRENCY:-2}" \
  --threads 4 \
  --timeout 120 \
  --access-logfile -
