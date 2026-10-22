# ae-MBPK Peringkat 3.4 — Tetapan aksesibiliti pada profil murid

## Tujuan
Peringkat ini membolehkan guru menyimpan pilihan paparan aksesibiliti untuk setiap profil murid dan memuatkannya semula apabila profil yang sama dibuka. Tetapan ini hanya mengandungi pilihan UI, bukan diagnosis, catatan klinikal atau maklumat sensitif.

## Perubahan
- Tambah jadual `public.student_accessibility_preferences` melalui migrasi SQL baharu.
- RLS hanya membenarkan guru membaca/menambah/mengemas kini tetapan bagi murid dalam kelas miliknya, berdasarkan hubungan student -> class -> teacher.
- Portal Guru mempunyai pintasan "Tetapan Aksesibiliti" bagi setiap profil murid.
- `src/accessibility-profile.js` memeriksa sesi guru dan profil murid apabila URL mengandungi `?studentId=...`.
- Tetapan tersimpan dimuatkan secara automatik untuk profil yang disahkan. Penyimpanan awan hanya berlaku apabila guru menekan "Simpan untuk profil murid".
- Pilihan tanpa `studentId` kekal setempat pada peranti dan tidak dihantar ke pelayan.
- Tiada nama, diagnosis, teks komunikasi atau data jawapan disimpan dalam jadual ini.

## Pemasangan
1. Sandarkan folder projek dan pangkalan data.
2. Gabungkan kandungan folder `ae-mbpk-phase3-4` ke projek Vite.
3. Kekalkan `.env.local` dan konfigurasi Vercel.
4. Dalam Supabase SQL Editor, jalankan `supabase/migrations/202610210006_accessibility_preferences.sql` sekali.
5. Jalankan `npm install`, `npm run dev`, dan `npm run build`.
6. Log masuk Portal Guru, buka kelas, pilih profil demo dan klik "Tetapan Aksesibiliti".
7. Ubah satu tetapan dan klik butang "Aksesibiliti" terapung untuk membuka panel; pilih "Simpan untuk profil murid".
8. Refresh halaman dan pastikan tetapan dimuatkan semula.
9. Log masuk menggunakan akaun guru lain dan cuba URL profil guru pertama. Profil/tetapan tidak boleh dibaca atau diubah jika polisi RLS betul.

## Polisi privasi dan batasan
- Simpan hanya tetapan: textScale, darkMode, highContrast, reduceMotion, largeTargets, quietMode, calmView.
- RLS melindungi akses berdasarkan pemilikan kelas. Jangan menambah policy luas untuk `authenticated`.
- `localStorage` masih digunakan untuk tetapan semasa pada peranti; apabila profil disahkan, rekod profil menjadi sumber tetapan awal untuk halaman itu.
- Penyegerakan ini bukan pengurusan identiti murid penuh atau kebenaran penjaga; ikut polisi institusi dan dapatkan kebenaran yang sesuai sebelum menggunakan data sebenar.
- Tetapan boleh mempengaruhi hanya komponen yang disambungkan kepada stylesheet/event hooks. Uji setiap permainan untuk memastikan audio/animasi benar-benar menghormati pilihan.
- Penghapusan profil murid akan memadam tetapan berkaitan melalui `ON DELETE CASCADE`.

## Ujian
Semakan sintaks dan ujian unit boleh dijalankan dengan arahan berikut. Ujian langsung Supabase/RLS perlu dibuat dalam projek anda selepas migrasi.

```bat
npm run build
node test-game-session.mjs
```

## Belum disahkan
- Migrasi belum dijalankan pada pangkalan data pengguna.
- Akses RLS, simpan/muat tetapan dan tingkah laku dua akaun guru belum diuji pada Supabase sebenar.
- Ujian pembaca skrin, peranti mudah alih dan penilaian bersama MBPK belum dijalankan.
