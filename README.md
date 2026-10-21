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

## Peringkat 2.1 — Edit dan padam kelas/profil

1. Pastikan migrasi awal `202610210001_initial_schema.sql` sudah dijalankan.
2. Jalankan migrasi baharu `supabase/migrations/202610210002_phase21_management_safety.sql` dalam Supabase SQL Editor.
3. Commit dan push perubahan projek ke GitHub, kemudian tunggu deployment Vercel selesai.
4. Uji dengan akaun Guru A dan Guru B yang berasingan.

Fungsi portal:
- Edit nama kelas dan nama paparan/kod profil menggunakan dialog input pelayar.
- Padam kelas hanya apabila tiada profil murid; semakan ini turut dikuatkuasakan oleh trigger pangkalan data.
- Padam profil murid memerlukan pengesahan yang menerangkan bahawa sesi permainan berkaitan turut dipadam secara kekal.
- Semua perubahan menggunakan Supabase client yang disahkan; RLS kekal sebagai kawalan akses sebenar. Butang tersembunyi sahaja bukan kawalan keselamatan.

### Ujian manual Peringkat 2.1
- Edit nama kelas dan pastikan perubahan kekal selepas refresh.
- Cuba padam kelas yang masih mempunyai profil: UI patut menolak tindakan tersebut.
- Jika menghantar permintaan DELETE kelas secara langsung ketika kelas mempunyai profil, trigger SQL patut menolaknya.
- Edit nama paparan/kod profil dan pastikan perubahan kekal selepas refresh.
- Padam profil demo dan pastikan profil hilang; fahami bahawa rekod `game_sessions` berkaitan turut dipadam.
- Batalkan setiap dialog pengesahan dan pastikan tiada data berubah.
- Log masuk sebagai Guru B dan pastikan kelas/profil Guru A tidak boleh diubah atau dipadam.
- Uji nama kosong dan nilai yang melebihi had aksara.

### Nota keselamatan
- Memadam profil murid adalah tindakan kekal dan memadam sesi berkaitan kerana foreign key `ON DELETE CASCADE` pada `game_sessions.student_id`.
- Kelas yang masih mempunyai profil tidak boleh dipadam. Padam profil satu demi satu hanya jika benar-benar diperlukan.
- Dialog `prompt` dan `confirm` menggunakan dialog natif pelayar untuk prototaip; ia boleh diganti kemudian dengan modal aksesibel yang disepadukan dengan reka bentuk ae-MBPK.
- Migrasi perlu disemak dan diuji pada projek Supabase yang betul sebelum penggunaan sebenar.
