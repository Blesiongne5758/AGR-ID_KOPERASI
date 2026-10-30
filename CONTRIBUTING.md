# Contributing to Koperasi AGR-ID Integration

Terima kasih atas minat Anda untuk berkontribusi! Panduan ini akan membantu Anda memulai.

## 🎯 Cara Berkontribusi

### 1. Fork Repository

```bash
# Fork repository di GitHub
# Kemudian clone fork Anda
git clone https://github.com/yourusername/koperasi-agrid-integration.git
cd koperasi-agrid-integration
```

### 2. Buat Branch

```bash
# Buat branch untuk fitur baru
git checkout -b feature/nama-fitur

# Atau untuk bug fix
git checkout -b fix/nama-bug
```

### 3. Develop

```bash
# Install dependencies
npm install

# Jalankan development server
npm run dev

# Test perubahan Anda
# ... lakukan perubahan ...
```

### 4. Commit

```bash
# Stage changes
git add .

# Commit dengan pesan yang jelas
git commit -m "feat: menambahkan fitur sync parsial"

# Push ke branch Anda
git push origin feature/nama-fitur
```

### 5. Pull Request

- Buka Pull Request di GitHub
- Jelaskan perubahan yang Anda buat
- Tunggu review dari maintainer

## 📝 Panduan Style

### JavaScript

```javascript
// ✅ GOOD
const cooperatives = await fetchCooperativesWithMembers();
const payload = buildSyncPayload(cooperatives);

// ❌ BAD
var cooperatives = fetchCooperativesWithMembers()
payload = buildSyncPayload(cooperatives)
```

**Rules:**
- Gunakan `const` dan `let`, hindari `var`
- Gunakan `async/await` untuk asynchronous code
- Gunakan template literals untuk string interpolation
- Gunakan arrow functions untuk callbacks
- Indentasi 2 spasi
- Semicolon di akhir statement

### SQL

```sql
-- ✅ GOOD
SELECT 
  c.id,
  c.name,
  COUNT(m.id) as member_count
FROM cooperatives c
LEFT JOIN members m ON c.id = m.cooperative_id
WHERE c.is_active = true
GROUP BY c.id, c.name;

-- ❌ BAD
select c.id,c.name,count(m.id) from cooperatives c left join members m on c.id=m.cooperative_id where c.is_active=true group by c.id,c.name
```

**Rules:**
- Keywords dalam UPPERCASE
- Indentasi untuk readability
- Gunakan alias yang jelas
- Comment untuk query kompleks

### Commit Messages

```bash
# Format
<type>: <description>

# Types
feat:     Fitur baru
fix:      Bug fix
docs:     Dokumentasi
style:    Formatting, missing semi colons, etc
refactor: Code refactoring
test:     Adding tests
chore:    Maintenance

# Examples
feat: menambahkan endpoint untuk sync parsial
fix: memperbaiki error koneksi database
docs: update README dengan contoh deployment
refactor: optimasi query fetch members
```

## 🧪 Testing

### Menulis Test

```javascript
// tests/services/agridSync.test.js
const { buildSyncPayload } = require('../../src/services/agridSync');

describe('buildSyncPayload', () => {
  test('should build correct payload structure', () => {
    const cooperatives = [
      {
        id: 'uuid-1',
        code: 'KOP-001',
        name: 'Test Coop',
        active: true,
        members: [
          { id: 'uuid-m1', number: 'A-001', name: 'John', email: 'john@test.com', active: true }
        ]
      }
    ];

    const payload = buildSyncPayload(cooperatives, true);

    expect(payload.snapshot).toBe(true);
    expect(payload.cooperatives).toHaveLength(1);
    expect(payload.cooperatives[0].members).toHaveLength(1);
  });
});
```

### Menjalankan Test

```bash
# Install test dependencies
npm install --save-dev jest supertest

# Run tests
npm test

# Run with coverage
npm run test:coverage
```

## 📚 Dokumentasi

### Update Dokumentasi

Jika Anda menambahkan fitur baru, pastikan untuk:

1. **Update README.md** - Tambahkan informasi fitur baru
2. **Update API.md** - Tambahkan endpoint baru
3. **Update CHANGELOG.md** - Catat perubahan
4. **Tambahkan contoh** - Berikan contoh penggunaan

### Format Dokumentasi

```markdown
## Nama Fitur

Deskripsi singkat fitur.

### Cara Penggunaan

\`\`\`javascript
// Contoh kode
\`\`\`

### Parameter

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `param1`  | string | ✅ | Deskripsi |

### Response

\`\`\`json
{
  "success": true,
  "data": {}
}
\`\`\`
```

## 🐛 Melaporkan Bug

### Format Issue

```markdown
**Deskripsi Bug**
Deskripsi singkat dan jelas tentang bug.

**Cara Reproduce**
1. Go to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

**Expected Behavior**
Apa yang seharusnya terjadi.

**Actual Behavior**
Apa yang sebenarnya terjadi.

**Screenshots**
Jika ada, tambahkan screenshot.

**Environment**
- OS: [e.g. Ubuntu 20.04]
- Node.js: [e.g. 18.17.0]
- PostgreSQL: [e.g. 14.5]
- Browser: [e.g. Chrome 91]

**Additional Context**
Informasi tambahan tentang masalah.
```

## 💡 Request Fitur

### Format Feature Request

```markdown
**Apakah feature request Anda terkait dengan masalah? Jelaskan.**
Deskripsi singkat tentang masalah.

**Describe the solution you'd like**
Deskripsi solusi yang Anda inginkan.

**Describe alternatives you've considered**
Alternatif solusi yang sudah dipertimbangkan.

**Additional context**
Informasi tambahan atau screenshot.
```

## 🔍 Code Review

### Checklist Reviewer

- [ ] Code mengikuti style guide
- [ ] Tidak ada hardcoded secrets
- [ ] Error handling lengkap
- [ ] Dokumentasi diupdate
- [ ] Test ditambahkan (jika perlu)
- [ ] Performance impact dipertimbangkan
- [ ] Security implications dipertimbangkan

### Feedback

- Berikan feedback yang konstruktif
- Jelaskan alasan di balik suggestion
- Apresiasi pekerjaan yang baik
- Fokus pada code, bukan person

## 📞 Kontak

Jika ada pertanyaan tentang contributing:
- Buka issue di GitHub
- Email: contribute@koperasi.id
- Discord: [Koperasi Community](https://discord.gg/koperasi)

## 📄 License

Dengan berkontribusi, Anda setuju bahwa kontribusi Anda akan dilisensikan di bawah [MIT License](LICENSE).

---

Terima kasih telah berkontribusi! 🎉
