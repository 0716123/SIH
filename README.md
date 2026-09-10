# SIP Case Tracking System

SIP is a Laravel API and Vite frontend for digital medical case history and patient tracking.

## Project layout

- `sip-case-tracking-system/` - Laravel 12 API
- `sip-frontend/` - Vite frontend

## Requirements

- PHP 8.2+ with `pdo_mysql`, `mbstring`, `openssl`, `xml`, and `fileinfo`
- Composer 2+
- Node.js 18+
- MySQL 5.7+ or MariaDB 10.3+

## Local setup

### Backend

```bash
cd sip-case-tracking-system
copy .env.example .env
composer install
php artisan key:generate
php artisan migrate --seed
php artisan serve
```

The API runs at `http://127.0.0.1:8000`.

### Frontend

In a second terminal:

```bash
cd sip-frontend
npm install
npm run dev
```

The Vite development server runs at `http://localhost:5173` and proxies `/api` to the backend.

## Production checks

```bash
cd sip-case-tracking-system
composer install --no-dev --optimize-autoloader
php artisan config:cache
php artisan route:cache

cd ../sip-frontend
npm ci
npm run build
```

Keep `.env` and all generated dependency/build directories out of Git. Configure the production database, `APP_KEY`, `APP_URL`, CORS origin, and `APP_DEBUG=false` in the deployment environment.