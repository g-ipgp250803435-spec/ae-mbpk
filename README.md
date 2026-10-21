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


## Peringkat 2.2 — Integrasi Misi Berdikari

### Langkah pemasangan
1. Sandarkan projek semasa dan kekalkan `.env.local` anda (jangan komit fail itu).
2. Gantikan/tambah fail daripada pakej ini ke folder projek anda.
3. Dalam Supabase SQL Editor, jalankan `supabase/migrations/202610210003_game_session_sync.sql` selepas migrasi Peringkat 2.1.
4. Jalankan `npm install` kemudian `npm run dev`.
5. Log masuk ke `/account.html`, pilih kelas dan cipta/gunakan profil samaran. Klik **Mainkan Misi Berdikari** pada profil itu.
6. Lengkapkan satu misi; semak banner penyegerakan dan senarai **Rekod permainan terkini** pada Portal Guru.
7. Jika lulus di localhost, push perubahan ke GitHub dan tunggu deployment Vercel selesai. Pastikan env vars Production kekal disediakan.

### Apa yang direkodkan
Sesi selesai menyimpan permainan, kemahiran, percubaan, petunjuk, tempoh (jika boleh dikira), bilangan langkah selesai, langkah tanpa petunjuk/dengan bantuan, kesilapan dan ringkasan langkah. `score` sengaja `NULL`: melengkapkan permainan bukan bukti automatik penguasaan kemahiran.

### Perlindungan duplikasi dan akses
Setiap larian mempunyai `client_session_id` UUID yang stabil. Indeks unik menghalang sesi yang sama disimpan dua kali apabila percubaan ulang berlaku. Polisi RLS sedia ada dikekalkan; insert memerlukan `created_by = auth.uid()` dan murid dalam kelas yang dimiliki guru semasa. Jangan tambah polisi RLS umum yang membenarkan semua pengguna authenticated mengakses semua sesi.

### Ujian yang perlu dilakukan
- Buka game dari butang profil murid dan pastikan banner menyebut profil samaran yang betul.
- Lengkapkan satu misi dan semak satu baris baru dalam Portal Guru.
- Refresh Portal Guru dan pastikan rekod kekal.
- Klik cuba simpan semula selepas simulasi ralat rangkaian; pastikan tiada rekod berganda.
- Buka game tanpa `studentId`: game patut boleh dimainkan setempat tetapi tidak mendakwa rekod disegerakkan.
- Log masuk Guru B dan pastikan rekod Guru A tidak dipaparkan.
- Uji export CSV pada kelas yang mempunyai rekod.

### Had
Rekod dihantar pada penghujung misi sahaja; kemajuan yang belum selesai kekal pada localStorage peranti. Jika pelayar ditutup sebelum misi selesai, sesi itu belum dihantar ke Supabase. Ujian sebenar masih perlu dibuat pada projek Supabase/Vercel anda. Gunakan profil samaran sahaja sehingga keperluan privasi, kebenaran, pengekalan dan pemadaman data disahkan.


## Peringkat 2.3 — Dashboard Analitik Guru

Dashboard analitik ditambah pada Portal Guru dan menggunakan jadual `game_sessions` sedia ada. Tiada migrasi SQL tambahan diperlukan untuk dashboard ini.

### Fungsi
- KPI sesi direkodkan, murid dengan rekod, jumlah petunjuk dan langkah selesai (jika wujud dalam `result_summary`).
- Penapis murid, permainan dan tempoh (7/30/90 hari atau semua rekod).
- Ringkasan sesi mengikut permainan dan kemahiran, trend sesi 7 hari, sejarah sesi dan eksport CSV.
- Data dibaca melalui Supabase dengan RLS sedia ada; hanya murid dalam kelas yang dipilih diminta.

### Pemasangan
1. Sandarkan projek semasa.
2. Gabungkan fail pakej ini ke dalam projek Vite sedia ada. Kekalkan `.env.local`.
3. Tiada SQL baharu diperlukan untuk Peringkat 2.3.
4. Jalankan `npm install` kemudian `npm run dev`. Buka Portal Guru, log masuk dan pilih kelas.
5. Uji eksport CSV dan pengasingan data sebelum push ke GitHub/Vercel.

### Batasan dan interpretasi
- Dashboard merumuskan hanya sesi yang berjaya disimpan ke `game_sessions`.
- Paparan sejarah dihadkan kepada 100 rekod; query analitik memuatkan maksimum 5,000 sesi bagi kelas dipilih.
- Rekod lama mungkin tiada beberapa medan dalam `result_summary`; paparan akan menunjukkan nilai sifar/tiada data jika maklumat itu tidak dihantar oleh permainan.
- Jumlah petunjuk atau percubaan bukan skor penguasaan dan tidak boleh digunakan sendirian untuk melabel murid. Guru perlu menafsirkan rekod dalam konteks pengajaran.
- Binaan produksi, ujian live Supabase dan deployment Vercel perlu dilakukan dalam persekitaran pemilik projek; tidak ditandakan lulus di sini.
