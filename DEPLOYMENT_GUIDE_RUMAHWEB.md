# Panduan Deployment SafeCommute ke Rumahweb (cPanel)

Arsitektur aplikasi SafeCommute kini sepenuhnya **HTML5 + PHP 8.4 + CDN JS (Alpine.js, Leaflet) + MariaDB**.  
Aplikasi tidak lagi memerlukan Node.js atau daemon backend, sehingga berjalan lancar pada paket **Shared Hosting (Entry)**.

---

## 1. Struktur File di Server Rumahweb

Pastikan struktur direktori di cPanel Anda seperti berikut:

```text
/home/<username>/
├── safecommute/                     <-- DI LUAR public_html (Aman dari akses publik)
│   ├── .env                         <-- Konfigurasi database & app
│   ├── bootstrap.php
│   ├── cron/
│   │   └── cleanup.php              <-- Script cron job pembersih cache & rate limit
│   ├── migrations/
│   │   └── 001_init.sql             <-- Schema database MariaDB
│   ├── scripts/
│   │   └── seed.php                 <-- Seeder data demo (opsional)
│   └── src/
│       ├── Auth.php
│       ├── Db.php
│       ├── Env.php
│       ├── GeoService.php
│       ├── RateLimiter.php
│       ├── ReportService.php
│       ├── Request.php
│       ├── Response.php
│       ├── Router.php
│       ├── UploadService.php
│       └── VoteService.php
│
└── public_html/                     <-- ROOT WEB (Dapat diakses browser)
    ├── .htaccess                    <-- Routing /api/*, HTTPS, security headers & caching
    ├── index.php                    <-- UI Utama (HTML5 + Alpine.js + Leaflet)
    ├── api/
    │   └── index.php                <-- REST API Front-Controller
    ├── assets/
    │   ├── css/
    │   │   └── src.css              <-- CSS kustom
    │   └── js/
    │       ├── api.js               <-- Client fetch & CSRF token
    │       ├── app.js               <-- State reactive Alpine.js
    │       ├── map.js               <-- Marker, clustering, & routing
    │       └── utils.js             <-- Haversine formula & date formatter
    └── uploads/
        └── hazard-photos/
            └── .htaccess            <-- Proteksi: memblokir eksekusi script PHP
```

---

## 2. Langkah-Langkah Instalasi di cPanel

### Langkah 1: Pilih Versi PHP & Ekstensi
1. Masuk ke **cPanel** > menu **Select PHP Version**.
2. Pilih **PHP 8.4** (atau PHP 8.2/8.3 jika 8.4 belum tersedia).
3. Pastikan ekstensi berikut dicentang:
   - `pdo_mysql`
   - `gd` (dengan dukungan WebP)
   - `fileinfo`
   - `curl`
   - `mbstring`
   - `json`

### Langkah 2: Buat Database MariaDB & Import Tabel
1. Masuk ke cPanel > **MySQL® Database Wizard**.
2. Buat database baru (misal: `safecommute`).
3. Buat user database dan password yang kuat, lalu berikan hak akses **ALL PRIVILEGES**.
4. Buka **phpMyAdmin** > pilih database tersebut > klik tab **Import**.
5. Upload file `safecommute/migrations/001_init.sql` lalu klik **Go**.

### Langkah 3: Konfigurasi File `.env`
1. Upload folder `safecommute/` ke folder home (`/home/<username>/safecommute/`).
2. Duplikat file `.env.example` menjadi `.env`.
3. Buka file `.env` dan isi kredensial database Anda:
   ```env
   APP_ENV=production
   APP_DEBUG=false
   APP_URL=https://namadomainanda.com

   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_NAME=username_safecommute
   DB_USER=username_userdb
   DB_PASS=password_rahasia_anda
   ```

### Langkah 4: Upload File Frontend ke `public_html/`
1. Upload semua isi folder `public_html/` ke direktori `public_html` hosting Anda.
2. Pastikan file `.htaccess` di root `public_html` dan di `public_html/uploads/hazard-photos/.htaccess` ikut terupload.

### Langkah 5: Setup Cron Job Pembersihan (Opsional tapi Direkomendasikan)
Agar log rate limit dan cache rute tidak menumpuk:
1. Buka cPanel > **Cron Jobs**.
2. Set jadwal **Once Per Day** (`0 2 * * *`).
3. Masukkan perintah:
   ```bash
   php /home/<username>/safecommute/cron/cleanup.php >/dev/null 2>&1
   ```

---

## 3. Menjalankan di Lokal (Development / Testing)

Jika ingin mencoba di komputer lokal sebelum upload:
1. Pastikan service MariaDB/MySQL lokal menyala (misal via Laragon atau XAMPP).
2. Buat database `safecommute` dan import `safecommute/migrations/001_init.sql`.
3. Buat file `safecommute/.env` dengan host `127.0.0.1`, user `root`, pass ``, db `safecommute`.
4. (Opsional) Jalankan seeder data demo:
   ```bash
   php safecommute/scripts/seed.php
   ```
5. Jalankan web server bawaan PHP dari root `public_html`:
   ```bash
   php -S localhost:8000 -t public_html
   ```
6. Buka browser di `http://localhost:8000`.

---

## 4. Keuntungan Arsitektur Baru Ini untuk Rumahweb
- **Nol Konsumsi Node.js RAM/CPU**: Menghemat jatah memory limit shared hosting.
- **Keamanan Ketat**: Semua request mutasi dicek via session server dan CSRF token (bebas dari celah manipulasi IDOR).
- **Caching Nominatim & OSRM**: Mencegah request geocoding/routing diblokir karena ada cache 1-3 hari di MariaDB.
- **Pembersihan Metadata Gambar**: Foto laporan dikonversi ke WebP/JPEG menggunakan GD, menghapus data lokasi privasi (EXIF GPS) fotografer secara otomatis.
