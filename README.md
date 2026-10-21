# ae-MBPK — Peringkat 2 (Auth + kelas)

Pakej ini mengekalkan prototaip ae-MBPK dan menambah portal guru awal yang menggunakan Supabase untuk akaun, kelas dan profil murid samaran.

## Teknologi
- Vite untuk pembangunan dan binaan statik.
- Supabase Auth (e-mel/kata laluan).
- PostgreSQL dengan Row Level Security (RLS).
- GitHub untuk kod sumber dan Vercel untuk deployment.

## 1. Sediakan Supabase
1. Cipta projek di https://supabase.com/dashboard.
2. Buka SQL Editor dan jalankan `supabase/migrations/202610210001_initial_schema.sql`.
3. Dalam Authentication → URL Configuration, tetapkan Site URL kepada URL Vercel anda.
4. Tambah Redirect URL untuk URL production `/account.html` dan URL localhost `/account.html`.
5. Semak tetapan pengesahan e-mel. Untuk produksi, sediakan SMTP khusus dan hadkan pendaftaran kepada guru yang diluluskan.

## 2. Konfigurasi tempatan
```bash
npm install
cp .env.example .env.local
```
Edit `.env.local` dan masukkan:
- `VITE_SUPABASE_URL` — Project URL dari Supabase.
- `VITE_SUPABASE_PUBLISHABLE_KEY` — publishable key dari Supabase.

Jangan masukkan secret/service_role key ke dalam `.env.local` yang bermula dengan `VITE_`, kod browser, GitHub atau Vercel client environment.

Kemudian jalankan:
```bash
npm run dev
```
Buka URL yang dipaparkan, kemudian klik `Portal Guru` atau buka `/account.html`.

## 3. Deployment Vercel
1. Push folder projek ini ke repository GitHub yang disambungkan kepada Vercel.
2. Dalam Vercel → Project → Settings → Environment Variables, tambah `VITE_SUPABASE_URL` dan `VITE_SUPABASE_PUBLISHABLE_KEY` untuk environment yang diperlukan.
3. Redeploy selepas mengubah environment variables.
4. Pastikan Supabase Auth URL Configuration mempunyai domain Vercel production dan URL preview yang benar-benar digunakan.
5. Jalankan ujian dengan dua akaun guru berasingan: setiap guru hanya boleh melihat kelas dan profil miliknya.

## 4. Ciri yang dilaksanakan dalam portal
- Daftar akaun guru, log masuk, log keluar dan minta pautan reset kata laluan.
- Muatkan kelas milik guru, tambah kelas dan pilih kelas.
- Tambah profil murid menggunakan nama paparan/nama samaran serta kod pilihan.
- RLS memisahkan rekod berdasarkan guru pemilik kelas.
- Pautan kembali ke prototaip dan portal guru.

## 5. Had yang mesti difahami
- Ini ialah asas Peringkat 2, bukan sistem produksi yang telah diaudit.
- Pengesahan e-mel, SMTP, domain dan polisi pendaftaran mesti dikonfigurasi dalam dashboard Supabase.
- Portal belum mempunyai jemputan guru, peranan pentadbir institusi, perkongsian kelas, pemadaman kelas/profil dalam UI atau integrasi rekod permainan ke dalam `game_sessions`.
- `profiles` tidak menyediakan pengurusan peranan admin; jangan anggap sesiapa sebagai admin berdasarkan metadata yang dihantar klien.
- Nama paparan dan kod murid masih merupakan data peribadi berpotensi. Gunakan nama samaran dan jangan simpan diagnosis, laporan klinikal atau nombor pengenalan.
- Sebelum penggunaan sebenar, sahkan keperluan institusi, kebenaran yang sesuai, notis privasi, tempoh penyimpanan/pemadaman dan ujian keselamatan.

## 6. Ujian yang boleh dijalankan
```bash
npm run build
npm run preview
```
Senarai semak manual:
- Daftar akaun dan sahkan e-mel.
- Log masuk, log keluar dan aliran reset kata laluan.
- Cipta kelas dan profil samaran.
- Log masuk dengan akaun kedua dan pastikan kelas akaun pertama tidak kelihatan.
- Cuba baca/tulis rekod tanpa sesi; akses patut ditolak.
- Refresh halaman dan pastikan sesi auth kekal jika konfigurasi membenarkan.
- Uji pada telefon, papan kekunci dan pembaca skrin asas.
