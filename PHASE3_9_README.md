# ae-MBPK Peringkat 3.9 — Laporan Kemajuan dan Evidens Pembelajaran

## Fungsi baharu
- Jana laporan HTML untuk kelas semasa atau seorang murid.
- Pilih tempoh 30 hari, 90 hari atau semua rekod yang dimuatkan.
- Ringkasan bilangan sesi, murid dengan sesi, purata skor sesi yang tersedia dan petunjuk.
- Jadual ringkasan murid, sejarah sesi permainan dan rekod pelan susulan dengan status, tarikh pelaksanaan serta refleksi.
- Fail laporan dijana dalam pelayar dan boleh dicetak / disimpan sebagai PDF menggunakan fungsi cetak pelayar.
- Nilai teks diloloskan sebelum dimasukkan ke HTML laporan untuk mengurangkan risiko HTML injection daripada teks nama/pemerhatian.
- Tiada migrasi SQL baharu; membaca data yang sudah dimuatkan dalam dashboard.

## Pemasangan
1. Sandarkan projek Peringkat 3.8.
2. Ekstrak ZIP dan gabungkan kandungan `ae-mbpk-phase3-9` ke projek Vite sedia ada.
3. Kekalkan `.env.local` dan pangkalan data sedia ada.
4. Tiada migrasi SQL baharu diperlukan.
5. Jalankan `npm install`, `npm run dev`, kemudian `npm run build`.
6. Log masuk, pilih kelas, pergi ke “Laporan kemajuan dan evidens”, pilih skop dan tempoh, kemudian tekan “Jana laporan HTML”.
7. Buka fail yang dimuat turun dan pilih “Cetak / Simpan sebagai PDF”.

## Batasan dan privasi
- Laporan hanya menggunakan rekod yang telah dimuatkan ke dashboard, termasuk had 5,000 sesi untuk analitik dan had 200 pelan susulan. Ia bukan eksport pangkalan data tanpa had.
- Tempoh penapisan menggunakan tarikh sesi atau tarikh penciptaan yang tersedia; pelan menggunakan tarikh ciptaan.
- Laporan individu memerlukan pemilihan profil murid. Laporan kelas merangkumi semua profil kelas semasa.
- Fail HTML/PDF boleh mengandungi data pendidikan. Simpan secara selamat, jangan kongsi melalui saluran awam dan gunakan nama samaran jika sesuai.
- Purata skor tidak membuktikan penguasaan dan tidak patut digunakan untuk ranking antara murid/permainan.
- Laporan ialah alat dokumentasi guru, bukan diagnosis, laporan klinikal atau bukti keberkesanan intervensi.

## Ujian kod yang dijalankan
- Semakan sintaks JavaScript dan skrip sebaris HTML.
- Ujian unit kontrak sesi permainan sedia ada.
- Semakan fungsi laporan dan kawalan UI.

## Ujian manual wajib
- Jana laporan kelas dan individu.
- Uji pilihan 30 hari, 90 hari dan semua rekod.
- Semak nama murid, sesi, skor yang hilang, pelan dan refleksi.
- Uji teks khas seperti `<script>` dalam pemerhatian/nama samaran; ia perlu muncul sebagai teks biasa dalam laporan, bukan dijalankan.
- Buka HTML dan gunakan fungsi cetak / simpan sebagai PDF.
- Semak laporan pada telefon dan desktop.
- Sahkan laporan tidak mengandungi data kelas lain apabila akaun guru kedua digunakan.
