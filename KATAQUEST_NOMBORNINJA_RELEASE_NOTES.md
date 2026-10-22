# KataQuest & NomborNinja — Nota Integrasi

## KataQuest
- Tiga mod: kenal suku kata pertama, bina perkataan melalui pilihan jubin suku kata (sentuh/klik, bukan drag wajib), serta baca dan padan perkataan.
- Bank perkataan Bahasa Melayu mempunyai ilustrasi SVG setempat yang dipadankan dengan perkataan. Pemeriksaan statik mengesahkan gabungan suku kata membentuk ejaan perkataan.
- Tahap Asas, Pertengahan dan Pengukuhan.
- Sebutan pilihan menggunakan `speechSynthesis`; jika tidak disokong atau mod senyap aktif, latihan visual masih berfungsi.
- Petunjuk bertahap, cubaan semula tanpa hukuman, kemajuan misi, lencana dan popup pencapaian.

## NomborNinja
- Tiga mod: kira objek yang boleh ditandakan dengan sentuhan, banding kuantiti kiri/kanan/sama, serta operasi tambah dan tolak.
- Tahap 1–5, 1–10 dan 1–20.
- Objek manipulatif dan ilustrasi CSS/SVG setempat; tiada aset luar atau emoji sebagai ikon.
- Petunjuk bertahap, sebutan arahan pilihan, lencana dan popup pencapaian.

## Integrasi data
- Kedua-dua permainan mendaftarkan sesi melalui `src/learning-game-runtime.js` dan kontrak `src/game-session.js`.
- Jika dibuka dari profil murid dalam Portal Guru, `studentId` dihantar melalui URL. Rekod hanya disegerakkan apabila guru disahkan log masuk dan profil murid boleh dicapai melalui RLS.
- Jika profil tidak disambungkan, permainan masih boleh digunakan dalam mod setempat; ia tidak mendakwa data telah disegerakkan.
- Skor dipaparkan berdasarkan jawapan betul pada percubaan pertama. Murid boleh mencuba semula tanpa kehilangan tugasan. Skor sesi bukan ukuran diagnosis atau penguasaan keseluruhan.
- Label permainan dan kemahiran untuk analitik guru telah ditambah.

## Arahan selepas gabung ke projek
1. Sandarkan projek sedia ada.
2. Gabungkan fail pakej ini ke projek Vite. Kekalkan `.env.local` dan tetapan Supabase sedia ada.
3. Jalankan:
   ```bat
   npm run check:games
   npm run check:added-games
   npm run check:release
   npm run check:a11y:static
   npm run build
   npm run dev
   ```
4. Dalam Portal Guru, pilih kelas dan profil murid. Uji butang KataQuest dan NomborNinja; pastikan URL mempunyai `studentId`.
5. Lengkapkan satu sesi bagi setiap permainan dan sahkan rekod muncul pada rekod/analitik guru. Uji juga buka terus dari katalog untuk memastikan mod setempat masih boleh dimainkan.
6. Semak desktop, telefon/tablet, papan kekunci, pembaca skrin, audio dimatikan dan `prefers-reduced-motion` sebelum deployment Vercel.

## Keputusan semakan yang benar-benar dijalankan
- `node --check` pada modul JavaScript yang diubah dan skrip sebaris HTML: lulus.
- `npm run check:games`: lulus; termasuk semakan registry, route, mod, integrasi runtime, sokongan reduced motion dan bank perkataan/suku kata/ilustrasi KataQuest.
- `npm run check:added-games`: lulus.
- `npm run check:release`: 0 kegagalan, 1 amaran tentang Content-Security-Policy yang belum ditetapkan.
- `npm run check:a11y:static`: 0 kegagalan dan 0 amaran. Ini pemeriksaan heuristik sahaja, bukan pengesahan WCAG penuh.
- `node test-game-session.mjs`: lulus.
- Cubaan binaan produksi tidak dapat diselesaikan dalam persekitaran kerja ini kerana `npm install` tamat masa dan Vite tidak tersedia selepas itu. Binaan produksi belum boleh ditandakan lulus.
- Ujian interaksi pelayar tidak dapat dijalankan dalam persekitaran ini kerana navigasi Chromium disekat oleh polisi persekitaran (`ERR_BLOCKED_BY_ADMINISTRATOR`). Oleh itu, lengkapkan ujian manual di atas sebelum menerbitkan.
