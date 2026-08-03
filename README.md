# Laravel Inertia Project

Aplikasi ini dibangun menggunakan **Laravel 13** dengan integrasi **Inertia.js** untuk membangun SPA modern tanpa API terpisah.

## 🛠️ Tech Stack

- Laravel 13.x
- PHP 8.3+
- Inertia.js v2
- Intervention Image v3
- Spatie Image Optimizer
- Ziggy

---

## 📁 File Upload Configuration (.env)

Aplikasi ini menggunakan konfigurasi path untuk penyimpanan file upload.

Tambahkan atau sesuaikan variabel berikut di file `.env`:

```env
VITE_FILE_URL=http://localhost:8000/
FILE_PATH=C:\laragon\www\inertia\backend\public\
```

## 🚀 Installation

Clone repository:

```bash
git clone <repo-url>
cd <project-folder>

composer install
npm install

php artisan key:generate

php artisan migrate

php artisan db:seed
```

## ▶️ Running Project
```bash
php artisan serve
npm run dev
```
Default URL aplikasi akan berjalan di:
👉 http://localhost:8000/
