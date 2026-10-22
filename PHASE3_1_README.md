# ae-MBPK Peringkat 3.1 — Sistem Modul Permainan Bersepadu

## Apa yang berubah
1. `src/game-registry.js` ialah sumber tunggal metadata katalog. `index.html` mengimport daftar ini; jangan tambah permainan dengan menyalin metadata ke array lain.
2. `src/game-session.js` mentakrif kontrak sesi permainan v1: percubaan, petunjuk, kemajuan tugasan, penyelesaian/pembatalan dan pemetaan ke jadual Supabase sedia ada.
3. Laluan Misi Berdikari, Peneroka Braille dan Papan Komunikasi menggunakan `route` dalam daftar. Modul lain kekal `planned` dan tidak dipaparkan sebagai permainan siap.
4. Tiada migrasi SQL baharu diperlukan: pemetaan menggunakan kolum sedia ada `client_session_id`, `student_id`, `game_slug`, `skill_code`, `score`, `attempts`, `hints_used`, `duration_seconds`, `result_summary`, `completed_at`, `created_by`.

## Pemasangan
1. Sandarkan folder projek dan pangkalan data.
2. Ekstrak ZIP dan gabungkan kandungan `ae-mbpk-phase3-1` ke folder projek Vite sedia ada.
3. Kekalkan `.env.local`; jangan commit kunci atau token.
4. Jalankan `npm install` kemudian `npm run dev`.
5. Uji katalog, Misi Berdikari, Peneroka Braille dan Papan Komunikasi Saya.
6. Jalankan `npm run build`. Jika berjaya, commit dan push ke GitHub, kemudian uji Vercel.

## Menambah permainan baharu
Tambah satu objek dalam `GAME_REGISTRY` di `src/game-registry.js`:
- `id`: slug stabil, huruf kecil dan tanda sempang
- `title`, `tag`, `description`: objek `{ ms, en }`
- `category`: salah satu kategori pusat
- `status`: `live` hanya apabila modul boleh digunakan; jika belum siap gunakan `planned`
- `route`: laluan bermula dengan `/` atau `null`
- `skillCodes`: kod kemahiran ringkas dan stabil
- `accessibility`: ciri yang benar-benar dilaksanakan, bukan aspirasi
Jangan tandakan modul sebagai `live` jika pautannya tidak wujud atau kandungannya belum disemak.

## Kontrak sesi permainan
Contoh integrasi dalam modul berasaskan ES module:

```js
import { createGameSession, syncCompletedGameSession } from "/src/game-session.js";

const session = createGameSession({
  gameId: "peneroka-braille",
  skillCodes: ["braille-cell-recognition"],
  difficulty: "asas"
});

session.recordAttempt({ skillCode: "braille-cell-recognition", correct: true });
session.useHint({ skillCode: "braille-cell-recognition" });
session.setTaskProgress({ completed: 3, total: 5 });
const completedRecord = session.complete({ score: 80 });

// Hanya selepas guru disahkan log masuk dan studentId dipilih daripada
// profil yang boleh diaksesnya dalam Portal Guru:
const result = await syncCompletedGameSession(supabase, completedRecord, { studentId });
```

`createGameSession` tidak menyimpan nama, diagnosis atau teks jawapan murid. Secara lalai rekod berada dalam memori sehingga permainan memilih untuk menyegerakkannya. `syncCompletedGameSession` mendapatkan identiti guru melalui sesi Supabase semasa; RLS menentukan sama ada guru berhak merekodkan sesi bagi murid tersebut. Jangan menerima `studentId` daripada URL tanpa mengesahkan aksesnya melalui Supabase.

## Makna medan dan peraturan
- `attempts`: jumlah percubaan yang direkod oleh permainan.
- `correctAttempts`: bilangan percubaan betul; bukan ukuran penguasaan dengan sendirinya.
- `hints_used`: jumlah bantuan yang direkodkan; jangan anggap penggunaan bantuan sebagai kegagalan.
- `tasks_completed` dan `total_tasks`: kemajuan tugasan yang ditakrif oleh permainan.
- `score`: skor pilihan 0–100 sahaja jika permainan benar-benar mempunyai rubrik skor yang konsisten. Jika tiada, simpan `null`.
- `completed_at`: masa penyelesaian; sesi dibatalkan tidak boleh disegerakkan sebagai sesi selesai.
- `client_session_id`: UUID stabil untuk mengelakkan pendua apabila penghantaran diulang.

Jangan rekod kandungan sensitif, diagnosis, nama penuh, jawapan bebas atau catatan klinikal dalam `result_summary`. Sediakan penerangan kepada guru tentang makna metrik sebelum digunakan untuk keputusan pengajaran.

## Ujian yang dijalankan
- Semakan sintaks fail JavaScript pusat dan modul sesi.
- Semakan sintaks skrip inline katalog.
- Ujian unit ringkas bagi kiraan percubaan, petunjuk, penyelesaian, pemetaan rekod dan penolakan sesi tidak selesai.
- Semakan metadata: ID unik, status dan route konsisten.

## Belum disahkan
- `npm run build` dalam persekitaran projek anda.
- Ujian pelayar pada Windows/telefon sebenar.
- Penghantaran langsung ke Supabase/Vercel dan tingkah laku RLS.
- Modul sedia ada Misi Berdikari belum diubah untuk menggunakan kontrak v1 secara dalaman; ia masih menggunakan adapter penyegerakan asal. Kontrak ini tersedia untuk migrasi berperingkat supaya kita tidak memecahkan aliran yang telah lulus.
