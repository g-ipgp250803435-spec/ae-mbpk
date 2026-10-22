# ae-MBPK Peringkat 3.3 — Profil Aksesibiliti Murid dan Tetapan Pengalaman Sejagat

## Kandungan
- `src/accessibility-profile.js`: tetapan sejagat dikongsi merentas halaman.
- `accessibility.html`: halaman penerangan dan pintu masuk kepada tetapan.
- `index.html`, `misi-berdikari.html`, `braille.html`, `communication-board.html`: skrip profil aksesibiliti diintegrasikan.
- Tetapan: saiz teks 100–150%, mod gelap, kontras tinggi, kurangkan animasi, sasaran sentuh besar, mod senyap dan kurangkan hiasan.

## Pemasangan
1. Sandarkan projek semasa.
2. Ekstrak ZIP dan gabungkan kandungan `ae-mbpk-phase3-3` ke projek Vite sedia ada.
3. Kekalkan `.env.local`.
4. Jalankan `npm install`, `npm run dev`, dan `npm run build`.
5. Buka `/accessibility.html`, ubah tetapan, kemudian buka permainan lain dalam tab/peranti pelayar yang sama untuk memeriksa sama ada pilihan setempat digunakan.

## Penyimpanan dan privasi
Tetapan disimpan dalam `localStorage` di bawah `ae-mbpk-accessibility-v1`. Tiada nama, ID murid, kelas, diagnosis atau rekod prestasi disimpan dalam objek tetapan. Tetapan tidak disegerakkan ke Supabase; ini sengaja mengelakkan pilihan aksesibiliti peribadi dikongsi tanpa kawalan dan persetujuan yang jelas.

## Perilaku sebenar
- Saiz teks: skala global 100–150%; sesetengah elemen yang menggunakan saiz piksel tetap mungkin tidak membesar sepenuhnya.
- Mod gelap: menggunakan kelas dan token CSS global; halaman dengan warna hard-coded mungkin memerlukan pelarasan manual.
- Kontras tinggi: menguatkan teks/latar/sempadan umum; perlu semakan visual manual pada semua skrin.
- Kurangkan animasi: mengurangkan animasi dan transisi CSS; tidak boleh menghentikan setiap animasi yang dibuat melalui JavaScript.
- Butang lebih besar: menambah saiz minimum kawalan utama.
- Mod senyap: menghentikan sebutan suara yang telah diintegrasikan dalam Peneroka Braille dan Papan Komunikasi; tidak menjamin mematikan audio yang dicipta oleh semua kod permainan lain.
- Kurangkan hiasan: menghapuskan bayang dan elemen hiasan yang menggunakan kelas dikenali; tidak mengesan semua hiasan secara automatik.

## Ujian pembangunan yang dijalankan
- Semakan sintaks modul aksesibiliti.
- Semakan sintaks skrip modul Braille dan skrip inline yang diubah.
- Semakan struktur bahawa halaman permainan memuatkan profil aksesibiliti.
- Ujian kontrak sesi yang diwarisi daripada Peringkat 3.1.

## Belum disahkan
- `npm run build` dalam projek pengguna.
- Semakan visual sebenar di Chrome/Edge, telefon dan tablet.
- Ujian pembaca skrin, papan kekunci dan semua keadaan kontras.
- Keserasian warna gelap pada setiap komponen halaman lama.
- Ujian pengguna bersama MBPK dan guru; tetapan ini bukan bukti pematuhan aksesibiliti menyeluruh.
