# ae-MBPK Peringkat 3 — Pusat Gamifikasi Modular

## Tujuan
Mengembangkan ae-MBPK menjadi pusat permainan dan pembelajaran dengan katalog modular. Pakej ini bermula dengan integrasi pusat bagi permainan sedia ada dan dua modul interaktif yang berfungsi.

## Modul yang boleh dicuba
- `misi-berdikari.html`: permainan sedia ada; pautan katalog kini membukanya secara langsung.
- `braille.html`: pengenalan sel Braille enam titik bagi huruf a-j dan latihan padanan. Ini aktiviti pengenalan, bukan kurikulum Braille lengkap.
- `communication-board.html`: papan komunikasi visual dengan pilihan mesej, gabungan frasa, fungsi suara pelayar dan salin teks. Pilihan diproses secara setempat dan tidak dihantar ke Supabase.

## Modul katalog lain
KataQuest, NomborNinja, Dunia Emosi, Langkah Demi Langkah dan Tangan Berbicara (BIM) masih berstatus perancangan dalam katalog. Jangan anggap ia sudah lengkap. Kandungan BIM perlu disemak oleh pengajar BIM yang kompeten sebelum diterbitkan.

## Pemasangan
1. Sandarkan projek sedia ada.
2. Ekstrak ZIP ini dan gabungkan kandungannya ke folder projek Vite anda.
3. Kekalkan `.env.local`; jangan commit ke GitHub.
4. Jalankan:
   ```bat
   npm install
   npm run dev
   ```
5. Buka pusat ae-MBPK di `http://localhost:5173/`.
6. Dalam katalog, cuba Misi Berdikari, Peneroka Braille dan Papan Komunikasi Saya.
7. Semak paparan mudah alih dan tema gelap pada setiap modul.
8. Selepas ujian setempat, push ke GitHub dan uji deployment Vercel.

## Seni bina semasa dan hala tuju
- `index.html`: pusat/katalog aplikasi induk.
- `account.html` dan `src/account.js`: Portal Guru dan pengurusan kelas.
- `src/analytics.js`: dashboard analitik.
- `misi-berdikari.html` dan `src/misi-berdikari-sync.js`: permainan dan penyegerakan rekod.
- `braille.html`: modul latihan Braille setempat.
- `communication-board.html`: modul komunikasi visual setempat.
- `supabase/`: migrasi pangkalan data dan polisi akses.

Langkah seterusnya yang disyorkan ialah menukar katalog statik kepada `src/game-registry.js` yang ditaip/berstruktur, kemudian tambah kontrak integrasi sesi yang seragam bagi semua permainan. Elakkan menghubungkan modul setempat kepada rekod murid sehingga kawalan identiti, persetujuan dan polisi data modul tersebut dirancang.

## Ujian yang telah dijalankan
- Semakan sintaks JavaScript inline dan fail projek.
- Semakan struktur fail dan kandungan manifest permainan.
- Semakan manual pelaksanaan belum dijalankan dalam pelayar sebenar atau pada Vercel oleh alat ini.

## Batasan
- Modul Braille mengajar hanya huruf a-j dalam sistem sel enam titik; simbol visual tidak menggantikan bahan Braille taktil.
- Papan komunikasi ini ialah prototaip pilihan visual, bukan sistem AAC yang diperibadikan.
- Suara bergantung pada sokongan Web Speech API dan suara yang dipasang pada peranti.
- Katalog mempunyai modul berstatus perancangan; jangan gambarkan semua sebagai permainan siap.
- Belum ada akaun murid khusus atau penyegerakan tetapan aksesibiliti murid merentas peranti.
- Kandungan untuk autisme, ADHD, disleksia, Sindrom Down atau kategori lain tidak patut menganggap keperluan semua individu sama.
