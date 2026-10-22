# ae-MBPK Peringkat 4.1 — Audit Keselamatan dan Pengesahan Akses

## Tujuan
Peringkat ini tidak menambah polisi akses baharu secara automatik. Ia menambah audit baca-sahaja supaya konfigurasi semasa boleh diperiksa sebelum kita mengubah RLS. Mengubah polisi tanpa mengesahkan aliran aplikasi boleh mengunci guru keluar atau secara tidak sengaja meluaskan akses.

## Langkah 1 — Semak pakej dan binaan
Dalam folder projek:
```bat
npm run check:release
npm run build
```
Jika `npm run build` gagal, simpan teks ralat penuh tanpa token atau rahsia. Jangan teruskan deployment sehingga isu binaan difahami.

## Langkah 2 — Audit konfigurasi Supabase
1. Buka Supabase Dashboard untuk projek yang betul.
2. Buka SQL Editor dan cipta query baharu.
3. Salin semua kandungan `supabase/tests/202610210008_security_audit_readonly.sql`.
4. Jalankan. Skrip ini hanya membaca metadata PostgreSQL; ia tidak mengubah jadual atau data.
5. Periksa hasil pertama: jadual yang belum diwujudkan, RLS yang tidak aktif, akses `anon` atau grant tidak dijangka akan ditandakan `REVIEW`.
6. Periksa hasil kedua: baca ekspresi `USING` dan `WITH CHECK` setiap polisi. Audit metadata sahaja tidak membuktikan bahawa polisi berfungsi untuk semua laluan.

## Langkah 3 — Ujian pengasingan dua akaun (mesti guna data demo)
- Guru A boleh membaca/mengubah kelas, profil, pelan susulan dan pilihan aksesibiliti miliknya sahaja.
- Guru B tidak boleh melihat atau mengubah rekod Guru A walaupun mengetahui UUID rekod.
- Uji query langsung kepada `students`, `game_sessions`, `followup_plans` dan `student_accessibility_preferences`, bukan UI sahaja.
- Uji cubaan memasukkan rekod menggunakan `student_id` milik guru lain.
- Uji `game_sessions`: klien authenticated tidak patut boleh UPDATE/DELETE terus jika polisi hardening projek sudah digunakan.
- Uji logout, sesi tamat dan akses tanpa login.
- Jangan gunakan akaun atau data murid sebenar untuk ujian penembusan.

## Langkah 4 — Semak kebocoran rahsia
Jalankan di Command Prompt:
```bat
git status --short
git check-ignore -v .env.local
```
Pastikan `.env.local` diabaikan Git. Jangan tampal kandungan `.env.local`, access token, refresh token, password atau request Authorization ke chat. `VITE_SUPABASE_PUBLISHABLE_KEY` ialah kunci klien dan bukan pengganti RLS; service-role/secret key tidak boleh berada dalam frontend.

## Batasan
- SQL audit ini hanya mengesahkan metadata, grants dan kewujudan polisi. Ia tidak menjalankan serangan sebagai dua pengguna dan tidak membuktikan ekspresi polisi betul.
- Ujian pengasingan data mesti dibuat secara langsung menggunakan dua akaun demo yang berasingan.
- Jangan jalankan migrasi baharu atau ubah RLS semata-mata untuk menjadikan audit hijau tanpa memahami hasil `REVIEW`.
- Peringkat ini bukan audit penembusan profesional atau jaminan pematuhan undang-undang.

## Rekod keputusan
- `npm run check:release`: __________
- `npm run build`: __________
- SQL audit: __________
- Guru A/B pengasingan data: __________
- Tiada rahsia dalam Git: __________
- Isu dan tindakan: __________
