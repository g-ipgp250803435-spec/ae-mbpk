import './analytics.js';
import { supabase, isSupabaseConfigured } from './supabase.js';

const $ = (id) => document.getElementById(id);
const authStatus = $('authStatus');
const dataStatus = $('dataStatus');
let currentUser = null;
let selectedClassId = null;
let classes = [];
let students = [];
let gameSessions = [];
const busyIds = new Set();

function message(node, text, kind = '') {
  node.textContent = text;
  node.className = `status${kind ? ` ${kind}` : ''}`;
}
function setSignedInUI(user) {
  currentUser = user;
  $('signOutBtn').classList.toggle('hidden', !user);
  $('classForm').querySelector('button').disabled = !user;
  $('className').disabled = !user;
  $('sessionState').textContent = user ? 'Aktif' : 'Log keluar';
  if (!user) {
    classes = []; students = []; selectedClassId = null; gameSessions = [];
    renderClasses(); renderStudents(); renderSessions();
    $('studentArea').classList.add('hidden');
    $('sessionsArea').classList.add('hidden'); gameSessions = []; renderSessions();
    window.aeMbpkAnalytics?.setContext({ user: null, classId: null, students: [] });
    $('classCount').textContent = '0'; $('studentCount').textContent = '0';
  }
}
function friendlyError(error) {
  const msg = error?.message || 'Operasi tidak berjaya. Cuba lagi.';
  if (/Invalid login credentials/i.test(msg)) return 'E-mel atau kata laluan tidak tepat.';
  if (/Email not confirmed/i.test(msg)) return 'Sahkan e-mel melalui pautan yang dihantar sebelum log masuk.';
  if (/row-level security|permission denied/i.test(msg)) return 'Akses ditolak oleh polisi keselamatan. Semak polisi RLS dan pastikan anda pemilik rekod.';
  if (/cannot delete a class that still has students/i.test(msg)) return 'Kelas ini masih mempunyai profil murid. Padam profil murid terlebih dahulu jika memang perlu.';
  if (/violates check constraint/i.test(msg)) return 'Maklumat tidak memenuhi syarat panjang atau format. Semak nilai dan cuba lagi.';
  return msg;
}
function setBusy(key, isBusy) {
  if (isBusy) busyIds.add(key); else busyIds.delete(key);
}
function makeButton(label, className, onClick, ariaLabel) {
  const button = document.createElement('button');
  button.type = 'button'; button.className = className; button.textContent = label;
  if (ariaLabel) button.setAttribute('aria-label', ariaLabel);
  button.addEventListener('click', onClick);
  return button;
}
async function loadClasses() {
  if (!currentUser || !supabase) return;
  const { data, error } = await supabase.from('classes')
    .select('id, name, created_at').order('created_at', { ascending: false });
  if (error) { message(dataStatus, friendlyError(error), 'error'); return; }
  classes = data || [];
  $('classCount').textContent = String(classes.length);
  renderClasses();
  if (selectedClassId && classes.some(c => c.id === selectedClassId)) {
    await selectClass(selectedClassId);
  } else if (classes.length) {
    await selectClass(classes[0].id);
  } else {
    selectedClassId = null; students = []; gameSessions = []; renderStudents(); renderSessions();
    $('studentArea').classList.add('hidden'); $('sessionsArea').classList.add('hidden');
    $('studentCount').textContent = '0';
    message(dataStatus, 'Akaun aktif. Tambah kelas pertama anda.');
  }
}
function renderClasses() {
  const list = $('classList'); list.replaceChildren();
  if (!classes.length) {
    const p = document.createElement('p'); p.className = 'muted';
    p.textContent = currentUser ? 'Belum ada kelas. Tambah kelas untuk bermula.' : 'Log masuk untuk memuatkan kelas anda.';
    list.append(p); return;
  }
  for (const item of classes) {
    const row = document.createElement('div'); row.className = 'item student-item';
    const info = document.createElement('div'); info.className = 'item-info student-info';
    const title = document.createElement('strong'); title.textContent = item.name;
    const small = document.createElement('small'); small.textContent = item.id === selectedClassId ? 'Kelas dipilih' : 'Pilih untuk urus profil';
    info.append(title, small);
    const actions = document.createElement('div'); actions.className = 'item-actions';
    const open = makeButton(item.id === selectedClassId ? 'Dipilih' : 'Buka', item.id === selectedClassId ? 'btn primary' : 'btn', () => selectClass(item.id));
    const edit = makeButton('Edit', 'btn', () => editClass(item), `Edit kelas ${item.name}`);
    const remove = makeButton('Padam', 'btn danger', () => deleteClass(item), `Padam kelas ${item.name}`);
    actions.append(open, edit, remove); row.append(info, actions); list.append(row);
  }
}
async function selectClass(id) {
  selectedClassId = id;
  const selected = classes.find(c => c.id === id);
  $('selectedClassName').textContent = selected?.name || '';
  $('studentArea').classList.toggle('hidden', !selected);
  renderClasses();
  if (!selected || !supabase) return;
  const { data, error } = await supabase.from('students')
    .select('id, display_name, learner_code, created_at')
    .eq('class_id', id).order('created_at', { ascending: false });
  if (error) { message(dataStatus, friendlyError(error), 'error'); return; }
  // Ignore late responses if the user switched class while the request was running.
  if (selectedClassId !== id) return;
  students = data || [];
  $('studentCount').textContent = String(students.length);
  renderStudents();
  $('sessionsArea').classList.remove('hidden');
  await loadGameSessions(id);
  window.aeMbpkAnalytics?.setContext({ user: currentUser, classId: selectedClassId, students });
  message(dataStatus, `Kelas “${selected.name}” dipilih. ${students.length} profil dimuatkan.`, 'success');
}
function renderStudents() {
  const list = $('studentList'); list.replaceChildren();
  if (!students.length) {
    const p = document.createElement('p'); p.className = 'muted';
    p.textContent = selectedClassId ? 'Belum ada profil dalam kelas ini.' : 'Pilih kelas untuk melihat profil.';
    list.append(p); return;
  }
  for (const student of students) {
    const row = document.createElement('div'); row.className = 'item student-item';
    const info = document.createElement('div'); info.className = 'item-info student-info';
    const title = document.createElement('strong'); title.textContent = student.display_name;
    const small = document.createElement('small'); small.textContent = student.learner_code ? `Kod: ${student.learner_code}` : 'Profil samaran';
    info.append(title, small);
    const actions = document.createElement('div'); actions.className = 'item-actions';
    actions.append(
      makeButton('Mainkan Misi Berdikari', 'btn game', () => { window.location.href = `/misi-berdikari.html?studentId=${encodeURIComponent(student.id)}`; }, `Mainkan Misi Berdikari untuk ${student.display_name}`),
      makeButton('Mainkan KataQuest', 'btn game', () => { window.location.href = `/kataquest.html?studentId=${encodeURIComponent(student.id)}`; }, `Mainkan KataQuest untuk ${student.display_name}`),
      makeButton('Mainkan NomborNinja', 'btn game', () => { window.location.href = `/nombor-ninja.html?studentId=${encodeURIComponent(student.id)}`; }, `Mainkan NomborNinja untuk ${student.display_name}`),
      makeButton('Dunia Emosi', 'btn game', () => { window.location.href = `/dunia-emosi.html?studentId=${encodeURIComponent(student.id)}`; }, `Buka Dunia Emosi untuk ${student.display_name}`),
      makeButton('Langkah Demi Langkah', 'btn game', () => { window.location.href = `/langkah-demi-langkah.html?studentId=${encodeURIComponent(student.id)}`; }, `Buka Langkah Demi Langkah untuk ${student.display_name}`),
      makeButton('Tangan Berbicara (BIM)', 'btn game', () => { window.location.href = `/tangan-berbicara.html?studentId=${encodeURIComponent(student.id)}`; }, `Buka Tangan Berbicara untuk ${student.display_name}`),
      makeButton('Peneroka Braille', 'btn game', () => { window.location.href = `/braille.html?studentId=${encodeURIComponent(student.id)}`; }, `Buka Peneroka Braille untuk ${student.display_name}`),
      makeButton('Papan Komunikasi', 'btn', () => { window.location.href = `/communication-board.html?studentId=${encodeURIComponent(student.id)}`; }, `Buka Papan Komunikasi untuk ${student.display_name}`),
      makeButton('Tetapan Aksesibiliti', 'btn', () => { window.location.href = `/accessibility.html?studentId=${encodeURIComponent(student.id)}`; }, `Tetapan aksesibiliti untuk ${student.display_name}`),
      makeButton('Edit', 'btn', () => editStudent(student), `Edit profil ${student.display_name}`),
      makeButton('Padam', 'btn danger', () => deleteStudent(student), `Padam profil ${student.display_name}`)
    );
    row.append(info, actions); list.append(row);
  }
}
async function editClass(item) {
  if (!currentUser || !supabase || busyIds.has(`class-${item.id}`)) return;
  const proposed = window.prompt('Masukkan nama baharu untuk kelas ini:', item.name);
  if (proposed === null) return;
  const name = proposed.trim();
  if (!name) return message(dataStatus, 'Nama kelas tidak boleh kosong.', 'error');
  if (name.length > 100) return message(dataStatus, 'Nama kelas mestilah 100 aksara atau kurang.', 'error');
  if (name === item.name) return;
  setBusy(`class-${item.id}`, true);
  try {
    const { data, error } = await supabase.from('classes').update({ name })
      .eq('id', item.id).select('id, name, created_at').maybeSingle();
    if (error) throw error;
    if (!data) throw new Error('Tiada rekod dikemas kini. Sahkan bahawa anda masih mempunyai akses kepada kelas ini.');
    classes = classes.map(c => c.id === item.id ? data : c);
    $('selectedClassName').textContent = selectedClassId === item.id ? data.name : $('selectedClassName').textContent;
    renderClasses();
    message(dataStatus, `Nama kelas dikemas kini kepada “${data.name}”.`, 'success');
  } catch (error) { message(dataStatus, friendlyError(error), 'error'); }
  finally { setBusy(`class-${item.id}`, false); }
}
async function deleteClass(item) {
  if (!currentUser || !supabase || busyIds.has(`class-${item.id}`)) return;
  // A class with students is intentionally not deleted, preventing accidental cascade deletion.
  const { count, error: countError } = await supabase.from('students').select('id', { count: 'exact', head: true }).eq('class_id', item.id);
  if (countError) return message(dataStatus, friendlyError(countError), 'error');
  if ((count || 0) > 0) {
    return message(dataStatus, `Kelas “${item.name}” mempunyai ${count} profil murid. Untuk mengelakkan kehilangan data, padam profil yang berkaitan dahulu jika memang diperlukan.`, 'error');
  }
  const confirmed = window.confirm(`Padam kelas “${item.name}”? Tindakan ini tidak boleh dibuat asal.`);
  if (!confirmed) return;
  setBusy(`class-${item.id}`, true);
  try {
    const { data, error } = await supabase.from('classes').delete().eq('id', item.id).select('id');
    if (error) throw error;
    if (!data?.length) throw new Error('Kelas tidak dipadam. Rekod mungkin sudah tiada atau akses tidak dibenarkan.');
    classes = classes.filter(c => c.id !== item.id);
    if (selectedClassId === item.id) { selectedClassId = null; students = []; }
    $('classCount').textContent = String(classes.length);
    $('studentCount').textContent = String(students.length);
    renderClasses(); renderStudents();
    if (classes.length) await selectClass(classes[0].id);
    else { $('studentArea').classList.add('hidden'); message(dataStatus, `Kelas “${item.name}” dipadam. Tiada kelas lain dalam akaun ini.` , 'success'); }
    if (classes.length) message(dataStatus, `Kelas “${item.name}” dipadam.`, 'success');
  } catch (error) { message(dataStatus, friendlyError(error), 'error'); }
  finally { setBusy(`class-${item.id}`, false); }
}
async function editStudent(student) {
  if (!currentUser || !supabase || busyIds.has(`student-${student.id}`)) return;
  const proposedName = window.prompt('Nama paparan atau nama samaran murid:', student.display_name);
  if (proposedName === null) return;
  const display_name = proposedName.trim();
  if (!display_name) return message(dataStatus, 'Nama paparan tidak boleh kosong.', 'error');
  if (display_name.length > 80) return message(dataStatus, 'Nama paparan mestilah 80 aksara atau kurang.', 'error');
  const proposedCode = window.prompt('Kod dalaman pilihan (kosongkan jika tiada):', student.learner_code || '');
  if (proposedCode === null) return;
  const learner_code = proposedCode.trim() || null;
  if (learner_code && learner_code.length > 32) return message(dataStatus, 'Kod dalaman mestilah 32 aksara atau kurang.', 'error');
  if (display_name === student.display_name && learner_code === (student.learner_code || null)) return;
  setBusy(`student-${student.id}`, true);
  try {
    const { data, error } = await supabase.from('students').update({ display_name, learner_code })
      .eq('id', student.id).eq('class_id', selectedClassId)
      .select('id, display_name, learner_code, created_at').maybeSingle();
    if (error) throw error;
    if (!data) throw new Error('Profil tidak dikemas kini. Sahkan kelas yang dipilih dan akses anda.');
    students = students.map(s => s.id === student.id ? data : s);
    renderStudents();
    message(dataStatus, `Profil “${data.display_name}” berjaya dikemas kini.`, 'success');
  } catch (error) { message(dataStatus, friendlyError(error), 'error'); }
  finally { setBusy(`student-${student.id}`, false); }
}
async function deleteStudent(student) {
  if (!currentUser || !supabase || busyIds.has(`student-${student.id}`)) return;
  const confirmed = window.confirm(
    `Padam profil “${student.display_name}”?\n\nRekod sesi permainan yang berkaitan juga akan dipadam secara kekal. Tindakan ini tidak boleh dibuat asal.`
  );
  if (!confirmed) return;
  setBusy(`student-${student.id}`, true);
  try {
    const { data, error } = await supabase.from('students').delete()
      .eq('id', student.id).eq('class_id', selectedClassId).select('id');
    if (error) throw error;
    if (!data?.length) throw new Error('Profil tidak dipadam. Sahkan kelas yang dipilih dan akses anda.');
    students = students.filter(s => s.id !== student.id);
    $('studentCount').textContent = String(students.length);
    renderStudents();
    message(dataStatus, `Profil “${student.display_name}” dan rekod sesi berkaitannya telah dipadam.`, 'success');
  } catch (error) { message(dataStatus, friendlyError(error), 'error'); }
  finally { setBusy(`student-${student.id}`, false); }
}
async function loadGameSessions(classId) {
  const list = $('sessionsList');
  gameSessions = [];
  renderSessions();
  if (!supabase || !currentUser || selectedClassId !== classId) return;
  const studentIds = students.map(s => s.id);
  if (!studentIds.length) { renderSessions(); return; }
  const { data, error } = await supabase.from('game_sessions')
    .select('id, student_id, game_slug, skill_code, attempts, hints_used, duration_seconds, result_summary, completed_at, created_at, client_session_id')
    .in('student_id', studentIds).order('created_at', { ascending: false }).limit(100);
  if (error) { message(dataStatus, friendlyError(error), 'error'); return; }
  if (selectedClassId !== classId) return;
  gameSessions = data || [];
  renderSessions();
}
function renderSessions() {
  const list = $('sessionsList'); if (!list) return; list.replaceChildren();
  if (!gameSessions.length) { const p=document.createElement('p');p.className='muted';p.textContent=selectedClassId?'Belum ada sesi permainan yang disegerakkan untuk kelas ini.':'Pilih kelas untuk memuatkan rekod.';list.append(p);return; }
  for (const session of gameSessions) {
    const student = students.find(s => s.id === session.student_id);
    const row=document.createElement('div');row.className='session-row';
    const info=document.createElement('div');const title=document.createElement('strong');title.textContent=student?.display_name||'Profil murid';
    const summary=session.result_summary||{};const detail=document.createElement('small');
    const date=session.completed_at||session.created_at;
    const readableDate=date?new Date(date).toLocaleString('ms-MY'):'Tarikh tidak tersedia';
    detail.textContent=`${session.skill_code||session.game_slug} · ${summary.steps_completed??'—'}/${summary.total_steps??'—'} langkah · ${session.attempts} percubaan · ${session.hints_used} petunjuk`;
    info.append(title,detail);const meta=document.createElement('span');meta.className='session-meta';meta.textContent=readableDate;row.append(info,meta);list.append(row);
  }
}
function exportGameSessions() {
  if (!gameSessions.length) return message(dataStatus, 'Tiada rekod sesi untuk dieksport.', 'error');
  const headers=['tarikh','nama_samaran','permainan','kemahiran','langkah_selesai','jumlah_langkah','langkah_mandiri','langkah_dengan_bantuan','percubaan','petunjuk','tempoh_saat'];
  const rows=gameSessions.map(s=>{const r=s.result_summary||{};return [s.completed_at||s.created_at,students.find(x=>x.id===s.student_id)?.display_name||'',s.game_slug,s.skill_code||'',r.steps_completed??'',r.total_steps??'',r.independent_steps??'',r.supported_steps??'',s.attempts??'',s.hints_used??'',s.duration_seconds??'']});
  const csv=[headers,...rows].map(row=>row.map(v=>'"'+String(v??'').replace(/"/g,'""')+'"').join(',')).join('\r\n');
  const blob=new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8;'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='ae-mbpk-rekod-sesi.csv';document.body.append(a);a.click();a.remove();URL.revokeObjectURL(url);
}
$('exportSessionsBtn').addEventListener('click', exportGameSessions);

async function refreshSession() {
  if (!isSupabaseConfigured || !supabase) return;
  const { data, error } = await supabase.auth.getSession();
  if (error) message(authStatus, friendlyError(error), 'error');
  const user = data?.session?.user || null;
  setSignedInUI(user);
  if (user) {
    message(authStatus, `Log masuk sebagai ${user.email || 'guru'}.`, 'success');
    await loadClasses();
  } else {
    message(authStatus, 'Sesi belum disahkan. Log masuk atau daftar akaun guru.');
  }
}
$('authForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!supabase) return message(authStatus, 'Lengkapkan konfigurasi Supabase dahulu.', 'error');
  const email = $('email').value.trim();
  const password = $('password').value;
  $('signInBtn').disabled = true;
  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    setSignedInUI(data.user);
    message(authStatus, `Log masuk sebagai ${data.user.email}.`, 'success');
    await loadClasses();
  } catch (error) { message(authStatus, friendlyError(error), 'error'); }
  finally { $('signInBtn').disabled = false; }
});
$('signUpBtn').addEventListener('click', async () => {
  if (!supabase) return message(authStatus, 'Lengkapkan konfigurasi Supabase dahulu.', 'error');
  const email = $('email').value.trim();
  const password = $('password').value;
  const displayName = $('displayName').value.trim();
  if (!email || password.length < 8 || !displayName) {
    return message(authStatus, 'Isi e-mel, kata laluan sekurang-kurangnya 8 aksara dan nama paparan guru.', 'error');
  }
  $('signUpBtn').disabled = true;
  try {
    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: { data: { display_name: displayName }, emailRedirectTo: window.location.origin + '/account.html' }
    });
    if (error) throw error;
    if (data.session) {
      setSignedInUI(data.user);
      message(authStatus, 'Akaun berjaya didaftarkan dan sesi bermula.', 'success');
      await loadClasses();
    } else {
      message(authStatus, 'Permintaan pendaftaran diterima. Semak e-mel untuk pengesahan sebelum log masuk.', 'success');
    }
  } catch (error) { message(authStatus, friendlyError(error), 'error'); }
  finally { $('signUpBtn').disabled = false; }
});
$('resetBtn').addEventListener('click', async () => {
  if (!supabase) return message(authStatus, 'Lengkapkan konfigurasi Supabase dahulu.', 'error');
  const email = $('email').value.trim();
  if (!email) return message(authStatus, 'Masukkan e-mel dahulu untuk meminta pautan tetapan semula.', 'error');
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin + '/account.html'
  });
  if (error) message(authStatus, friendlyError(error), 'error');
  else message(authStatus, 'Jika akaun sepadan wujud, arahan tetapan semula akan dihantar ke e-mel itu.', 'success');
});
$('signOutBtn').addEventListener('click', async () => {
  if (!supabase) return;
  const { error } = await supabase.auth.signOut();
  if (error) message(authStatus, friendlyError(error), 'error');
  else { setSignedInUI(null); message(authStatus, 'Anda telah log keluar.'); message(dataStatus, 'Data kelas tidak dipaparkan selepas log keluar.'); }
});
$('classForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!currentUser || !supabase) return message(dataStatus, 'Log masuk sebagai guru dahulu.', 'error');
  const name = $('className').value.trim();
  if (!name) return message(dataStatus, 'Nama kelas tidak boleh kosong.', 'error');
  const button = $('classForm').querySelector('button'); button.disabled = true;
  try {
    const { data, error } = await supabase.from('classes')
      .insert({ name, teacher_id: currentUser.id }).select('id, name, created_at').single();
    if (error) throw error;
    $('className').value = '';
    classes = [data, ...classes]; selectedClassId = data.id;
    await loadClasses();
    message(dataStatus, `Kelas “${data.name}” berjaya ditambah.`, 'success');
  } catch (error) { message(dataStatus, friendlyError(error), 'error'); }
  finally { button.disabled = false; }
});
$('studentForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!currentUser || !selectedClassId || !supabase) return message(dataStatus, 'Pilih kelas dan pastikan anda log masuk.', 'error');
  const display_name = $('studentName').value.trim();
  const learner_code = $('studentCode').value.trim() || null;
  if (!display_name) return message(dataStatus, 'Nama paparan tidak boleh kosong.', 'error');
  if (display_name.length > 80 || (learner_code && learner_code.length > 32)) return message(dataStatus, 'Semak panjang nama (maksimum 80) dan kod (maksimum 32 aksara).', 'error');
  const button = $('studentForm').querySelector('button'); button.disabled = true;
  try {
    const { data, error } = await supabase.from('students')
      .insert({ class_id: selectedClassId, display_name, learner_code, created_by: currentUser.id })
      .select('id, display_name, learner_code, created_at').single();
    if (error) throw error;
    students = [data, ...students]; $('studentName').value = ''; $('studentCode').value = '';
    $('studentCount').textContent = String(students.length); renderStudents();
    message(dataStatus, 'Profil samaran berjaya ditambah.', 'success');
  } catch (error) { message(dataStatus, friendlyError(error), 'error'); }
  finally { button.disabled = false; }
});

if (isSupabaseConfigured) {
  $('configNotice').classList.add('hidden');
  message(dataStatus, 'Supabase dikonfigurasi. Menyemak sesi…');
  supabase.auth.onAuthStateChange((_event, session) => {
    queueMicrotask(() => {
      const user = session?.user || null;
      if (user?.id !== currentUser?.id) {
        setSignedInUI(user);
        if (user) loadClasses();
      }
    });
  });
  refreshSession();
} else {
  $('sessionState').textContent = 'Belum siap';
  $('classForm').querySelector('button').disabled = true;
  $('className').disabled = true;
  $('studentForm').querySelector('button').disabled = true;
}
