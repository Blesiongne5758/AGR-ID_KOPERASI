# 🚀 Quick Start Guide - Integrasi AGR-ID

Panduan cepat untuk memulai integrasi database koperasi ke AGR-ID dalam 5 menit.

## ⚡ 5 Menit Setup

### Step 1: Install Dependencies (1 menit)

```bash
npm install
```

### Step 2: Setup Database (1 menit)

```bash
# Buat database
createdb koperasi_db

# Jalankan migration
npm run db:init
```

### Step 3: Konfigurasi (1 menit)

```bash
# Copy environment file
cp .env.example .env

# Edit .env dengan konfigurasi Anda
nano .env
```

Isi minimal:
```bash
DATABASE_URL=postgresql://username:password@localhost:5432/koperasi_db
AGRID_API_TOKEN=your_token_here
```

### Step 4: Jalankan Server (1 menit)

```bash
npm start
```

Server akan berjalan di `http://localhost:3000`

### Step 5: Test Sync (1 menit)

```bash
# Trigger manual sync
curl -X POST http://localhost:3000/api/v1/sync/agrid
```

Jika berhasil, Anda akan melihat response:
```json
{
  "success": true,
  "message": "AGR-ID sync completed successfully",
  "data": {
    "cooperatives_synced": 2,
    "members_synced": 3,
    "snapshot": true
  }
}
```

## ✅ Checklist Setelah Setup

- [ ] Database PostgreSQL running
- [ ] Tabel `cooperatives`, `members`, `agrid_sync_logs` sudah dibuat
- [ ] File `.env` sudah dikonfigurasi
- [ ] AGR-ID API Token sudah didapat
- [ ] Server berjalan tanpa error
- [ ] Manual sync berhasil

## 🔍 Verifikasi Data di AGR-ID

1. Login ke Dashboard Admin AGR-ID
2. Navigasi ke **Direktori Koperasi**
3. Cari koperasi Anda berdasarkan kode (KOP-001, KOP-002)
4. Verifikasi data anggota sudah muncul

## 📅 Setup Auto-Sync

Untuk sinkronisasi otomatis setiap hari jam 2 pagi:

```bash
# Edit .env
AGRID_SYNC_SCHEDULE=0 2 * * *

# Restart server
npm start
```

## 🆘 Troubleshooting Cepat

### Error: "Cannot find module"
```bash
npm install
```

### Error: "connection refused"
```bash
# Pastikan PostgreSQL running
sudo systemctl start postgresql

# Test koneksi
psql $DATABASE_URL
```

### Error: "401 Unauthorized"
- Periksa `AGRID_API_TOKEN` di `.env`
- Generate token baru dari Dashboard AGR-ID

### Sync tidak berjalan
```bash
# Cek log
tail -f logs/server.log

# Atau restart server
npm start
```

## 📚 Dokumentasi Lengkap

Untuk dokumentasi lengkap, lihat [README.md](./README.md)

## 🎯 Next Steps

1. **Monitor Sync Logs**
   ```bash
   psql $DATABASE_URL -c "SELECT * FROM agrid_sync_logs ORDER BY created_at DESC LIMIT 5;"
   ```

2. **Setup Production**
   - Gunakan PM2 untuk process management
   - Setup reverse proxy (nginx)
   - Configure SSL/HTTPS

3. **Integrasi dengan Aplikasi Koperasi**
   - Tambahkan form input koperasi & anggota
   - Build dashboard admin
   - Implementasi webhook untuk real-time updates

## 📞 Butuh Bantuan?

- Baca [README.md](./README.md) untuk detail lengkap
- Check [Troubleshooting](./README.md#-troubleshooting) di README
- Buka issue di GitHub repository

---

**Selamat! Integrasi AGR-ID Anda sudah siap digunakan! 🎉**
