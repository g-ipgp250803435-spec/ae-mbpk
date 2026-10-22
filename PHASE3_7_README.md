# ae-MBPK Peringkat 3.7 — Sistem Cadangan Aktiviti Susulan Diperibadikan

## Ringkasan
Peringkat ini menambah perancang aktiviti susulan pada Portal Guru. Guru memilih profil murid, fokus pemerhatian dan sokongan yang mahu dicuba. Sistem menggabungkan pilihan guru dengan rekod sesi yang tersedia untuk menghasilkan tiga cadangan aktiviti, pelarasan, perkara yang perlu diperhatikan dan cadangan sesi berikutnya.

## Fungsi
- Pemilihan profil murid dalam kelas semasa.
- Fokus: arahan, komunikasi, rutin/urutan, literasi/bahasa, penglibatan/perhatian, akses motor, berdikari atau pengukuhan umum.
- Pilihan sokongan: visual, demonstrasi, pilihan terhad, arahan lisan, bahan maujud atau latihan bersama.
- Pemerhatian guru pilihan sehingga 500 aksara.
- Cadangan aktiviti dengan tempoh anggaran, langkah dan pelarasan.
- Ringkasan rekod sesi murid: jumlah sesi, kemahiran paling kerap direkodkan, skor sesi jika tersedia dan purata petunjuk.
- Salin pelan atau muat turun sebagai TXT.
- Pemerhatian yang ditaip tidak disimpan atau dihantar ke Supabase secara automatik.
- Enjin cadangan menggunakan peraturan tetap; bukan AI dan bukan diagnosis.

## Pemasangan
1. Sandarkan projek Peringkat 3.6.
2. Ekstrak ZIP dan gabungkan kandungan `ae-mbpk-phase3-7` ke folder projek Vite.
3. Kekalkan `.env.local`, migrasi, dan konfigurasi Supabase sedia ada.
4. Tiada migrasi SQL diperlukan.
5. Jalankan `npm install`, `npm run dev`, kemudian `npm run build`.
6. Log masuk Portal Guru, pilih kelas, pilih profil murid pada panel “Cadangan aktiviti susulan diperibadikan”.

## Interpretasi dan privasi
- Cadangan ialah pilihan pedagogi untuk disemak oleh guru, bukan arahan wajib.
- Data skor/percubaan dipengaruhi reka bentuk permainan, bantuan, peranti, persekitaran dan peluang latihan; jangan gunakan untuk ranking atau label murid.
- Jangan masukkan diagnosis, laporan klinikal, nama penuh jika tidak perlu, atau butiran sensitif dalam pemerhatian.
- Pemerhatian hanya berada dalam halaman semasa; tetapi apabila pelan disalin atau dimuat turun, pengguna bertanggungjawab mengendalikan salinan mengikut dasar institusi.
- Pelan boleh dijana walaupun tiada rekod permainan; ia akan menyatakan bahawa tiada data sesi tersedia dan bermula daripada fokus guru.

## Ujian kod yang dijalankan
- Semakan sintaks modul JavaScript dan skrip sebaris HTML.
- Ujian unit kontrak sesi permainan sedia ada.
- Semakan kewujudan elemen UI dan fungsi perancang susulan.

## Ujian manual wajib
- Pilih kelas tanpa murid, kelas dengan murid tetapi tiada sesi, dan murid yang mempunyai sesi.
- Tukar profil murid, fokus, dan sokongan; jana semula dan semak hasil.
- Cuba pemerhatian kosong, pemerhatian bertulis, dan teks hampir had maksimum.
- Salin pelan dan muat turun TXT.
- Tukar kelas/log keluar dan pastikan pilihan lama tidak digunakan untuk kelas baharu.
- Pastikan data guru kedua kekal terasing melalui RLS.
- Semak paparan telefon dan navigasi papan kekunci.
- Sahkan kesesuaian aktiviti dengan guru Pendidikan Khas sebelum digunakan dengan murid.

## Belum disahkan
- Binaan Vite sebenar pada komputer pengguna dan deployment Vercel.
- Fungsi clipboard bergantung pada sokongan pelayar dan konteks keselamatan.
- Keberkesanan pedagogi belum diuji secara empirikal dengan guru/MBPK.
