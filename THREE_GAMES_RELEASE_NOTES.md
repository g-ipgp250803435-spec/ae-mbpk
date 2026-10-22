# ae-MBPK — Dunia Emosi, Langkah Demi Langkah & Tangan Berbicara

## Apa yang disediakan
- **Dunia Emosi**: aktiviti mengenal emosi melalui situasi ringkas, tiga tahap, petunjuk bertahap dan refleksi bersama guru. Kandungan tidak menganggap satu emosi sebagai jawapan universal untuk semua orang.
- **Langkah Demi Langkah**: urutan rutin basuh tangan, bersedia ke sekolah dan mengemas beg. Murid menekan kad mengikut turutan; tiada drag-and-drop. Tiga aras memilih 3, 4 atau 5 langkah.
- **Tangan Berbicara**: kuiz tujuan komunikasi untuk kosa kata berkaitan bantuan, penghargaan, pilihan, keperluan dan sempadan. **Penting:** halaman ini tidak mereka-reka gerakan BIM. Demonstrasi/video BIM sebenar perlu disediakan dan disemak oleh pengajar BIM atau komuniti Pekak yang kompeten sebelum ia dipasarkan sebagai pengajaran BIM penuh.
- Ketiga-tiga halaman menggunakan runtime sesi pembelajaran ae-MBPK, kawalan petunjuk dan status rekod yang jelas.
- Semua halaman ditambah ke `vite.config.js`, katalog `src/game-registry.js` dan pemeriksa pelepasan.

## Pasang dan uji
1. Sandarkan projek semasa.
2. Gabungkan fail pakej dengan projek Vite sedia ada. Kekalkan `.env.local`.
3. Jalankan:
   ```bat
   npm install
   npm run check:release
   npm run check:a11y:static
   npm run check:games
   npm run check:added-games
   node test-game-session.mjs
   npm run dev
   ```
4. Uji laluan:
   - `/dunia-emosi.html`
   - `/langkah-demi-langkah.html`
   - `/tangan-berbicara.html`
5. Selepas ujian setempat, jalankan `npm run build`, kemudian uji `npm run preview` dan deployment Vercel.

## Semakan yang benar-benar dijalankan semasa pakej disediakan
- Semakan sintaks fail registry, konfigurasi Vite dan skrip pemeriksaan: lulus.
- Semakan sintaks modul sebaris ketiga-tiga halaman: lulus.
- `node scripts/prepublish-check.mjs`: lulus.
- `node scripts/accessibility-static-check.mjs`: lulus tanpa kegagalan/amaran yang dikesan skrip.
- `node scripts/check-learning-games.mjs`: lulus untuk KataQuest dan NomborNinja.
- `node scripts/check-added-games.mjs`: mengesahkan registry, route, kemahiran, runtime dan input Vite bagi ketiga-tiga permainan baharu.
- `node test-game-session.mjs`: lulus.

Binaan produksi, ujian pelayar sebenar, pembaca skrin dan deployment Vercel belum disahkan dalam persekitaran ini. Prototaip belum membuktikan keberkesanan pembelajaran MBPK secara empirikal.
