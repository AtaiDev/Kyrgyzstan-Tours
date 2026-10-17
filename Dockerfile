FROM node:22-slim AS frontend
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

FROM python:3.13-slim
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    DJANGO_SETTINGS_MODULE=config.settings.production \
    DJANGO_SERVE_FRONTEND=true \
    DJANGO_SERVE_MEDIA=true \
    FRONTEND_DIST=/app/frontend/dist \
    SQLITE_PATH=/app/data/db.sqlite3 \
    DJANGO_MEDIA_ROOT=/app/data/media
WORKDIR /app/backend
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
COPY backend/ ./
COPY --from=frontend /app/frontend/dist /app/frontend/dist
ARG BUILD_SECRET_KEY=image-build-step-only-key-replaced-at-runtime-0123456789
RUN mkdir -p /app/data \
    && DJANGO_SECRET_KEY="$BUILD_SECRET_KEY" python manage.py collectstatic --noinput \
    && DJANGO_SECRET_KEY="$BUILD_SECRET_KEY" python manage.py migrate --noinput \
    && DJANGO_SECRET_KEY="$BUILD_SECRET_KEY" python manage.py seed_demo
EXPOSE 8000
CMD ["sh", "start.sh"]
