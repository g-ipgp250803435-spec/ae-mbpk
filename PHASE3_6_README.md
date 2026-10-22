# ae-MBPK Peringkat 3.6 — Papan Pemuka Analitik Pembelajaran Bersepadu

## Fungsi
- Analitik dimuatkan hanya untuk kelas yang dipilih oleh guru yang log masuk; data dibaca melalui Supabase dan tertakluk kepada RLS sedia ada.
- Penapis murid, permainan dan tempoh (7/30/90 hari atau semua rekod).
- Kad ringkasan: jumlah sesi, murid dengan rekod, penggunaan petunjuk, langkah/tugasan yang direkodkan dan purata skor sesi jika ada skor numerik.
- Aktiviti mengikut permainan dan kemahiran, trend bilangan sesi 7 hari, sejarah sesi, eksport CSV.
- Jadual ringkasan setiap murid dengan bilangan sesi, purata skor sesi (jika tersedia), purata petunjuk per sesi dan aktiviti terakhir.
- Cadangan langkah pengajaran berasaskan peraturan ringkas, bukan AI atau diagnosis.
- Pengendalian permintaan usang apabila guru menukar kelas/refresh dengan pantas.

## Pemasangan
1. Sandarkan projek semasa.
2. Ekstrak ZIP dan gabungkan kandungan folder `ae-mbpk-phase3-6` ke projek Vite.
3. Kekalkan `.env.local` dan konfigurasi Supabase.
4. Tiada migrasi SQL baharu diperlukan; menggunakan lajur sedia ada dalam `public.game_sessions`.
5. Jalankan `npm install`, `npm run dev` dan `npm run build`.
6. Log masuk Portal Guru, pilih kelas yang mempunyai rekod sesi dan semak dashboard.
7. Uji penapis, eksport CSV dan akses menggunakan akaun guru kedua.

## Interpretasi data
- Skor ialah skor sesi yang dihantar oleh permainan. Ia bukan skor diagnostik, ukuran penguasaan sejagat atau perbandingan adil antara permainan yang berbeza.
- Cadangan tindakan dijana dengan peraturan tetap daripada bilangan sesi, petunjuk dan skor yang tersedia. Tiada AI digunakan.
- Rekod tanpa score kekal tanpa skor; dashboard tidak menganggap nilai hilang sebagai sifar.
- Murid tanpa sesi tidak dimasukkan dalam jadual ringkasan prestasi tetapi dashboard memberi peringatan bahawa mungkin tiada rekod dalam penapis semasa.
- Nama paparan yang ditunjukkan dalam dashboard berasal daripada profil murid yang diakses guru. Untuk eksport, gunakan nama samaran dan kendalikan fail mengikut dasar institusi.

## Ujian automatik yang disediakan/dijalankan
- Semakan sintaks `src/analytics.js`, `src/account.js`, modul aksesibiliti dan semua skrip sebaris halaman HTML.
- Ujian unit kontrak sesi sedia ada.
- Semakan struktur elemen DOM yang diperlukan oleh analitik.

## Ujian manual wajib
- Pilih kelas kosong dan pastikan keadaan kosong dipaparkan.
- Pilih kelas dengan rekod; semak angka terhadap beberapa baris `game_sessions`.
- Tukar murid, permainan dan tempoh; semua panel perlu berubah.
- Pastikan purata skor hanya mengambil sesi yang mempunyai skor 0–100.
- Eksport CSV dan semak kandungan dengan aplikasi spreadsheet.
- Log keluar: dashboard disembunyikan dan data lama dibersihkan.
- Log masuk guru lain: hanya kelas dan murid yang dibenarkan boleh muncul.
- Semak paparan telefon, pembaca skrin dan kontras.

## Belum disahkan
- Binaan Vite dan ujian pelayar pada komputer pengguna.
- Sambungan langsung Supabase dan hasil RLS dalam persekitaran deployment.
- Ketepatan semantik skor bagi setiap permainan; setiap permainan perlu didokumenkan secara berasingan.
- Audit WCAG atau penilaian dengan guru/MBPK belum dijalankan.
