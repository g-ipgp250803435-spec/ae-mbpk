# ae-MBPK Peringkat 3.8 — Rekod Pelaksanaan dan Pemantauan Aktiviti Susulan

## Apa yang ditambah
- Simpan pelan yang dijana di Peringkat 3.7 ke jadual `public.followup_plans`.
- Simpan fokus, jenis sokongan, aktiviti dan langkah cadangan, serta pemerhatian guru yang dimasukkan secara sengaja.
- Paparan rekod pelan dalam Portal Guru.
- Status: Dirancang, Sedang dilaksanakan, Selesai, Perlu disemak.
- Tarikh pelaksanaan, refleksi guru dan langkah seterusnya.
- Kemas kini dan padam rekod dengan pengesahan.
- RLS mengehadkan semua operasi kepada guru pencipta rekod dan murid dalam kelas milik guru tersebut.
- Tiada kunci service-role pada klien; menggunakan sesi Supabase guru.

## Pemasangan
1. Sandarkan projek Peringkat 3.7 dan pangkalan data.
2. Ekstrak ZIP dan gabungkan kandungan `ae-mbpk-phase3-8` ke projek Vite.
3. Kekalkan `.env.local`.
4. Buka Supabase SQL Editor dan jalankan sekali `supabase/migrations/202610210007_followup_plans.sql`.
5. Jalankan `npm install`, `npm run dev`, kemudian `npm run build`.
6. Log masuk Portal Guru, pilih kelas, jana pelan, kemudian tekan “Simpan pelan ke rekod guru”.
7. Semak rekod di “Rekod pelaksanaan dan refleksi”; kemas kini status/refleksi dan cuba muat semula halaman.

## Skema dan privasi
- Pemerhatian, refleksi dan langkah seterusnya disimpan dalam pangkalan data apabila guru menekan butang simpan/kemas kini. Jangan masukkan diagnosis, laporan klinikal atau maklumat sensitif yang tidak perlu.
- Gunakan nama samaran profil murid jika sesuai dengan dasar institusi.
- RLS mengesahkan `created_by = auth.uid()` dan hubungan murid -> kelas -> pemilik guru untuk SELECT/INSERT/UPDATE/DELETE.
- Penghapusan profil murid memadam rekod pelan berkaitan melalui `ON DELETE CASCADE`.
- Jangan tambah polisi luas untuk semua pengguna `authenticated`; jangan dedahkan service-role key kepada pelayar.
- Pelan tersimpan ialah rekod perancangan guru, bukan bukti keberkesanan intervensi.

## Ujian sintaks/kontrak yang dijalankan
- Semakan sintaks modul JavaScript dan skrip sebaris HTML.
- Ujian unit kontrak sesi permainan sedia ada.
- Semakan rujukan fungsi UI simpan/muat/kemas kini/padam.
- Migrasi SQL dan operasi Supabase sebenar belum dapat diuji dalam pangkalan data pengguna.

## Ujian manual wajib
- Jalankan migrasi dan sahkan jadual diwujudkan.
- Simpan pelan baharu; pastikan rekod muncul selepas refresh.
- Ubah status, tarikh, refleksi dan langkah seterusnya; pastikan perubahan kekal.
- Padam rekod dan sahkan dialog pengesahan dipaparkan.
- Cuba simpan tanpa pelan dijana dan tanpa kelas dipilih.
- Log masuk akaun guru kedua; pastikan rekod guru pertama tidak kelihatan/ boleh diubah.
- Uji kelas kosong, profil murid tanpa sesi permainan, dan pelan dengan data sesi.
- Uji paparan telefon dan papan kekunci.
