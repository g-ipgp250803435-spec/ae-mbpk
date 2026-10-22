# ae-MBPK Peringkat 3.2 — Integrasi permainan dengan Portal Guru

## Perubahan
- Portal Guru kini menyediakan pintasan untuk Misi Berdikari, Peneroka Braille dan Papan Komunikasi bagi profil murid terpilih.
- Peneroka Braille kini mempunyai sesi latihan lima soalan yang jelas, kemajuan sesi, butang penamat yang disengajakan dan ringkasan hasil.
- Jika permainan dibuka melalui Portal Guru dengan `studentId`, modul menyemak sesi log masuk dan membaca profil melalui Supabase RLS sebelum membenarkan penyegerakan.
- Rekod hanya dihantar selepas pengguna menekan “Tamatkan latihan”. `client_session_id` digunakan oleh kontrak bersama untuk mengelakkan rekod pendua.
- Papan Komunikasi tidak merekod mesej pilihan atau kandungan komunikasi ke rekod pembelajaran; ini disengajakan untuk mengurangkan risiko privasi.

## Pemasangan
1. Sandarkan projek dan pangkalan data.
2. Gabungkan kandungan folder `ae-mbpk-phase3-2` ke projek Vite.
3. Kekalkan `.env.local`.
4. Jalankan `npm install`, `npm run dev`, dan `npm run build`.
5. Log masuk ke Portal Guru, buka kelas dan profil demo, kemudian cuba pintasan permainan.
6. Untuk ujian rekod Braille: mulakan latihan, jawab lima soalan dan tekan “Tamatkan latihan”. Semak rekod dalam dashboard/SQL menggunakan akaun guru yang sama.
7. Uji akses guru kedua: pautan yang mengandungi ID murid milik guru lain tidak boleh membenarkan rekod kerana akses profil dan sesi dikawal oleh RLS.

## Kontrak rekod
Peneroka Braille menggunakan `createGameSession` dan `syncCompletedGameSession` daripada `src/game-session.js`. Ia merekod:
- `game_slug = peneroka-braille`
- `skill_code = braille-cell-recognition`
- `attempts`, `hints_used`, `duration_seconds`, `score` (0–100 untuk lima soalan sahaja)
- `result_summary` yang mengandungi versi kontrak, bilangan betul, tugasan dan tahap.

Skor sesi ialah gambaran prestasi dalam lima soalan, bukan diagnosis, tahap kebolehan tetap atau bukti penguasaan. Jangan membandingkan skor murid secara mentah tanpa konteks pengajaran dan peluang latihan.

## Ujian dijalankan oleh alat pembangunan
- Semakan sintaks JavaScript Portal Guru dan modul Braille.
- Semakan struktur lima soalan, kawalan selesai, dan pemanggilan kontrak sesi.
- Ujian unit kontrak sesi yang diwarisi daripada Peringkat 3.1.

## Belum disahkan
- Binaan `npm run build` di komputer pengguna.
- Ujian interaksi pelayar sebenar dan layout telefon.
- Penyegerakan langsung ke Supabase, RLS dan paparan rekod dalam dashboard.
- Papan Komunikasi tidak menghantar data ke pangkalan data, mengikut reka bentuk privasi.
- Misi Berdikari masih menggunakan adapter penyegerakan asal dan belum dipindahkan ke kontrak v1.
