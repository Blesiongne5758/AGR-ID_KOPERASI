# 🔗 Integrasi dengan AGR-ID Repository

## 📋 Informasi AGR-ID

| Item | Detail |
|------|--------|
| **Repository** | https://github.com/blesiongne5758/agr-id |
| **URL Base** | https://agr.biz.id |
| **Frontend Hosting** | InfinityFree.com |
| **Database** | Supabase |
| **API Endpoint** | `/api/v1/cooperatives/sync` |

---

## 🎯 Tujuan Integrasi

Integrasi ini menghubungkan database koperasi lokal Anda dengan AGR-ID Marketplace yang di-hosting di InfinityFree dengan database Supabase.

### Flow Integrasi
```
Database Koperasi (PostgreSQL)
         ↓
Integration Server (Node.js)
         ↓
AGR-ID API (https://agr.biz.id)
         ↓
Supabase Database (AGR-ID)
```

---

## 🔐 Autentikasi

### API Token
AGR-ID menggunakan Bearer token untuk autentikasi:

```javascript
headers: {
  'Authorization': `Bearer ${AGRID_API_TOKEN}`,
  'Content-Type': 'application/json'
}
```

### Cara Mendapatkan Token
1. Login ke Dashboard Admin AGR-ID di https://agr.biz.id
2. Navigasi ke **Direktori Koperasi**
3. Buat API token dengan role `koperasi`
4. Simpan token di environment variable `AGRID_API_TOKEN`

---

## 📡 Endpoint Integrasi

### POST /api/v1/cooperatives/sync

**URL:** `https://agr.biz.id/api/v1/cooperatives/sync`

**Headers:**
```
Authorization: Bearer <your-token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "snapshot": true,
  "cooperatives": [
    {
      "id": "koperasi-001",
      "code": "KOP-001",
      "name": "Koperasi Tani Sejahtera",
      "active": true,
      "members": [
        {
          "id": "anggota-001",
          "number": "A-1001",
          "name": "Nama sesuai buku anggota",
          "email": "anggota@example.id",
          "active": true
        }
      ]
    }
  ]
}
```

**Response (Success):**
```json
{
  "ok": true,
  "cooperatives_synced": 1,
  "members_synced": 1,
  "snapshot": true
}
```

---

## 🗄️ Supabase Database Structure

AGR-ID menggunakan Supabase dengan struktur tabel berikut:

### Tabel: koperasi
```sql
CREATE TABLE koperasi (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  address TEXT,
  phone VARCHAR(20),
  email VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Tabel: koperasi_anggota
```sql
CREATE TABLE koperasi_anggota (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  koperasi_id UUID REFERENCES koperasi(id) ON DELETE CASCADE,
  member_number VARCHAR(50) NOT NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(koperasi_id, member_number)
);
```

### Tabel: akun_koperasi_link
```sql
CREATE TABLE akun_koperasi_link (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  supabase_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  koperasi_anggota_id UUID REFERENCES koperasi_anggota(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'verified', 'rejected'
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## 🔄 Cara Kerja Sinkronisasi

### 1. Snapshot Mode (Full Sync)
```javascript
{
  "snapshot": true,
  "cooperatives": [...]
}
```

**Behavior:**
- Mengganti semua data koperasi dan anggota
- Anggota yang tidak ada di snapshot akan dinonaktifkan
- Cocok untuk sinkronisasi awal atau rekonsiliasi data

### 2. Partial Update Mode
```javascript
{
  "snapshot": false,
  "cooperatives": [
    {
      "id": "uuid",
      "members": [
        { "id": "uuid", "active": false }
      ]
    }
  ]
}
```

**Behavior:**
- Hanya update data yang dikirim
- Set `active: false` untuk menonaktifkan anggota
- Cocok untuk update incremental

---

## 🔍 Verifikasi Anggota

### Flow Verifikasi
1. Pengguna memilih koperasi di **Pengaturan Pengguna**
2. Masukkan nomor anggota dan nama
3. Sistem mencocokkan dengan data di `koperasi_anggota`
4. Jika cocok → status `verified` otomatis
5. Jika tidak cocok → masuk antrian verifikasi admin

### Matching Logic
```javascript
// AGR-ID mencocokkan berdasarkan:
// 1. Nomor anggota (member_number)
// 2. Nama terdaftar (name)
// 3. Email akun marketplace (email)

if (member.number === registeredMember.number && 
    member.name === registeredMember.name) {
  status = 'verified';
} else {
  status = 'pending'; // Masuk antrian verifikasi admin
}
```

---

## 🛡️ Keamanan Data

### Data yang Dikirim
- ✅ ID koperasi dan anggota
- ✅ Nomor anggota
- ✅ Nama lengkap
- ✅ Email
- ✅ Status aktif

### Data yang TIDAK Dikirim
- ❌ Password
- ❌ Data sensitif lainnya
- ❌ Informasi keuangan

### Enkripsi
- Semua data dikirim melalui HTTPS
- Token autentikasi menggunakan Bearer token
- Data tidak dicatat ke log (except di database lokal untuk audit)

---

## 📊 Monitoring & Logging

### Tabel Audit: agrid_sync_logs
```sql
CREATE TABLE agrid_sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sync_type VARCHAR(20) NOT NULL, -- 'SNAPSHOT' atau 'PARTIAL'
  cooperatives_count INT DEFAULT 0,
  members_count INT DEFAULT 0,
  status VARCHAR(20) NOT NULL, -- 'SUCCESS', 'FAILED', 'PENDING'
  payload JSONB,
  response JSONB,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Query Monitoring
```sql
-- Lihat 10 sync terakhir
SELECT * FROM agrid_sync_logs 
ORDER BY created_at DESC 
LIMIT 10;

-- Statistik harian
SELECT 
  DATE(created_at) as date,
  COUNT(*) as total_syncs,
  COUNT(*) FILTER (WHERE status = 'SUCCESS') as success,
  COUNT(*) FILTER (WHERE status = 'FAILED') as failed
FROM agrid_sync_logs
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at);
```

---

## 🚀 Setup Integrasi

### 1. Konfigurasi Environment
```bash
# .env
AGRID_BASE_URL=https://agr.biz.id
AGRID_API_TOKEN=your_token_from_agrid_dashboard
AGRID_REPO_URL=https://github.com/blesiongne5758/agr-id
```

### 2. Test Koneksi
```bash
# Health check
curl https://agr.biz.id/health

# Test sync
curl -X POST https://agr.biz.id/api/v1/cooperatives/sync \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "snapshot": true,
    "cooperatives": [{
      "id": "test-001",
      "code": "TEST-001",
      "name": "Test Cooperative",
      "active": true,
      "members": []
    }]
  }'
```

### 3. Jalankan Sync
```bash
# Manual sync
npm start
curl -X POST http://localhost:3000/api/v1/sync/agrid

# Automated sync (cron)
# Edit .env: AGRID_SYNC_SCHEDULE=0 2 * * *
```

---

## 🐛 Troubleshooting

### Error: "401 Unauthorized"
**Penyebab:** Token tidak valid atau expired

**Solusi:**
1. Periksa `AGRID_API_TOKEN` di `.env`
2. Generate token baru dari Dashboard AGR-ID
3. Restart server

### Error: "Connection refused"
**Penyebab:** AGR-ID API tidak accessible

**Solusi:**
1. Check URL: `https://agr.biz.id`
2. Test koneksi: `curl https://agr.biz.id/health`
3. Periksa firewall/proxy settings

### Error: "Data tidak cocok"
**Penyebab:** Nomor anggota atau nama tidak match

**Solusi:**
1. Verifikasi data di database lokal
2. Pastikan nomor anggota sesuai dengan buku anggota
3. Check apakah anggota sudah terdaftar di AGR-ID

### Sync tidak berjalan otomatis
**Penyebab:** Scheduler tidak ter-initialize

**Solusi:**
1. Check log server untuk pesan "[Scheduler] initialized"
2. Verifikasi `AGRID_SYNC_SCHEDULE` di `.env`
3. Restart server

---

## 📚 Referensi

### Repository AGR-ID
- **GitHub:** https://github.com/blesiongne5758/agr-id
- **Migration:** `0009_cooperative_membership.sql`
- **Dashboard:** https://agr.biz.id/admin

### Dokumentasi Terkait
- [README.md](./README.md) - Dokumentasi utama
- [API.md](./API.md) - API documentation
- [ARCHITECTURE.md](./ARCHITECTURE.md) - System architecture
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Deployment guide

---

## 📞 Support

Untuk pertanyaan tentang integrasi AGR-ID:
1. Check dokumentasi di repository AGR-ID
2. Buka issue di https://github.com/blesiongne5758/agr-id/issues
3. Hubungi admin AGR-ID melalui dashboard

---

**Version:** 1.0.0  
**Last Updated:** 2026-01-15  
**AGR-ID Repository:** https://github.com/blesiongne5758/agr-id  
**AGR-ID URL:** https://agr.biz.id
