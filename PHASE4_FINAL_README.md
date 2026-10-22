# ae-MBPK Peringkat 4 — Finalisasi Kualiti dan Persediaan Penerbitan

## Kandungan akhir
- Multi-page Vite production build untuk enam halaman HTML.
- Header keselamatan asas di `vercel.json`.
- `npm run check:release`: semakan statik konfigurasi pelepasan.
- `npm run check:a11y:static`: heuristic scan untuk duplicate IDs, nama butang, label input dan alt gambar.
- GitHub Actions workflow di `.github/workflows/quality.yml` menjalankan static checks, unit test dan build pada push/PR ke `main` atau `master`.
- Audit konfigurasi RLS baca-sahaja di `supabase/tests/202610210008_security_audit_readonly.sql`.
- Runbook ujian manual dan pelepasan.

## Jalankan semua semakan setempat
Dari folder projek:
```bat
npm install
npm run check:release
npm run check:a11y:static
node test-game-session.mjs
npm run build
npm run preview
```
Static accessibility scan boleh menghasilkan amaran. Semak setiap amaran secara manual; ia heuristic, bukan pengesahan WCAG.

## Penerbitan GitHub dan Vercel
1. Pastikan `.env.local` diabaikan Git: `git check-ignore -v .env.local`.
2. Jangan commit service-role/secret key. Publishable key dalam klien hanya boleh digunakan bersama RLS yang betul.
3. Commit perubahan dan push ke branch yang dihubungkan ke Vercel.
4. Pastikan `VITE_SUPABASE_URL` dan `VITE_SUPABASE_PUBLISHABLE_KEY` ditetapkan dalam Vercel Production dan Preview yang diperlukan.
5. Pastikan Supabase Auth URL configuration mengandungi URL produksi dan redirect callback yang betul.
6. Semak log build Vercel, buka keenam-enam halaman, dan periksa DevTools Console/Network.
7. Sahkan header keselamatan benar-benar diterima daripada domain deployment.
8. Jalankan ujian pengasingan data menggunakan dua akaun demo berasingan.

## Kriteria "selesai" Peringkat 4
Peringkat 4 hanya boleh ditandakan selesai selepas perkara berikut benar-benar dilaksanakan:
- [ ] `npm run check:release` lulus.
- [ ] `npm run check:a11y:static` selesai dan semua amaran telah disemak.
- [ ] `node test-game-session.mjs` lulus.
- [ ] `npm run build` lulus dan keenam-enam HTML ada dalam `dist`.
- [ ] `npm run preview` telah digunakan untuk menguji semua halaman.
- [ ] Ujian log masuk/keluar, sesi tamat dan aliran ralat selesai.
- [ ] Guru A/B tidak dapat melihat atau mengubah data masing-masing melalui UI dan API.
- [ ] RLS untuk `students`, `game_sessions`, `student_accessibility_preferences`, `followup_plans` telah diperiksa.
- [ ] Tiada rahsia dalam Git history atau bundle klien.
- [ ] Ujian keyboard, zoom 200%, reduced motion, kontras, pembaca skrin dan telefon telah dibuat.
- [ ] Vercel production build dan domain sebenar telah diuji.
- [ ] Notis privasi, persetujuan institusi/penjaga, proses pemadaman dan respons insiden ditetapkan sebelum ujian MBPK sebenar.

## Had
- CI workflow baru boleh dijalankan GitHub Actions selepas push; ia belum dijalankan pada repositori pengguna.
- Pakej ini tidak boleh mengesahkan konfigurasi sebenar Supabase/Vercel tanpa akses kepada projek tersebut.
- Audit SQL memeriksa metadata, bukan membuktikan semua polisi RLS selamat.
- Static accessibility scan tidak mengesahkan pematuhan WCAG.
- Jangan mendakwa aplikasi 100% selamat, WCAG-compliant atau terbukti berkesan hanya berdasarkan semakan ini.
