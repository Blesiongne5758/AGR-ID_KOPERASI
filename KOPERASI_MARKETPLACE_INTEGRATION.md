# Integrasi anggota KOPERASI → AGR-ID Marketplace

Integrasi ini menyinkronkan direktori koperasi dan roster anggota resmi dari database KOPERASI ke AGR-ID. Pengguna marketplace memilih koperasi, memasukkan nomor dan nama anggota, lalu status keanggotaannya dicocokkan dengan roster. Data contoh di UI KOPERASI tidak dipakai sebagai sumber sinkronisasi.

## Alur pengguna

1. Pengguna masuk ke AGR-ID dan membuka Pengaturan Akun → Keanggotaan Koperasi.
2. Pengguna memilih koperasi yang aktif dari direktori AGR-ID, lalu memasukkan nomor anggota dan nama sesuai catatan koperasi.
3. AGR-ID menandai anggota sebagai terdaftar jika nomor dan nama cocok dengan roster terbaru. Jika belum cocok, pengajuan masuk ke Dashboard Admin AGR-ID untuk diperiksa.
4. Koperasi nonaktif atau anggota yang tidak aktif pada snapshot tidak dapat diverifikasi sebagai anggota aktif.

## Pengirim di KOPERASI

```
server/agrid-sync.mjs
npm run sync:agrid
```

Job mengambil semua baris `cooperatives` dan `memberships` beserta nama pengguna dari Supabase. Nomor anggota menggunakan `memberships.member_number` dan fallback ke `users.member_id`. ID keanggotaan menjadi ID eksternal anggota. Email, nomor telepon, password, data simpanan, serta data pinjaman tidak dikirim.

Siapkan variabel berikut hanya di secret manager/server KOPERASI:

- `SUPABASE_URL` — URL proyek KOPERASI.
- `SUPABASE_SERVICE_ROLE_KEY` — akses server ke tabel; jangan pernah masukkan ke frontend.
- `AGRID_BASE_URL` — URL deployment AGR-ID.
- `AGRID_API_TOKEN` — token integrasi ber-role `koperasi` yang dibuat di Dashboard Admin AGR-ID.

Jalankan sinkronisasi manual dengan `npm run sync:agrid`. Untuk sinkron harian, atur scheduler pada host KOPERASI ke pukul 02.00 WIB (`0 2 * * *`). Job memakai HTTPS, timeout 30 detik, maksimal tiga percobaan, dan tidak mencatat payload atau token ke log. Jangan gunakan GitHub PAT sebagai kredensial API runtime.

`snapshot: true` mengirim semua koperasi dan keanggotaan, termasuk status tidak aktif, agar AGR-ID dapat memperbarui roster keseluruhan. Snapshot kosong ditolak agar kesalahan konfigurasi tidak mengirim daftar kosong.

## Penerima di AGR-ID

`POST /api/v1/cooperatives/sync` menerima Bearer token dengan role `koperasi`. Token itu dibatasi ke endpoint sinkronisasi. AGR-ID menyimpan direktori koperasi, roster resmi, dan tautan akun anggota. Migrasi tabel marketplace ada pada `supabase/migrations/0009_cooperative_membership.sql`; endpoint dan alur akun berada di perubahan lokal AGR-ID.

## Batasan operasional

Sinkronisasi ini menghubungkan identitas dan status anggota untuk pemilihan koperasi pada marketplace. Ia tidak menyinkronkan katalog produk, stok, pesanan, saldo, atau pembayaran. Setelah deployment AGR-ID dan secrets KOPERASI dikonfigurasi, admin harus menjalankan sinkron pertama dan memastikan respons sukses sebelum anggota menggunakan pencocokan otomatis.
