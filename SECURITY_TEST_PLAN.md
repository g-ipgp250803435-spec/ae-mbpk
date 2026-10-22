# ae-MBPK Peringkat 2.4 — Pelan Ujian Keselamatan & Privasi

## Apa yang disediakan
- `supabase/migrations/202610210005_security_hardening.sql`: menguatkuasakan RLS, mengekalkan akses sesi yang sempit, dan menyekat kemas kini/pemadaman terus rekod sesi oleh klien authenticated.
- `supabase/tests/202610210005_security_audit.sql`: audit konfigurasi read-only yang memeriksa status RLS, grants dan polisi sesi. Jalankan selepas migrasi hardening.
- Fail ini bukan pengganti ujian penembusan atau audit keselamatan profesional.

## Pemasangan selamat
1. Buat sandaran/eksport pangkalan data Supabase dan pastikan anda memilih projek yang betul.
2. Pastikan migrasi `202610210001`, `202610210002` dan `202610210003` sudah berjaya dijalankan.
3. Buka Supabase SQL Editor dan jalankan `supabase/migrations/202610210005_security_hardening.sql`.
4. Jalankan `supabase/tests/202610210005_security_audit.sql`. Semak output dan pastikan blok `DO` berakhir dengan `Configuration audit passed`.
5. Uji localhost dan Vercel. Jika aplikasi anda mempunyai ciri yang mengedit atau memadam sesi permainan secara langsung, jangan gunakan migrasi ini sebelum menyemak semula reka bentuk itu.

## Ujian manual dua akaun
Gunakan dua akaun guru yang anda kawal serta profil demo sahaja.

- [ ] Guru A hanya melihat kelas, profil dan sesi Guru A.
- [ ] Guru B hanya melihat kelas, profil dan sesi Guru B.
- [ ] Dengan Guru B, cuba query terus `students` menggunakan ID profil Guru A; hasil tidak patut membocorkan rekod.
- [ ] Dengan Guru B, cuba query terus `game_sessions` menggunakan ID sesi Guru A; hasil tidak patut membocorkan rekod.
- [ ] Dengan Guru B, cuba INSERT sesi menggunakan `student_id` milik Guru A; API mesti menolak operasi.
- [ ] Dengan Guru B, cuba INSERT sesi dengan `created_by` Guru A; API mesti menolak operasi.
- [ ] Dengan Guru A, cuba UPDATE/DELETE terus pada `game_sessions`; API mesti menolak kerana keistimewaan ditarik balik.
- [ ] Lengkapkan misi sah sebagai Guru A; satu sesi tersimpan dan dashboard memaparkannya.
- [ ] Ulang penghantaran untuk `client_session_id` yang sama; tiada sesi pendua patut diwujudkan.
- [ ] Log keluar dan cuba buka URL permainan dengan `studentId` yang diteka; jangan dedahkan data profil dan jangan rekodkan sesi.
- [ ] Uji pada domain Vercel selepas redeploy.

Untuk menguji melalui browser DevTools, jangan kongsi `apikey`, Authorization headers, access token, refresh token, kata laluan atau data murid. Rekodkan hanya status HTTP, kod ralat dan mesej yang telah dibersihkan daripada maklumat sensitif.

## Privasi dan tadbir urus
- Gunakan nama samaran/kod murid untuk prototaip.
- Jangan simpan diagnosis, laporan klinikal, nombor pengenalan atau butiran keluarga dalam rekod permainan.
- Tetapkan siapa yang boleh mengakses akaun guru, bagaimana akaun diluluskan/dinyahaktifkan, tempoh simpanan data dan proses permintaan pemadaman.
- Sebelum ujian bersama murid sebenar, dapatkan kebenaran institusi/penjaga yang sesuai, persetujuan atau assent murid mengikut keupayaan, dan sediakan notis privasi yang mudah difahami.
- Jangan eksport CSV ke folder awam atau berkongsi fail yang mengandungi rekod murid melalui saluran tidak diluluskan.
- Semak sandaran dan prosedur pemulihan; jangan anggap projek Supabase menyediakan strategi pemulihan yang mencukupi tanpa menyemak pelan sebenar.

## Hasil ujian yang boleh dituntut
- Migrasi dijalankan tanpa ralat: hanya bermaksud skrip SQL berjaya dilaksanakan.
- Audit SQL lulus: hanya mengesahkan konfigurasi/grants yang diperiksa.
- Ujian dua akaun lulus: bukti untuk senario yang diuji sahaja.
- Jangan dakwa sistem "100% selamat" atau telah diaudit sepenuhnya berdasarkan ujian ini.
