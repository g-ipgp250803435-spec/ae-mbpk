/**
 * Shared session and optional Supabase sync for standalone learning games.
 * No learner names, raw answers or diagnoses are included in session payloads.
 */
import { createGameSession, syncCompletedGameSession } from './game-session.js';
import { supabase, isSupabaseConfigured } from './supabase.js';
import { recordGameOpened, recordGameCompleted } from './learning-center-progress.js';

export function createLearningGameRuntime({ gameId, skillCodes, studentId, statusElement }) {
  let session = null;
  let activeStudent = null;
  let activeUser = null;
  let pendingRecord = null;
  let saving = false;

  function status(message, kind = 'info') {
    if (!statusElement) return;
    statusElement.textContent = message;
    statusElement.dataset.state = kind;
    statusElement.hidden = false;
  }

  async function initialize() {
    if (!studentId) {
      status('Mod latihan setempat. Buka permainan melalui profil murid di Portal Guru untuk menyimpan rekod ke akaun guru.', 'local');
      return { connected: false };
    }
    if (!isSupabaseConfigured || !supabase) {
      status('Supabase belum dikonfigurasi. Permainan boleh dimainkan; rekod tidak dihantar ke pelayan.', 'local');
      return { connected: false };
    }
    try {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || !authData?.user) {
        status('Log masuk guru diperlukan untuk menyambungkan rekod. Permainan masih boleh dimainkan secara setempat.', 'warning');
        return { connected: false };
      }
      const { data: student, error } = await supabase.from('students')
        .select('id, display_name, class_id')
        .eq('id', studentId).maybeSingle();
      if (error || !student) {
        status('Profil murid tidak ditemui atau akaun ini tiada akses. Rekod akan kekal setempat.', 'warning');
        return { connected: false };
      }
      activeUser = authData.user;
      activeStudent = student;
      status(`Profil pembelajaran disahkan untuk “${student.display_name}”. Rekod dihantar hanya apabila sesi selesai.`, 'success');
      return { connected: true };
    } catch {
      status('Pengesahan profil tidak berjaya. Permainan masih boleh digunakan secara setempat.', 'warning');
      return { connected: false };
    }
  }

  function start(difficulty = 'asas', activeSkillCodes = skillCodes) {
    if (session && session.getSnapshot().status === 'in_progress') {
      throw new Error('Sesi permainan masih berjalan. Selesaikan atau mulakan semula sesi itu dahulu.');
    }
    pendingRecord = null;
    recordGameOpened(gameId);
    session = createGameSession({ gameId, skillCodes: activeSkillCodes, difficulty });
    return session.getSnapshot();
  }

  function recordAttempt({ skillCode, correct = false, hintUsed = false } = {}) {
    if (!session) throw new Error('Mulakan sesi sebelum merekod jawapan.');
    return session.recordAttempt({ skillCode, correct, hintUsed });
  }

  function useHint(skillCode) {
    if (!session) throw new Error('Mulakan sesi sebelum menggunakan petunjuk.');
    return session.useHint({ skillCode });
  }

  function setProgress(completed, total) {
    if (!session) return null;
    return session.setTaskProgress({ completed, total });
  }

  async function finish(score, summary = {}) {
    if (!session) throw new Error('Tiada sesi untuk ditamatkan.');
    const snapshot = session.getSnapshot();
    if (snapshot.status !== 'in_progress') return snapshot;
    const record = session.complete({ score, summary });
    // Keep a privacy-conscious summary on this device even when cloud sync is not configured.
    recordGameCompleted(record);
    if (!activeStudent || !activeUser || !supabase) {
      status('Sesi selesai. Rekod tidak dihantar kerana profil murid yang disahkan tidak disambungkan; permainan tidak menghantar data ke pelayan.', 'local');
      return record;
    }
    pendingRecord = record;
    await syncPending();
    return record;
  }

  async function syncPending() {
    if (!pendingRecord || saving || !activeStudent || !supabase) return { status: 'pending' };
    saving = true;
    status('Sesi selesai. Sedang menyimpan rekod pembelajaran…', 'info');
    try {
      const result = await syncCompletedGameSession(supabase, pendingRecord, { studentId: activeStudent.id });
      pendingRecord = null;
      status(result.status === 'already-saved' ? 'Rekod sesi ini sudah disimpan. Tiada rekod pendua ditambah.' : 'Rekod sesi berjaya disegerakkan ke akaun guru.', 'success');
      return result;
    } catch (error) {
      const message = /row-level security|permission denied/i.test(error?.message || '')
        ? 'Akses ditolak oleh polisi keselamatan. Pastikan profil murid milik kelas akaun guru ini.'
        : /log masuk|session/i.test(error?.message || '')
          ? 'Sesi log masuk guru tidak lagi sah. Log masuk semula melalui Portal Guru.'
          : 'Rekod belum berjaya disimpan. Semak sambungan dan cuba semula.';
      status(`${message} Rekod sesi ini masih tersedia untuk percubaan simpan semula.`, 'warning');
      return { status: 'error', message };
    } finally {
      saving = false;
    }
  }

  function retrySync() { return syncPending(); }
  function cancel() {
    if (session?.getSnapshot().status === 'in_progress') return session.cancel();
    return null;
  }

  return Object.freeze({ initialize, start, recordAttempt, useHint, setProgress, finish, retrySync, cancel, getSnapshot: () => session?.getSnapshot() || null, status });
}
