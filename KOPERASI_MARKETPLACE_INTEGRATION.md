# Integrasi registri anggota KOPERASI → AGR-ID

Repo `Blesiongne5758/AGR-ID_KOPERASI` saat ditinjau hanya memiliki README, tanpa kode aplikasi, API, atau skema registri. Karena itu AGR-ID kini menyediakan endpoint penerima sinkronisasi; implementasi KOPERASI perlu mengirim data resmi ke endpoint ini agar pengguna dapat dipastikan sebagai anggota terdaftar.

## Endpoint AGR-ID

`POST /api/v1/cooperatives/sync`

Autentikasi memakai `Authorization: Bearer <token>` dengan API token berperan `koperasi` yang dibuat dari panel Direktori Koperasi di Dashboard Admin AGR-ID. Token ini hanya diizinkan mengakses endpoint sinkronisasi. Simpan hanya di secret manager/environment KOPERASI, dan jangan memakai GitHub PAT sebagai token runtime.

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

`snapshot: true` menandakan roster lengkap untuk tiap koperasi yang dikirim. Anggota aktif yang tidak ada pada snapshot koperasi tersebut dinonaktifkan untuk pencocokan baru. Untuk update parsial gunakan `snapshot: false`; set `active: false` untuk menonaktifkan data tertentu.

AGR-ID mencocokkan nomor anggota dengan nama terdaftar atau email akun marketplace. Cocok langsung menjadi status `terdaftar`; ketidakcocokan masuk ke antrean verifikasi admin. Data identitas dikirim melalui HTTPS, dibatasi ke kebutuhan sinkronisasi, dan tidak dicatat ke log.

```json
{
  "ok": true,
  "cooperatives_synced": 1,
  "members_synced": 1,
  "snapshot": true
}
```

## Implementasi yang sudah ada di AGR-ID

- Direktori `koperasi` dan roster `koperasi_anggota` menerima sumber resmi melalui endpoint sinkronisasi.
- Pengguna memilih koperasi di Pengaturan Pengguna, memasukkan nomor dan nama anggota, lalu mendapat status terdaftar otomatis saat datanya cocok.
- Pengajuan yang belum cocok muncul di Dashboard Admin untuk pemeriksaan manual.
- Migrasi Supabase `0009_cooperative_membership.sql` membuat tabel direktori, roster, dan tautan akun.

## Berikutnya di repo KOPERASI

Tambahkan job sinkronisasi yang membaca daftar koperasi dan roster resmi, membentuk payload di atas, lalu mengirimkannya berkala dengan token integrasi yang tersimpan sebagai secret. Repo KOPERASI belum memiliki sumber data atau stack aplikasi yang dapat dijadikan implementasi job tersebut.
