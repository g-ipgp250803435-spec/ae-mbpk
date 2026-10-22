# ae-MBPK Peringkat 4 — Pengukuhan Kualiti, Keselamatan dan Persediaan Penerbitan

## Apa yang ditambah dalam pakej ini
- Konfigurasi Vite multi-page memasukkan enam halaman HTML sedia ada supaya semuanya menjadi input binaan produksi.
- `vercel.json` menetapkan header keselamatan asas: `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, dan `Permissions-Policy`.
- Skrip `npm run check:release` untuk semakan statik fail penting, konfigurasi environment, input Vite, dan header Vercel.
- Panduan senarai semak pelepasan dan ujian manual untuk keselamatan, aksesibiliti, fungsi, prestasi, serta deployment.

## Pemasangan
1. Sandarkan projek Peringkat 3.9 dan pastikan perubahan terkini sudah disimpan dalam Git.
2. Ekstrak ZIP dan gabungkan kandungan `ae-mbpk-phase4` ke projek Vite.
3. Kekalkan `.env.local` setempat; jangan commit atau hantar fail itu.
4. Jalankan:
   ```bat
   npm install
   npm run check:release
   npm run build
   ```
5. Periksa folder `dist`. Pastikan `index.html`, `account.html`, `misi-berdikari.html`, `accessibility.html`, `braille.html`, dan `communication-board.html` semuanya terhasil.
6. Uji:
   ```bat
   npm run preview
   ```
   Buka semua halaman dan jalankan senarai ujian di bawah.
7. Push ke GitHub dan pastikan Vercel membina commit yang betul. Tetapkan `VITE_SUPABASE_URL` dan `VITE_SUPABASE_PUBLISHABLE_KEY` di Vercel untuk environment yang digunakan, kemudian redeploy.

## Penting tentang kunci dan data
- `VITE_` variables dibenamkan ke dalam kod klien. Supabase publishable key memang boleh berada di klien, tetapi akses data mesti dilindungi oleh RLS dan polisi pangkalan data yang betul.
- Jangan sekali-kali letakkan `service_role` atau `sb_secret_` key dalam kod klien, `.env.example`, GitHub, atau Vercel client environment.
- Header keselamatan tidak menggantikan RLS, kawalan akses, atau audit keselamatan.
- Pakej ini tidak menguatkuasakan Content Security Policy (CSP) kerana HTML semasa menggunakan skrip/gaya sebaris dan domain Supabase perlu disahkan terlebih dahulu. CSP boleh ditambah selepas diuji dalam mod Report-Only atau persekitaran staging.
- `X-Frame-Options: DENY` menghalang embedding aplikasi dalam iframe. Jika kelak aplikasi memerlukan embedding, semak semula polisi ini.
- `Cross-Origin-Resource-Policy: same-site` tidak dimasukkan secara lalai kerana ia boleh mengganggu aset yang dihoskan silang-origin; tambah hanya selepas diuji.

## Apa yang skrip `check:release` periksa
- Fail penting dan enam halaman HTML.
- Script npm yang diperlukan.
- `.gitignore` untuk `.env.*` sambil membenarkan `.env.example`.
- Pemboleh ubah Supabase yang dijangka.
- Input Vite untuk semua halaman.
- Header keselamatan asas dalam `vercel.json`.
- Bilangan fail migrasi SQL (bukan sama ada migrasi sudah diterapkan).

Skrip ini ialah pemeriksaan statik. Ia tidak menguji pangkalan data, RLS sebenar, pelayar, akaun, atau deployment Vercel.

## Senarai ujian manual sebelum penerbitan

### Build dan navigasi
- [ ] `npm run check:release` selesai tanpa kegagalan.
- [ ] `npm run build` selesai dengan kod keluar 0.
- [ ] Semua enam halaman wujud dalam `dist`.
- [ ] Semua pautan/navigasi antara halaman berfungsi selepas `npm run preview`.
- [ ] Muat semula terus URL halaman dalaman tidak menghasilkan 404.

### Akaun dan keselamatan
- [ ] Daftar, log masuk, log keluar, refresh token dan sesi tamat diuji.
- [ ] Guru A dan B tidak dapat melihat atau mengubah data satu sama lain.
- [ ] RLS diuji melalui permintaan sebenar menggunakan dua akaun demo.
- [ ] Uji akaun tanpa kelas, kelas kosong dan profil murid tanpa sesi.
- [ ] Pastikan tiada service-role/secret key dalam bundle `dist` atau repositori.
- [ ] Semak header yang benar-benar diterima dari domain Vercel melalui DevTools/Network.
- [ ] Semak domain redirect/auth Supabase untuk produksi.

### Fungsi dan data
- [ ] Mainkan setiap permainan dan pastikan sesi disimpan sekali sahaja.
- [ ] Semak analitik, pelan susulan, status/refleksi dan laporan.
- [ ] Uji eksport CSV/HTML dan kendalikan fail secara selamat.
- [ ] Uji refresh, logout/login dan perubahan kelas.
- [ ] Uji keadaan rangkaian terputus, Supabase tidak tersedia dan mesej ralat.

### Aksesibiliti dan peranti
- [ ] Papan kekunci sahaja: Tab, Shift+Tab, Enter, Space dan fokus jelas.
- [ ] Pembaca skrin: label butang, borang, status dan mesej ralat.
- [ ] Kontras teks, zoom 200%, saiz sasaran sentuhan dan reflow.
- [ ] Reduced motion dan kawalan audio/animasi.
- [ ] Telefon kecil, tablet dan desktop; potret dan landskap.

### Operasi penerbitan
- [ ] `.env.local` tidak berada dalam Git.
- [ ] Variables ditetapkan dalam Vercel untuk Production dan Preview yang diperlukan.
- [ ] Build log Vercel bersih daripada ralat.
- [ ] Domain produksi, HTTPS, auth callback/redirect dan header diuji.
- [ ] Prosedur sandaran, pemulihan, tempoh simpanan dan permintaan pemadaman data ditetapkan.
- [ ] Notis privasi, persetujuan institusi/penjaga dan protokol ujian MBPK disediakan sebelum ujian pengguna sebenar.

## Keputusan ujian dalam persekitaran pembangunan
Catat keputusan sebenar selepas menjalankan arahan. Jangan anggap lulus hanya kerana skrip statik lulus:
- `npm run check:release`: __________
- `npm run build`: __________
- `npm run preview`: __________
- Ujian dua akaun/RLS: __________
- Ujian aksesibiliti manual: __________
- Deployment Vercel: __________

## Had tuntutan
Pakej ini menyediakan konfigurasi dan senarai semak, bukan pengesahan bahawa aplikasi sudah 100% selamat atau sedia digunakan secara meluas. Sebelum penggunaan dengan murid sebenar, lakukan ujian penerimaan bersama guru, semakan privasi institusi, dan penilaian aksesibiliti dengan pengguna yang relevan.
