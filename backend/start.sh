#!/bin/sh
set -e

python manage.py migrate --noinput

# Everything that can wait runs once the web server is up. On the free plan (0.1 CPU) another Django start plus the
# admin password hashing add tens of seconds before the site answers, and a visitor waking the service would get
# Render's 502 page instead of the site.
(
  if [ -n "$DJANGO_SUPERUSER_USERNAME" ] && [ -n "$DJANGO_SUPERUSER_PASSWORD" ]; then
    python manage.py ensure_superuser || echo "Administrator was not created: check the DJANGO_SUPERUSER_* values above."
  fi
  # With a persistent external database the demo data baked into the image is not used, so fill the database once,
  # on the very first start; later starts skip it.
  if [ -n "$DATABASE_URL" ] && [ "${SEED_DEMO_IF_EMPTY:-true}" = "true" ]; then
    python manage.py seed_demo --if-empty || echo "Demo content was not loaded: see the error above."
  fi
  # After exec this job becomes gunicorn's child; a non-zero exit would be reported (or even acted on) as a worker failure.
  exit 0
) &

# One preloaded worker: Django is imported once before forking, which on a 0.1 CPU instance gets the first response
# out much sooner. Raise WEB_CONCURRENCY on larger plans.
exec gunicorn config.wsgi:application \
  --bind "0.0.0.0:${PORT:-8000}" \
  --workers "${WEB_CONCURRENCY:-1}" \
  --threads 4 \
  --preload \
  --timeout 120 \
  --access-logfile -
