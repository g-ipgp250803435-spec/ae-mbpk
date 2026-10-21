# ae-MBPK — Peringkat 1

Prototaip aplikasi web responsif ae-MBPK menggunakan HTML, CSS dan JavaScript vanilla, dengan Vite sebagai alat pembangunan/pembinaan. Reka bentuk prototaip dikekalkan; tiada framework UI, CDN atau API luaran.

## Ciri dalam prototaip

- Dashboard utama ae-MBPK dan navigasi responsif.
- Ruang murid serta Teacher Studio demo.
- Katalog permainan dengan carian dan penapis.
- Pusat pembelajaran, Kenali MBPK dan koleksi ganjaran.
- Bahasa Melayu / English untuk kandungan yang disokong.
- Mod gelap, teks besar, kontras tinggi dan kurangkan gerakan.
- Profil demo setempat dan eksport CSV data demonstrasi.
- Favicon SVG setempat.

## Keperluan

- Node.js versi LTS yang disokong oleh Vite.
- Akaun GitHub.
- Akaun Vercel untuk deployment.

## Jalankan pada komputer

```bash
npm install
npm run dev
```

Buka URL localhost yang ditunjukkan dalam terminal.

## Semak build produksi secara setempat

```bash
npm run build
npm run preview
```

Vite akan menghasilkan laman statik dalam folder `dist/`.

## GitHub: muat naik projek

1. Cipta repository baharu di GitHub, contohnya `ae-mbpk`.
2. Muat turun dan ekstrak projek ini.
3. Buka terminal dalam folder projek.
4. Jalankan arahan berikut (gantikan URL dengan URL repository anda):

```bash
git init
git add .
git commit -m "Initial ae-MBPK Stage 1 prototype"
git branch -M main
git remote add origin https://github.com/USERNAME/ae-mbpk.git
git push -u origin main
```

Jika Git belum dipasang, anda juga boleh memuat naik fail melalui butang **Add file → Upload files** pada laman repository GitHub.

## Vercel: deployment melalui GitHub

1. Log masuk ke Vercel.
2. Pilih **Add New → Project**.
3. Import repository `ae-mbpk` dari GitHub.
4. Semak tetapan projek:
   - Framework Preset: **Vite**
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`
5. Tekan **Deploy**.
6. Buka URL deployment dan semak paparan pada telefon serta komputer.

Selepas integrasi, push ke branch yang disambungkan biasanya mencetuskan deployment production baharu; branch lain boleh digunakan untuk preview deployment.

## Had dan privasi prototaip

- Statistik, lencana dan rekod dalam Teacher Studio ialah data demonstrasi, bukan data murid sebenar.
- Tema, bahasa dan profil demo disimpan secara setempat dalam browser; ia tidak disegerakkan antara peranti.
- Tiada akaun sebenar, autentikasi, pangkalan data atau backend.
- Jangan masukkan maklumat sensitif atau diagnosis murid.
- Kad permainan yang bertanda dalam perancangan ialah placeholder, bukan permainan lengkap.
- Kandungan pendidikan berkaitan ketidakupayaan, BIM, Braille dan AAC perlu disemak pakar serta pengguna berkaitan sebelum penggunaan rasmi.

## Senarai semak Peringkat 1

- [ ] Jalankan `npm install` dan `npm run build`.
- [ ] Uji semua navigasi dan modal.
- [ ] Uji Bahasa Melayu / English.
- [ ] Uji mod gelap, teks besar, kontras dan gerakan.
- [ ] Uji carian/penapis permainan dan eksport CSV.
- [ ] Uji skrin kecil dan besar pada browser sebenar.
- [ ] Semak URL deployment Vercel.
- [ ] Sahkan favicon, console browser dan tiada pautan rosak.

## Nota seni bina

Peringkat 1 sengaja menggunakan HTML/CSS/JavaScript vanilla kerana prototaip yang telah disemak dikekalkan tanpa membina semula UI. Peringkat 2 boleh menambah backend (contohnya Supabase) untuk akaun guru, pengurusan kelas, pangkalan data dan penyegerakan. Semua polisi keselamatan dan akses perlu direka sebelum menyimpan data murid sebenar.
