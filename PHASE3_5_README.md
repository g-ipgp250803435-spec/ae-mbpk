# ae-MBPK Peringkat 3.5 — Integrasi Tetapan Aksesibiliti ke Semua Permainan

## Skop perubahan
- Memastikan `src/accessibility-profile.js` dimuatkan pada Portal Guru (`account.html`) selain pusat permainan, Misi Berdikari, Peneroka Braille, Papan Komunikasi dan halaman tetapan.
- Menambah fokus papan kekunci yang konsisten dan sasaran sentuh yang lebih besar melalui pengawal aksesibiliti bersama.
- Memastikan `quietMode` menghentikan suara sebutan, bunyi kesan dan muzik latar Web Audio dalam Misi Berdikari.
- Apabila mod senyap diaktifkan, ucapan pelayar dibatalkan dan muzik latar dihentikan. Jika mod senyap dimatikan semula, muzik latar hanya disambung apabila tetapan muzik permainan itu sendiri masih aktif.
- Tetapan teks, mod gelap, kontras tinggi, kurangkan animasi, sasaran sentuh dan paparan ringkas terus menggunakan kelas CSS bersama.

## Pemasangan
1. Sandarkan projek semasa.
2. Ekstrak ZIP `ae-mbpk-phase3-5` dan gabungkan kandungannya ke projek Vite.
3. Kekalkan `.env.local`.
4. Jalankan `npm install`, `npm run dev`, kemudian `npm run build`.
5. Buka setiap halaman dan cuba tetapan Aksesibiliti dari butang terapung.

## Ujian manual wajib
- Ubah saiz teks dan sahkan kandungan tidak terpotong pada telefon.
- Aktifkan mod gelap dan kontras tinggi pada setiap halaman.
- Aktifkan kurangkan animasi dan pastikan tiada animasi penting yang menghalang pemahaman.
- Aktifkan butang besar dan cuba navigasi menggunakan sentuhan.
- Aktifkan mod senyap ketika Misi Berdikari sedang memainkan muzik latar; muzik dan suara sepatutnya berhenti.
- Matikan mod senyap semula; suara hanya berfungsi apabila diminta dan muzik hanya disambung jika pilihan muzik permainan aktif.
- Gunakan papan kekunci sahaja: Tab, Shift+Tab, Enter, Space dan Escape.
- Semak Portal Guru, pusat permainan, Misi Berdikari, Peneroka Braille dan Papan Komunikasi.
- Pastikan permainan masih berfungsi apabila Speech Synthesis atau Web Audio tidak disokong.

## Ujian automatik yang dijalankan
Semakan sintaks JavaScript bagi fail sumber dan ujian unit kontrak sesi diwarisi daripada Peringkat 3.1/3.2. Binaan Vite dan ujian pelayar sebenar mesti dijalankan di komputer pembangun selepas pemasangan.

## Had dan isu yang belum disahkan
- Integrasi ini menyediakan pengawal bersama, tetapi permainan tambahan yang dibina kemudian mesti memuatkan `src/accessibility-profile.js` dan mematuhi `AE_MPBK_ACCESSIBILITY` untuk audio/tingkah laku tersuai.
- Kontras tinggi dan mod gelap bergantung juga pada gaya setiap halaman; sesetengah komponen tersuai mungkin memerlukan pembaikan CSS khusus.
- `quietMode` mengawal suara dan audio yang diketahui dalam Misi Berdikari, serta sebutan dalam modul Braille dan Papan Komunikasi. Ia bukan jaminan bahawa setiap sumber audio luaran pada masa hadapan akan dikawal secara automatik.
- Belum ada ujian pengguna bersama MBPK atau audit WCAG formal. Jangan mendakwa pematuhan penuh atau keberkesanan sebelum penilaian.
