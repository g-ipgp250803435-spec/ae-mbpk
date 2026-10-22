# ae-MBPK UI Refinement — Braille, AAC, Topbar and Dark Mode

## Perubahan
- Peneroka Braille: grid sel enam titik kini mengisi secara lajur; titik 1–2–3 di lajur kiri dan 4–5–6 di lajur kanan. Padanan data huruf a–j dikekalkan mengikut pola Braille asas.
- Peneroka Braille dan Papan Komunikasi Saya: butang “Kembali ke pusat” mendapat jarak, padding dan susun atur responsif yang lebih konsisten.
- Papan Komunikasi Saya: simbol abstrak hitam putih diganti dengan emoji yang lebih berkaitan dengan maksud mesej.
- Portal Guru terapung: boleh diseret dengan tetikus atau sentuhan, kedudukan disimpan setempat, kedudukan dihadkan supaya kekal dalam viewport, dan boleh dialihkan dengan Alt+Arrow pada papan kekunci. Seretan tidak membuka pautan.
- Bar tajuk: ikon Bahasa, mod gelap/cerah, aksesibiliti dan profil menggunakan imej CDN Flaticon dengan SVG fallback. Pautan atribusi Flaticon ditambah dalam footer.
- Navigasi: butang “Sesuaikan pengalaman” pada halaman utama, CTA “Laraskan pengalaman” pada kad sisi dan item “Tetapan akses” pada side navigation serta mobile navigation dibuang. Tetapan aksesibiliti masih boleh dibuka melalui ikon aksesibiliti di topbar.
- Kad Pusat Pembelajaran dan Kenali MBPK: ikon menerima kelas warna kategori dan palet kontras yang lebih jelas dalam mod gelap.

## Nota ikon Flaticon
Ikon diambil daripada CDN Flaticon untuk kegunaan web. Pautan atribusi disediakan dalam footer. Aset memerlukan sambungan internet untuk dimuatkan; SVG fallback digunakan jika permintaan aset gagal.

## Ujian
- `node --check` untuk JavaScript sumber yang berkaitan.
- Semakan sintaks JavaScript sebaris bagi halaman yang diubah.
- `npm run check:release`, `npm run check:a11y:static`, `node test-game-session.mjs` dan `npm run check:added-games` jika tersedia.
- Binaan Vite dan pemeriksaan visual pada pelayar sebenar perlu dijalankan selepas memasang pakej ini.
