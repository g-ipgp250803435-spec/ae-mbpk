# ae-MBPK — Portal Guru & Profil Pemain UI Polish

## Perubahan
- Portal Guru: kad profil murid kini mempunyai ruang yang konsisten, metadata kod murid seperti lencana, dan susun atur butang responsif (3 lajur desktop, 2 lajur tablet/telefon, 1 lajur skrin sangat kecil).
- Ruang antara butang diperbesar; label panjang dibalut dengan kemas dan sasaran sentuh minimum 44px.
- Butang `Ruang Guru` pada topbar aplikasi murid dibuang. `Teacher Studio` dalam navigasi sisi dan pautan Portal Guru kekal tersedia.
- Butang terapung `Misi Berdikari` dibuang daripada aplikasi induk.
- Pelancar terapung `Aksesibiliti` disembunyikan. Tetapan aksesibiliti masih boleh dibuka melalui kawalan aksesibiliti dalam topbar dan halaman Tetapan.
- Modal Profil Pemain direka semula dengan avatar inisial dinamik, pratonton nama, borang lebih kemas dan nota privasi ringkas. Notis lama tentang “Peringkat backend” dibuang.
- Nama/inisial pemain yang disimpan dipaparkan pada avatar topbar.

## Pemasangan
1. Sandarkan projek semasa.
2. Ekstrak ZIP dan gabungkan kandungan `ae-mbpk-portal-polish` dengan projek Vite sedia ada.
3. Kekalkan `.env.local`.
4. Jalankan:
   ```bat
   npm run check:release
   npm run check:a11y:static
   node test-game-session.mjs
   npm run dev
   ```
5. Uji Portal Guru pada desktop dan telefon, serta modal Profil Pemain.

## Ujian yang dijalankan dalam persekitaran pembangunan
- `node --check` pada fail JavaScript yang diubah: lulus.
- Semakan sintaks skrip sebaris `index.html` dan `accessibility.html`: lulus.
- `check:release`: lulus.
- Pemeriksa aksesibiliti statik: 0 kegagalan dan 0 amaran.
- Ujian unit sesi permainan sedia ada: lulus.

## Belum disahkan
- Binaan Vite penuh dan paparan sebenar dalam pelayar pengguna.
- Tingkah laku pada semua saiz skrin dan peranti pembaca skrin.
- Deployment Vercel selepas perubahan.
