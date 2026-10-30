# 🔐 Cara Mengakses Repository AGR-ID dengan GitHub PAT

## ⚠️ PERINGATAN KEAMANAN

**JANGAN PERNAH** membagikan GitHub Personal Access Token (PAT) di:
- ❌ Chat publik
- ❌ Email
- ❌ Forum
- ❌ Dokumentasi yang di-commit
- ❌ Screenshot

**SELALU** simpan PAT di:
- ✅ Environment variables
- ✅ Secret manager (AWS Secrets Manager, Vault, dll)
- ✅ File `.env` yang di-gitignore
- ✅ CI/CD secrets (GitHub Actions, GitLab CI, dll)

---

## 🎯 Apa itu GitHub PAT?

GitHub Personal Access Token (PAT) adalah token autentikasi yang memungkinkan Anda mengakses repository GitHub secara programmatic.

### Jenis PAT
1. **Classic PAT** - Token lama dengan akses luas
2. **Fine-grained PAT** - Token baru dengan akses spesifik (recommended)

---

## 🔑 Cara Membuat GitHub PAT

### Option 1: Fine-grained PAT (Recommended)

1. Login ke GitHub
2. Buka **Settings** → **Developer settings** → **Personal access tokens** → **Fine-grained tokens**
3. Klik **Generate new token**
4. Isi form:
   - **Token name**: `AGR-ID Integration`
   - **Description**: `Token untuk integrasi AGR-ID`
   - **Expiration**: 90 days (recommended)
   - **Repository access**: Pilih `Only select repositories`
   - **Select repositories**: Pilih `blesiongne5758/agr-id`
   - **Permissions**:
     - Repository permissions:
       - Contents: Read-only
       - Metadata: Read-only
5. Klik **Generate token**
6. **COPY TOKEN SEKARANG** (tidak bisa dilihat lagi!)

### Option 2: Classic PAT

1. Login ke GitHub
2. Buka **Settings** → **Developer settings** → **Personal access tokens** → **Tokens (classic)**
3. Klik **Generate new token (classic)**
4. Isi form:
   - **Note**: `AGR-ID Integration`
   - **Expiration**: 90 days
   - **Select scopes**:
     - `repo` (Full control of private repositories)
5. Klik **Generate token**
6. **COPY TOKEN SEKARANG**

---

## 🔒 Cara Menyimpan PAT dengan Aman

### 1. Environment Variables

```bash
# Linux/Mac
export GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx

# Windows (PowerShell)
$env:GITHUB_TOKEN="ghp_xxxxxxxxxxxxxxxxxxxx"

# Windows (CMD)
set GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx
```

### 2. File .env (Development)

```bash
# .env
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx
```

**PENTING:** Tambahkan `.env` ke `.gitignore`:
```bash
echo ".env" >> .gitignore
```

### 3. GitHub Actions Secrets

1. Buka repository di GitHub
2. **Settings** → **Secrets and variables** → **Actions**
3. Klik **New repository secret**
4. Name: `GITHUB_TOKEN`
5. Value: `ghp_xxxxxxxxxxxxxxxxxxxx`
6. Klik **Add secret**

### 4. Secret Manager (Production)

**AWS Secrets Manager:**
```bash
aws secretsmanager create-secret \
  --name github/agr-id-token \
  --secret-string "ghp_xxxxxxxxxxxxxxxxxxxx"
```

**HashiCorp Vault:**
```bash
vault kv put secret/github token=ghp_xxxxxxxxxxxxxxxxxxxx
```

---

## 📡 Cara Menggunakan PAT untuk Akses Repository

### 1. Clone Repository

```bash
# Menggunakan HTTPS dengan PAT
git clone https://<GITHUB_TOKEN>@github.com/blesiongne5758/agr-id.git

# Atau menggunakan credential helper
git config --global credential.helper store
git clone https://github.com/blesiongne5758/agr-id.git
# Masukkan username dan PAT saat diminta
```

### 2. Akses via GitHub API

```bash
# Get repository info
curl -H "Authorization: token ghp_xxxxxxxxxxxxxxxxxxxx" \
  https://api.github.com/repos/blesiongne5758/agr-id

# Get repository contents
curl -H "Authorization: token ghp_xxxxxxxxxxxxxxxxxxxx" \
  https://api.github.com/repos/blesiongne5758/agr-id/contents

# Get specific file
curl -H "Authorization: token ghp_xxxxxxxxxxxxxxxxxxxx" \
  https://api.github.com/repos/blesiongne5758/agr-id/contents/README.md
```

### 3. Menggunakan di Node.js

```javascript
const axios = require('axios');

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const REPO = 'blesiongne5758/agr-id';

// Get repository info
async function getRepoInfo() {
  const response = await axios.get(
    `https://api.github.com/repos/${REPO}`,
    {
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    }
  );
  return response.data;
}

// Get file contents
async function getFileContent(path) {
  const response = await axios.get(
    `https://api.github.com/repos/${REPO}/contents/${path}`,
    {
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    }
  );
  
  // Decode base64 content
  const content = Buffer.from(response.data.content, 'base64').toString();
  return content;
}
```

---

## 🔄 Integrasi dengan AGR-ID

### Informasi AGR-ID

| Item | Detail |
|------|--------|
| **Repository** | https://github.com/blesiongne5758/agr-id |
| **URL Base** | https://agr.biz.id |
| **Frontend Hosting** | InfinityFree.com |
| **Database** | Supabase |
| **API Endpoint** | `/api/v1/cooperatives/sync` |

### Akses Repository AGR-ID

```bash
# Clone repository
git clone https://<GITHUB_TOKEN>@github.com/blesiongne5758/agr-id.git

# Atau dengan credential helper
git clone https://github.com/blesiongne5758/agr-id.git
```

### Lihat Struktur Repository

```bash
cd agr-id
ls -la

# Lihat file-file penting
cat README.md
cat supabase/migrations/0009_cooperative_membership.sql
```

### Lihat Migration Files

```bash
# Lihat semua migration files
ls supabase/migrations/

# Lihat migration untuk cooperative membership
cat supabase/migrations/0009_cooperative_membership.sql
```

---

## 🛡️ Best Practices Keamanan

### 1. Gunakan Fine-grained PAT
- Akses hanya ke repository yang diperlukan
- Permission minimal yang dibutuhkan
- Expiration date yang jelas

### 2. Rotate Token Secara Berkala
- Ganti token setiap 90 hari
- Update semua sistem yang menggunakan token
- Revoke token lama

### 3. Monitor Penggunaan Token
- Check GitHub audit log
- Monitor API usage
- Alert untuk aktivitas mencurigakan

### 4. Batasi Scope
- Jangan gunakan scope `admin:org` jika tidak perlu
- Gunakan `repo` scope hanya jika perlu akses full
- Preferensi: `read:org` atau `read:repo`

### 5. Gunakan Secret Manager
- Production: AWS Secrets Manager, Vault, dll
- Development: Environment variables
- CI/CD: GitHub Actions secrets

---

## 🐛 Troubleshooting

### Error: "Bad credentials"
**Penyebab:** Token tidak valid atau expired

**Solusi:**
1. Periksa apakah token sudah benar
2. Check apakah token sudah expired
3. Generate token baru jika perlu

### Error: "Repository not found"
**Penyebab:** Token tidak memiliki akses ke repository

**Solusi:**
1. Periksa permission token
2. Pastikan repository dipilih di token settings
3. Generate token baru dengan permission yang benar

### Error: "Rate limit exceeded"
**Penyebab:** Terlalu banyak request ke GitHub API

**Solusi:**
1. Tunggu beberapa menit
2. Gunakan conditional requests (ETag)
3. Cache response jika memungkinkan

### Token tidak bisa digunakan
**Penyebab:** Token sudah di-revoke atau expired

**Solusi:**
1. Check status token di GitHub settings
2. Generate token baru
3. Update semua sistem yang menggunakan token

---

## 📚 Referensi

### GitHub Documentation
- [Creating a personal access token](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token)
- [Fine-grained personal access tokens](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token#fine-grained-personal-access-tokens)
- [GitHub REST API](https://docs.github.com/en/rest)

### AGR-ID Repository
- **GitHub:** https://github.com/blesiongne5758/agr-id
- **URL:** https://agr.biz.id
- **Migration:** `supabase/migrations/0009_cooperative_membership.sql`

### Dokumentasi Terkait
- [AGRID_CONFIG.md](./AGRID_CONFIG.md) - Konfigurasi AGR-ID
- [CARA_INTEGRASI.md](./CARA_INTEGRASI.md) - Cara integrasi
- [README.md](./README.md) - Dokumentasi utama

---

## ✅ Checklist Keamanan

- [ ] PAT disimpan di environment variable
- [ ] `.env` ditambahkan ke `.gitignore`
- [ ] Token memiliki expiration date
- [ ] Permission token minimal yang dibutuhkan
- [ ] Token di-rotate setiap 90 hari
- [ ] Audit log dimonitor secara berkala
- [ ] Secret manager digunakan untuk production

---

## 🎯 Summary

### Cara Akses Repository AGR-ID:

1. **Buat GitHub PAT** dengan permission yang sesuai
2. **Simpan PAT** di environment variable atau secret manager
3. **Clone repository** menggunakan PAT
4. **Akses file** via GitHub API jika diperlukan
5. **Integrasikan** dengan sistem koperasi Anda

### Informasi Penting:

- **Repository:** https://github.com/blesiongne5758/agr-id
- **URL:** https://agr.biz.id
- **Database:** Supabase
- **Hosting:** InfinityFree.com

### Keamanan:

- ⚠️ **JANGAN** share PAT di tempat publik
- ✅ **SELALU** gunakan environment variables
- ✅ **ROTATE** token setiap 90 hari
- ✅ **MONITOR** penggunaan token

---

**Version:** 1.0.0  
**Last Updated:** 2026-01-15  
**AGR-ID Repository:** https://github.com/blesiongne5758/agr-id  
**AGR-ID URL:** https://agr.biz.id
