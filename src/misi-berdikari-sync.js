import { supabase, isSupabaseConfigured } from './supabase.js';

const $ = (id) => document.getElementById(id);
const banner = $('cloud-sync-banner');
const title = $('cloud-sync-title');
const text = $('cloud-sync-message');
const retryButton = $('cloud-sync-retry');
const params = new URLSearchParams(window.location.search);
const studentId = params.get('studentId');
let activeStudent = null;
let activeUser = null;
let pendingPayload = null;
let saveBusy = false;

function showStatus(state, heading, message, canRetry = false) {
  if (!banner) return;
  banner.dataset.state = state;
  title.textContent = heading;
  text.textContent = message;
  retryButton.hidden = !canRetry;
}
function newUuidFallback() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 3 | 8)).toString(16);
  });
}
function errorMessage(error) {
  const msg = error?.message || 'Ralat tidak diketahui.';
  if (/row-level security|permission denied/i.test(msg)) return 'Akses ditolak oleh polisi keselamatan. Pastikan murid berada dalam kelas milik akaun guru ini.';
  if (/invalid api key/i.test(msg)) return 'Kunci API Supabase tidak diterima. Semak pemboleh ubah persekitaran deployment.';
  return msg;
}
async function initialise() {
  if (!isSupabaseConfigured || !supabase) {
    showStatus('error', 'Penyegerakan belum dikonfigurasi', 'Permainan masih boleh dimainkan, tetapi rekod hanya disimpan pada peranti ini.');
    return;
  }
  if (!studentId) {
    showStatus('local', 'Mod permainan setempat', 'Untuk merekod sesi ke pangkalan data, buka permainan melalui butang “Mainkan Misi Berdikari” pada profil murid dalam Portal Guru.');
    return;
  }
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !sessionData?.session?.user) {
    showStatus('error', 'Log masuk guru diperlukan', 'Sesi akaun tidak ditemui. Log masuk dalam Portal Guru pada domain yang sama, kemudian buka permainan semula.');
    return;
  }
  activeUser = sessionData.session.user;
  const { data, error } = await supabase.from('students')
    .select('id, display_name, learner_code, class_id')
    .eq('id', studentId).maybeSingle();
  if (error || !data) {
    showStatus('error', 'Profil tidak dapat disahkan', error ? errorMessage(error) : 'Profil ini tidak ditemui atau akaun anda tidak mempunyai akses. Kembali ke Portal Guru dan pilih profil milik anda.');
    return;
  }
  activeStudent = data;
  showStatus('success', 'Rekod pembelajaran disambungkan', `Sesi yang selesai akan direkodkan untuk profil samaran “${activeStudent.display_name}”. Rekod dihantar hanya apabila misi selesai.`);
}
async function saveSession(record, mission) {
  if (!activeStudent || !activeUser || !supabase) {
    return { status: 'local', message: 'Sesi disimpan pada peranti ini sahaja kerana tiada profil murid yang disambungkan.' };
  }
  if (saveBusy) return { status: 'pending', message: 'Penyegerakan sedang berjalan. Jangan mulakan misi yang sama sekali lagi dahulu.' };
  saveBusy = true;
  const clientSessionId = record.clientSessionId || newUuidFallback();
  const started = Date.parse(record.startedAt || '');
  const finished = Date.parse(record.finishedAt || new Date().toISOString());
  const durationSeconds = Number.isFinite(started) && Number.isFinite(finished)
    ? Math.max(0, Math.round((finished - started) / 1000)) : null;
  const payload = {
    client_session_id: clientSessionId,
    student_id: activeStudent.id,
    game_slug: 'misi-berdikari',
    skill_code: String(mission?.skill || 'Kemahiran pengurusan diri').slice(0, 80),
    score: null,
    attempts: Math.max(0, Number(record.attempts) || 0),
    hints_used: Math.max(0, Number(record.hints) || 0),
    duration_seconds: durationSeconds,
    result_summary: {
      mission_id: String(mission?.id || record.missionId || '').slice(0, 80),
      mission_title: String(mission?.title || record.missionTitle || '').slice(0, 120),
      steps_completed: Math.max(0, Number(record.stepsCompleted) || 0),
      total_steps: Math.max(0, Number(record.total) || Number(mission?.steps?.length) || 0),
      independent_steps: Math.max(0, Number(record.independent) || 0),
      supported_steps: Math.max(0, Number(record.supported) || 0),
      wrong_answers: Math.max(0, Number(record.wrongAnswers) || 0),
      step_records: Array.isArray(record.records) ? record.records.slice(0, 40).map(r => ({
        step: Math.max(0, Number(r.step) || 0),
        independent: Boolean(r.independent),
        hints: Math.max(0, Number(r.hints) || 0),
        attempts: Math.max(0, Number(r.attempts) || 0)
      })) : []
    },
    completed_at: record.finishedAt || new Date().toISOString(),
    created_by: activeUser.id
  };
  pendingPayload = { payload, record, mission };
  try {
    const { error } = await supabase.from('game_sessions').insert(payload);
    if (error && error.code !== '23505') throw error;
    pendingPayload = null;
    showStatus('success', 'Rekod berjaya disegerakkan', `Sesi “${payload.result_summary.mission_title}” disimpan untuk profil “${activeStudent.display_name}”.`);
    window.dispatchEvent(new CustomEvent('ae-mbpk-sync-status', { detail: { clientSessionId, status: 'synced' } }));
    return { status: 'synced', message: 'Rekod sesi berjaya disegerakkan ke akaun guru.' };
  } catch (error) {
    showStatus('error', 'Rekod belum disegerakkan', `${errorMessage(error)} Kemajuan setempat kekal; tekan “Cuba simpan semula” apabila sambungan atau konfigurasi sudah dibetulkan.`, true);
    return { status: 'error', message: 'Rekod belum berjaya disegerakkan. Kemajuan setempat kekal dan guru boleh mencuba semula.' };
  } finally {
    saveBusy = false;
  }
}
async function retrySave() {
  if (!pendingPayload || saveBusy) return;
  const { payload, record, mission } = pendingPayload;
  saveBusy = true;
  try {
    const { error } = await supabase.from('game_sessions').insert(payload);
    if (error && error.code !== '23505') throw error;
    pendingPayload = null;
    showStatus('success', 'Rekod berjaya disegerakkan', `Sesi “${payload.result_summary.mission_title}” disimpan untuk profil “${activeStudent.display_name}”.`);
    window.dispatchEvent(new CustomEvent('ae-mbpk-sync-status', { detail: { clientSessionId: payload.client_session_id, status: 'synced' } }));
  } catch (error) {
    showStatus('error', 'Rekod belum disegerakkan', `${errorMessage(error)} Cuba semula selepas menyemak sambungan dan konfigurasi.`, true);
  } finally { saveBusy = false; }
}
window.aeMbpkSaveSession = saveSession;
retryButton?.addEventListener('click', retrySave);
initialise().catch(error => showStatus('error', 'Penyegerakan gagal dimulakan', errorMessage(error)));
