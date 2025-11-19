# syntax=docker/dockerfile:1

FROM composer:2.8 AS backend-deps
WORKDIR /app
COPY composer.json composer.lock ./
RUN composer install --no-dev --prefer-dist --no-interaction --no-progress
COPY . .
RUN composer dump-autoload --optimize --classmap-authoritative

FROM php:8.3-cli AS backend
WORKDIR /var/www/html
COPY --from=backend-deps /app /var/www/html
RUN apt-get update \
    && apt-get install -y --no-install-recommends git unzip libzip-dev libpng-dev \
    && docker-php-ext-install pdo_mysql zip \
    && rm -rf /var/lib/apt/lists/* \
    && chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache
USER www-data
EXPOSE 8000
CMD ["php", "artisan", "serve", "--host=0.0.0.0", "--port=8000"]

FROM node:20 AS frontend-build
WORKDIR /app
COPY frontend/package*.json ./
RUN npm ci
COPY frontend .
RUN npm run build

FROM node:20-alpine AS frontend
WORKDIR /app
RUN npm install -g serve
COPY --from=frontend-build /app/dist ./dist
EXPOSE 4173
CMD ["serve", "-s", "dist", "-l", "4173"]
