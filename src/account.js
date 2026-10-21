import { supabase, isSupabaseConfigured } from './supabase.js';

const $ = (id) => document.getElementById(id);
const authStatus = $('authStatus');
const dataStatus = $('dataStatus');
let currentUser = null;
let selectedClassId = null;
let classes = [];
let students = [];

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
    classes = []; students = []; selectedClassId = null;
    renderClasses(); renderStudents();
    $('studentArea').classList.add('hidden');
    $('classCount').textContent = '0'; $('studentCount').textContent = '0';
  }
}
function friendlyError(error) {
  const msg = error?.message || 'Operasi tidak berjaya. Cuba lagi.';
  if (/Invalid login credentials/i.test(msg)) return 'E-mel atau kata laluan tidak tepat.';
  if (/Email not confirmed/i.test(msg)) return 'Sahkan e-mel melalui pautan yang dihantar sebelum log masuk.';
  if (/row-level security|permission denied/i.test(msg)) return 'Akses ditolak oleh polisi keselamatan. Semak migrasi SQL dan pemilikan kelas.';
  return msg;
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
    selectedClassId = null; students = []; renderStudents();
    $('studentArea').classList.add('hidden');
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
    const row = document.createElement('div'); row.className = 'item';
    const info = document.createElement('div');
    const title = document.createElement('strong'); title.textContent = item.name;
    const small = document.createElement('small'); small.textContent = item.id === selectedClassId ? 'Kelas dipilih' : 'Pilih untuk urus profil';
    info.append(title, small);
    const button = document.createElement('button'); button.type = 'button';
    button.className = item.id === selectedClassId ? 'btn primary' : 'btn';
    button.textContent = item.id === selectedClassId ? 'Dipilih' : 'Buka';
    button.addEventListener('click', () => selectClass(item.id));
    row.append(info, button); list.append(row);
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
  students = data || [];
  $('studentCount').textContent = String(students.length);
  renderStudents();
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
    const row = document.createElement('div'); row.className = 'item';
    const info = document.createElement('div');
    const title = document.createElement('strong'); title.textContent = student.display_name;
    const small = document.createElement('small'); small.textContent = student.learner_code ? `Kod: ${student.learner_code}` : 'Profil samaran';
    info.append(title, small); row.append(info); list.append(row);
  }
}
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
  if (!name) return;
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
  if (!display_name) return;
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
    // Defer async database work to avoid doing it inside the auth callback.
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
