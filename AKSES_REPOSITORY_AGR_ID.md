# 📦 Cara Akses Repository AGR-ID

## 📋 Informasi Repository

| Item | Detail |
|------|--------|
| **Repository URL** | https://github.com/blesiongne5758/agr-id |
| **Owner** | blesiongne5758 |
| **Repository Name** | agr-id |
| **Description** | AGR-ID Marketplace - Platform koperasi terintegrasi |

---

## 🔑 Cara Akses Repository

### Option 1: Clone Repository (Recommended)

```bash
# Menggunakan HTTPS
git clone https://github.com/blesiongne5758/agr-id.git

# Menggunakan SSH (jika sudah setup SSH key)
git clone git@github.com:blesiongne5758/agr-id.git

# Menggunakan GitHub CLI
gh repo clone blesiongne5758/agr-id
```

### Option 2: Download ZIP

1. Buka https://github.com/blesiongne5758/agr-id
2. Klik tombol **Code** (hijau)
3. Klik **Download ZIP**
4. Extract file ZIP

### Option 3: Akses via GitHub API

```bash
# Get repository info
curl https://api.github.com/repos/blesiongne5758/agr-id

# Get repository contents
curl https://api.github.com/repos/blesiongne5758/agr-id/contents

# Get specific file
curl https://api.github.com/repos/blesiongne5758/agr-id/contents/README.md
```

---

## 📁 Struktur Repository AGR-ID

```
agr-id/
│
├── 📄 README.md                          # Dokumentasi utama
├── 📄 package.json                       # Dependencies
├── 📄 .env.example                       # Environment template
│
├── 📁 src/
│   ├── 📁 components/                    # React components
│   │   ├── 📄 Dashboard.jsx
│   │   ├── 📄 Login.jsx
│   │   └── 📄 CooperativeDirectory.jsx
│   │
│   ├── 📁 pages/                         # Page components
│   │   ├── 📄 Home.jsx
│   │   ├── 📄 Admin.jsx
│   │   └── 📄 Member.jsx
│   │
│   ├── 📁 services/                      # API services
│   │   ├── 📄 supabase.js               # Supabase client
│   │   └── 📄 api.js                    # API calls
│   │
│   └── 📄 App.jsx                        # Main app component
│
├── 📁 supabase/
│   └── 📁 migrations/                    # Database migrations
│       ├── 📄 0001_initial_schema.sql
│       ├── 📄 0002_add_users.sql
│       ├── ...
│       └── 📄 0009_cooperative_membership.sql  # ⭐ IMPORTANT
│
├── 📁 public/                            # Static assets
│   ├── 📄 index.html
│   └── 📁 assets/
│
└── 📁 docs/                              # Documentation
    ├── 📄 API.md
    └── 📄 DEPLOYMENT.md
```

---

## 🗄️ File Migration Penting

### 0009_cooperative_membership.sql

File ini membuat tabel untuk integrasi koperasi:

```sql
-- Tabel koperasi
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

-- Tabel koperasi_anggota
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

-- Tabel akun_koperasi_link
CREATE TABLE akun_koperasi_link (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  supabase_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  koperasi_anggota_id UUID REFERENCES koperasi_anggota(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'pending',
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Cara Lihat Migration File

```bash
# Clone repository
git clone https://github.com/blesiongne5758/agr-id.git
cd agr-id

# Lihat semua migration files
ls supabase/migrations/

# Lihat file 0009_cooperative_membership.sql
cat supabase/migrations/0009_cooperative_membership.sql
```

---

## 🔍 Cara Melihat File di Repository

### Via Web Browser

1. Buka https://github.com/blesiongne5758/agr-id
2. Navigate ke folder yang diinginkan
3. Klik file untuk melihat isinya

### Via Command Line

```bash
# Clone repository
git clone https://github.com/blesiongne5758/agr-id.git
cd agr-id

# List files
ls -la

# Lihat isi file
cat README.md
cat supabase/migrations/0009_cooperative_membership.sql

# Search file
find . -name "*.sql"
find . -name "*.jsx"
```

### Via GitHub API

```bash
# Get repository tree
curl https://api.github.com/repos/blesiongne5758/agr-id/git/trees/main?recursive=1

# Get specific file content
curl https://api.github.com/repos/blesiongne5758/agr-id/contents/README.md | jq -r '.content' | base64 -d
```

---

## 📊 Memahami Struktur Database AGR-ID

### Tabel Utama

1. **koperasi** - Data koperasi
   - `id` (UUID)
   - `code` (VARCHAR) - Kode koperasi
   - `name` (VARCHAR) - Nama koperasi
   - `is_active` (BOOLEAN) - Status aktif

2. **koperasi_anggota** - Data anggota koperasi
   - `id` (UUID)
   - `koperasi_id` (UUID) - FK ke koperasi
   - `member_number` (VARCHAR) - Nomor anggota
   - `name` (VARCHAR) - Nama anggota
   - `email` (VARCHAR) - Email
   - `is_active` (BOOLEAN) - Status aktif

3. **akun_koperasi_link** - Link antara akun Supabase dan anggota koperasi
   - `id` (UUID)
   - `supabase_user_id` (UUID) - FK ke auth.users
   - `koperasi_anggota_id` (UUID) - FK ke koperasi_anggota
   - `status` (VARCHAR) - 'pending', 'verified', 'rejected'
   - `verified_at` (TIMESTAMP) - Waktu verifikasi

### Relasi Antar Tabel

```
koperasi (1) ←→ (N) koperasi_anggota (1) ←→ (N) akun_koperasi_link
```

---

## 🔄 Cara Data Masuk ke AGR-ID

### 1. Via API Sync Endpoint

```javascript
POST https://agr.biz.id/api/v1/cooperatives/sync

{
  "snapshot": true,
  "cooperatives": [
    {
      "id": "uuid",
      "code": "KOP-001",
      "name": "Koperasi Tani Sejahtera",
      "active": true,
      "members": [
        {
          "id": "uuid",
          "number": "A-1001",
          "name": "Budi Santoso",
          "email": "budi@example.com",
          "active": true
        }
      ]
    }
  ]
}
```

### 2. Proses di AGR-ID

```javascript
// 1. Terima data dari API
const { cooperatives } = req.body;

// 2. Loop melalui setiap koperasi
for (const coop of cooperatives) {
  // 3. Insert/update koperasi
  await supabase
    .from('koperasi')
    .upsert({
      id: coop.id,
      code: coop.code,
      name: coop.name,
      is_active: coop.active
    });

  // 4. Insert/update anggota
  for (const member of coop.members) {
    await supabase
      .from('koperasi_anggota')
      .upsert({
        koperasi_id: coop.id,
        member_number: member.number,
        name: member.name,
        email: member.email,
        is_active: member.active
      });
  }
}
```

---

## 🔐 Verifikasi Anggota

### Flow Verifikasi

1. **Pengguna Login di AGR-ID**
   - Login dengan email/password
   - Masuk ke dashboard

2. **Pilih Koperasi**
   - Navigasi ke **Pengaturan Pengguna**
   - Pilih koperasi dari dropdown

3. **Input Data Anggota**
   - Masukkan nomor anggota
   - Masukkan nama lengkap

4. **Sistem Mencocokkan**
   ```javascript
   const match = await supabase
     .from('koperasi_anggota')
     .select('*')
     .eq('koperasi_id', selectedKoperasiId)
     .eq('member_number', inputNumber)
     .eq('name', inputName)
     .single();
   ```

5. **Hasil Pencocokan**
   - ✅ **Cocok** → Status `verified` otomatis
   - ❌ **Tidak cocok** → Masuk antrian verifikasi admin

6. **Verifikasi Admin (jika tidak cocok)**
   - Admin menerima notifikasi
   - Admin memeriksa dokumen
   - Admin approve/reject
   - Update status di `akun_koperasi_link`

---

## 📡 API Endpoints AGR-ID

### Public Endpoints

```bash
# Health check
GET https://agr.biz.id/health

# Get cooperative list
GET https://agr.biz.id/api/v1/cooperatives

# Get cooperative detail
GET https://agr.biz.id/api/v1/cooperatives/:id
```

### Protected Endpoints (Require Auth)

```bash
# Sync cooperatives (require Bearer token)
POST https://agr.biz.id/api/v1/cooperatives/sync

# Get user profile
GET https://agr.biz.id/api/v1/users/me

# Update user profile
PUT https://agr.biz.id/api/v1/users/me
```

### Admin Endpoints (Require Admin Role)

```bash
# Get pending verifications
GET https://agr.biz.id/api/v1/admin/verifications

# Approve verification
POST https://agr.biz.id/api/v1/admin/verifications/:id/approve

# Reject verification
POST https://agr.biz.id/api/v1/admin/verifications/:id/reject
```

---

## 🛠️ Development Setup

### Clone & Setup

```bash
# Clone repository
git clone https://github.com/blesiongne5758/agr-id.git
cd agr-id

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env dengan konfigurasi Supabase Anda
nano .env

# Run development server
npm run dev
```

### Environment Variables

```bash
# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# API
VITE_API_URL=https://agr.biz.id
```

---

## 📚 Dokumentasi Repository

### File Dokumentasi

- **README.md** - Dokumentasi utama
- **docs/API.md** - API documentation
- **docs/DEPLOYMENT.md** - Deployment guide
- **supabase/migrations/** - Database schema

### Cara Baca Dokumentasi

```bash
# Baca README
cat README.md

# Baca API docs
cat docs/API.md

# Baca deployment guide
cat docs/DEPLOYMENT.md
```

---

## 🎯 Tips & Tricks

### 1. Gunakan GitHub CLI

```bash
# Install GitHub CLI
# https://cli.github.com/

# Clone repository
gh repo clone blesiongne5758/agr-id

# View repository
gh repo view blesiongne5758/agr-id

# Create issue
gh issue create --repo blesiongne5758/agr-id --title "Bug report"
```

### 2. Watch Repository

1. Buka https://github.com/blesiongne5758/agr-id
2. Klik **Watch**
3. Pilih **All Activity** atau **Custom**
4. Dapatkan notifikasi untuk update

### 3. Star Repository

1. Buka https://github.com/blesiongne5758/agr-id
2. Klik **Star** di pojok kanan atas
3. Repository masuk ke starred list Anda

### 4. Fork Repository (jika perlu kontribusi)

```bash
# Fork via GitHub web
# Atau via CLI
gh repo fork blesiongne5758/agr-id
```

---

## 🐛 Troubleshooting

### Error: "Repository not found"

**Penyebab:** Repository private atau URL salah

**Solusi:**
1. Periksa URL: https://github.com/blesiongne5758/agr-id
2. Jika private, gunakan PAT untuk akses
3. Check permission Anda

### Error: "Permission denied"

**Penyebab:** Tidak memiliki akses ke repository

**Solusi:**
1. Request akses dari owner repository
2. Gunakan PAT dengan permission yang sesuai
3. Check apakah repository masih ada

### Error: "Connection timeout"

**Penyebab:** Koneksi internet lambat atau GitHub down

**Solusi:**
1. Check koneksi internet
2. Retry setelah beberapa menit
3. Check GitHub status: https://www.githubstatus.com/

---

## 📞 Support

Untuk pertanyaan tentang repository AGR-ID:

1. **Check README** di repository
2. **Buka issue** di https://github.com/blesiongne5758/agr-id/issues
3. **Hubungi owner** melalui GitHub

---

## ✅ Checklist Akses Repository

- [ ] Repository URL sudah benar
- [ ] Bisa akses via web browser
- [ ] Bisa clone repository
- [ ] Bisa melihat file migration
- [ ] Memahami struktur database
- [ ] Tahu cara melihat dokumentasi

---

**Version:** 1.0.0  
**Last Updated:** 2026-01-15  
**Repository:** https://github.com/blesiongne5758/agr-id  
**URL:** https://agr.biz.id
