/**
 * ae-MBPK Universal Accessibility Profile
 * Preferences are local by default. If a teacher opens the page from a selected
 * student profile, preferences may be loaded/saved to Supabase under RLS.
 * Only display preferences are stored; never store diagnoses or clinical notes.
 */
import { supabase, isSupabaseConfigured } from "./supabase.js";
const STORAGE_KEY = "ae-mbpk-accessibility-v1";
const DEFAULTS = Object.freeze({
  textScale: 1,
  darkMode: false,
  highContrast: false,
  reduceMotion: false,
  largeTargets: false,
  quietMode: false,
  calmView: false
});

function normalize(input = {}) {
  const scale = Number(input.textScale);
  return {
    textScale: Number.isFinite(scale) ? Math.min(1.5, Math.max(1, Math.round(scale * 100) / 100)) : DEFAULTS.textScale,
    darkMode: input.darkMode === true && input.highContrast !== true,
    highContrast: input.highContrast === true,
    reduceMotion: input.reduceMotion === true,
    largeTargets: input.largeTargets === true,
    quietMode: input.quietMode === true,
    calmView: input.calmView === true
  };
}

function readPreferences() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return normalize(raw ? JSON.parse(raw) : DEFAULTS);
  } catch {
    return { ...DEFAULTS };
  }
}

let preferences = readPreferences();
const requestedStudentId = new URLSearchParams(window.location.search).get("studentId");
let verifiedStudent = null;
let verifiedUser = null;
let profileSyncBusy = false;

function persistLocalPreferences() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences)); } catch { /* storage can be blocked */ }
}

async function verifyStudentContext() {
  if (!requestedStudentId || !isSupabaseConfigured || !supabase) return;
  try {
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData?.user) return;
    const { data: student, error } = await supabase
      .from("students").select("id,display_name").eq("id", requestedStudentId).maybeSingle();
    if (error || !student) return;
    verifiedStudent = student;
    verifiedUser = authData.user;
    const { data: row, error: preferenceError } = await supabase
      .from("student_accessibility_preferences")
      .select("preferences,updated_at")
      .eq("student_id", student.id).maybeSingle();
    if (preferenceError) {
      setProfileStatus("Profil murid disahkan, tetapi tetapan tersimpan tidak dapat dimuatkan. Jalankan migrasi Peringkat 3.4 dan semak RLS.");
      return;
    }
    if (row?.preferences) {
      preferences = normalize(row.preferences);
      persistLocalPreferences();
      applyPreferences();
      syncWidgetControls();
      setProfileStatus(`Tetapan aksesibiliti dimuatkan untuk profil ${student.display_name}.`);
    } else {
      setProfileStatus(`Profil ${student.display_name} disahkan. Tetapan semasa masih setempat sehingga anda memilih Simpan untuk profil.`);
    }
    setProfileActionsVisible(true);
  } catch {
    setProfileStatus("Pengesahan profil tidak berjaya. Tetapan kekal setempat pada peranti ini.");
  }
}

function setProfileStatus(text) {
  const node = document.getElementById("ae-a11y-status");
  if (node) node.textContent = text;
}

function setProfileActionsVisible(visible) {
  const actions = document.getElementById("ae-profile-actions");
  if (actions) actions.hidden = !visible;
}

function syncWidgetControls() {
  const scale = document.getElementById("ae-scale");
  if (!scale) return;
  scale.value = preferences.textScale;
  document.getElementById("ae-scale-value").value = `${Math.round(preferences.textScale * 100)}%`;
  document.getElementById("ae-dark").checked = preferences.darkMode;
  document.getElementById("ae-contrast").checked = preferences.highContrast;
  document.getElementById("ae-motion").checked = preferences.reduceMotion;
  document.getElementById("ae-targets").checked = preferences.largeTargets;
  document.getElementById("ae-quiet").checked = preferences.quietMode;
  document.getElementById("ae-calm").checked = preferences.calmView;
}

async function savePreferencesToStudent() {
  if (profileSyncBusy) return;
  if (!verifiedStudent || !verifiedUser || !supabase) {
    setProfileStatus("Simpan profil memerlukan guru log masuk dan profil murid yang berjaya disahkan melalui Portal Guru.");
    return;
  }
  profileSyncBusy = true;
  const button = document.getElementById("ae-profile-save");
  if (button) button.disabled = true;
  try {
    const payload = {
      student_id: verifiedStudent.id,
      preferences: normalize(preferences),
      updated_by: verifiedUser.id,
      updated_at: new Date().toISOString()
    };
    const { error } = await supabase
      .from("student_accessibility_preferences")
      .upsert(payload, { onConflict: "student_id" });
    if (error) throw error;
    setProfileStatus(`Tetapan berjaya disimpan untuk profil ${verifiedStudent.display_name}. Tetapan ini boleh dimuatkan apabila profil yang sama dibuka pada peranti lain oleh guru yang mempunyai akses.`);
  } catch (error) {
    const msg = /row-level security|permission denied/i.test(error?.message || "")
      ? "Akses ditolak oleh RLS. Pastikan migrasi 3.4 telah dijalankan dan profil ini milik kelas anda."
      : "Tetapan tidak berjaya disimpan. Semak migrasi pangkalan data, sambungan dan polisi RLS.";
    setProfileStatus(msg);
  } finally {
    profileSyncBusy = false;
    if (button) button.disabled = false;
  }
}

function applyPreferences() {
  const root = document.documentElement;
  const body = document.body;
  root.style.setProperty("--ae-text-scale", String(preferences.textScale));
  root.style.setProperty("--scale", String(preferences.textScale));
  root.style.fontSize = `${preferences.textScale * 100}%`;
  root.classList.toggle("ae-a11y-dark", preferences.darkMode);
  root.classList.toggle("ae-a11y-contrast", preferences.highContrast);
  root.classList.toggle("ae-a11y-motion", preferences.reduceMotion);
  root.classList.toggle("ae-a11y-large-targets", preferences.largeTargets);
  root.classList.toggle("ae-a11y-quiet", preferences.quietMode);
  root.classList.toggle("ae-a11y-calm", preferences.calmView);
  if (body) {
    body.classList.toggle("ae-a11y-dark", preferences.darkMode);
    body.classList.toggle("ae-a11y-contrast", preferences.highContrast);
    body.classList.toggle("ae-a11y-motion", preferences.reduceMotion);
    body.classList.toggle("ae-a11y-large-targets", preferences.largeTargets);
    body.classList.toggle("ae-a11y-quiet", preferences.quietMode);
    body.classList.toggle("ae-a11y-calm", preferences.calmView);
  }
  document.dispatchEvent(new CustomEvent("ae-mbpk-accessibility-change", {
    detail: { ...preferences }
  }));
  // Native media respects quiet mode. Game modules with Web Audio listen to the same event.
  document.querySelectorAll("audio, video").forEach(media => {
    if (preferences.quietMode) {
      if (!media.paused) media.pause();
      media.muted = true;
    } else {
      media.muted = false;
    }
  });
}

const style = document.createElement("style");
style.textContent = `
 :root { --ae-text-scale: 1; }
html { scroll-behavior: auto; }
button, [role="button"], input, select, textarea, a { -webkit-tap-highlight-color: transparent; }
:focus-visible { outline: 3px solid #e7a52b !important; outline-offset: 3px !important; }
html.ae-a11y-motion *, body.ae-a11y-motion *,
html.ae-a11y-motion *::before, body.ae-a11y-motion *::before,
html.ae-a11y-motion *::after, body.ae-a11y-motion *::after {
  animation-duration: .001ms !important; animation-iteration-count: 1 !important;
  transition-duration: .001ms !important; scroll-behavior: auto !important;
}
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: .001ms !important; animation-iteration-count: 1 !important; transition-duration: .001ms !important; scroll-behavior: auto !important; }
}
html.ae-a11y-large-targets button, html.ae-a11y-large-targets [role="button"],
html.ae-a11y-large-targets input, html.ae-a11y-large-targets select,
html.ae-a11y-large-targets textarea, html.ae-a11y-large-targets a.button {
  min-height: 46px !important; min-width: 44px;
}
html.ae-a11y-contrast, body.ae-a11y-contrast {
  --muted: #293548 !important; --line: #34445a !important;
  --bg: #fff !important; --surface: #fff !important; --surface2: #fff !important;
  --text: #000 !important; --ink: #000 !important;
  color: #000 !important; background: #fff !important;
}
html.ae-a11y-contrast body *, body.ae-a11y-contrast * {
  text-shadow: none !important;
}
html.ae-a11y-contrast button, html.ae-a11y-contrast a,
body.ae-a11y-contrast button, body.ae-a11y-contrast a {
  outline-color: #000 !important; text-decoration-thickness: 2px;
}
html.ae-a11y-dark, body.ae-a11y-dark {
  color-scheme: dark !important; background: #101522 !important; color: #f4f7ff !important;
  --bg: #101522 !important; --surface: #182235 !important; --surface2: #202d43 !important;
  --paper: #182235 !important; --text: #f4f7ff !important; --ink: #f4f7ff !important;
  --muted: #c0ccdf !important; --line: #3c4c65 !important; --shadow: 0 12px 32px #0005 !important;
}
html.ae-a11y-dark body header, html.ae-a11y-dark body nav, html.ae-a11y-dark body aside,
html.ae-a11y-dark body main, html.ae-a11y-dark body section, html.ae-a11y-dark body article,
html.ae-a11y-dark body .panel, html.ae-a11y-dark body .card, html.ae-a11y-dark body .topbar,
html.ae-a11y-dark body .sidebar, html.ae-a11y-dark body .content,
body.ae-a11y-dark header, body.ae-a11y-dark nav, body.ae-a11y-dark aside,
body.ae-a11y-dark main, body.ae-a11y-dark section, body.ae-a11y-dark article,
body.ae-a11y-dark .panel, body.ae-a11y-dark .card, body.ae-a11y-dark .topbar,
body.ae-a11y-dark .sidebar, body.ae-a11y-dark .content {
  background-color: #182235 !important; color: #f4f7ff !important; border-color: #3c4c65 !important;
}
html.ae-a11y-dark body p, html.ae-a11y-dark body label, html.ae-a11y-dark body small,
html.ae-a11y-dark body li, html.ae-a11y-dark body h1, html.ae-a11y-dark body h2,
html.ae-a11y-dark body h3, body.ae-a11y-dark p, body.ae-a11y-dark label,
body.ae-a11y-dark small, body.ae-a11y-dark li, body.ae-a11y-dark h1,
body.ae-a11y-dark h2, body.ae-a11y-dark h3 { color: inherit; }
html.ae-a11y-calm *, body.ae-a11y-calm * { box-shadow: none !important; }
html.ae-a11y-calm .decorative, html.ae-a11y-calm .sparkle,
html.ae-a11y-calm .particle, body.ae-a11y-calm .decorative,
body.ae-a11y-calm .sparkle, body.ae-a11y-calm .particle { display: none !important; }
#ae-a11y-launcher {
  display: none !important; /* Floating launcher removed; open settings from the in-app control. */
  position: fixed; right: 16px; bottom: 16px; z-index: 99990;
  border: 1px solid #d7e2f0; border-radius: 999px; padding: 11px 16px;
  color: #fff; background: linear-gradient(135deg,#087f68,#6b55d8);
  font: 700 14px/1.2 system-ui,sans-serif; box-shadow: 0 8px 24px #0d1a2d30;
  cursor: pointer; min-height: 46px;
}
#ae-a11y-launcher:focus-visible, #ae-a11y-dialog button:focus-visible,
#ae-a11y-dialog input:focus-visible { outline: 3px solid #f0b94d; outline-offset: 3px; }
#ae-a11y-overlay {
  position: fixed; inset: 0; z-index: 99991; background: #07101dcc;
  display: grid; place-items: center; padding: 16px;
}
#ae-a11y-overlay[hidden] { display: none; }
#ae-a11y-dialog {
  width: min(620px,100%); max-height: min(88vh,800px); overflow: auto;
  border: 1px solid #d9e2ef; border-radius: 22px; background: #fff; color: #172338;
  box-shadow: 0 28px 90px #0005; padding: clamp(18px,4vw,28px);
  font: 16px/1.5 system-ui,-apple-system,"Segoe UI",sans-serif;
}
#ae-a11y-dialog h2 { margin: 0 0 5px; font-size: 1.5rem; }
#ae-a11y-dialog .ae-muted { color: #53627a; margin: 0 0 18px; }
#ae-a11y-dialog .ae-setting-list { display: grid; gap: 10px; }
#ae-a11y-dialog .ae-setting {
  display: flex; align-items: center; justify-content: space-between; gap: 14px;
  padding: 12px; border: 1px solid #dce4ef; border-radius: 13px;
}
#ae-a11y-dialog .ae-setting strong { display: block; }
#ae-a11y-dialog .ae-setting small { display: block; color: #53627a; }
#ae-a11y-dialog input[type="checkbox"] { width: 23px; height: 23px; flex: 0 0 auto; accent-color: #087f68; }
#ae-a11y-dialog input[type="range"] { width: min(210px,42vw); accent-color: #087f68; }
#ae-a11y-dialog .ae-actions { display:flex; flex-wrap:wrap; gap:8px; margin-top:18px; }
#ae-a11y-dialog button {
  border: 1px solid #cbd7e6; border-radius: 11px; padding: 10px 14px;
  background: #f4f7fb; color: #172338; cursor: pointer; min-height: 44px;
}
#ae-a11y-dialog button.ae-primary { background: #087f68; border-color: #087f68; color: #fff; font-weight: 700; }
#ae-a11y-dialog .ae-scale { display:flex; align-items:center; gap:12px; }
html.ae-a11y-dark #ae-a11y-dialog { background:#182235; color:#f4f7ff; border-color:#3c4c65; }
html.ae-a11y-dark #ae-a11y-dialog .ae-setting { border-color:#3c4c65; }
html.ae-a11y-dark #ae-a11y-dialog .ae-muted, html.ae-a11y-dark #ae-a11y-dialog small { color:#c0ccdf; }
html.ae-a11y-dark #ae-a11y-dialog button { background:#202d43; color:#f4f7ff; border-color:#50617c; }
html.ae-a11y-contrast #ae-a11y-dialog { background:#fff; color:#000; border:2px solid #000; }
@media(max-width:480px) {
  #ae-a11y-launcher { right: 10px; bottom: 10px; }
  #ae-a11y-dialog .ae-setting { align-items: flex-start; }
}
`;
document.head.append(style);

function renderWidget() {
  let launcher = document.getElementById("ae-a11y-launcher");
  if (!launcher) {
    launcher = document.createElement("button");
    launcher.id = "ae-a11y-launcher";
    launcher.type = "button";
    launcher.textContent = "Aksesibiliti";
    launcher.setAttribute("aria-haspopup", "dialog");
    document.body.append(launcher);
  }

  let overlay = document.getElementById("ae-a11y-overlay");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = "ae-a11y-overlay";
    overlay.hidden = true;
    overlay.innerHTML = `
      <section id="ae-a11y-dialog" role="dialog" aria-modal="true" aria-labelledby="ae-a11y-title" tabindex="-1">
        <h2 id="ae-a11y-title">Tetapan pengalaman</h2>
        <p class="ae-muted">Sesuaikan paparan mengikut keperluan anda. Tetapan disimpan pada peranti ini sahaja.</p>
        <div class="ae-setting-list">
          <div class="ae-setting"><div><strong>Saiz teks</strong><small>Laraskan teks antara 100% hingga 150%.</small></div><div class="ae-scale"><input id="ae-scale" type="range" min="1" max="1.5" step=".05" aria-label="Saiz teks"><output id="ae-scale-value">100%</output></div></div>
          <label class="ae-setting" for="ae-dark"><span><strong>Mod gelap</strong><small>Gunakan latar gelap dan teks cerah.</small></span><input id="ae-dark" type="checkbox"></label>
          <label class="ae-setting" for="ae-contrast"><span><strong>Kontras tinggi</strong><small>Utamakan teks dan sempadan yang jelas.</small></span><input id="ae-contrast" type="checkbox"></label>
          <label class="ae-setting" for="ae-motion"><span><strong>Kurangkan animasi</strong><small>Kurangkan gerakan dan peralihan visual.</small></span><input id="ae-motion" type="checkbox"></label>
          <label class="ae-setting" for="ae-targets"><span><strong>Butang lebih besar</strong><small>Tambah saiz sasaran sentuh untuk kawalan utama.</small></span><input id="ae-targets" type="checkbox"></label>
          <label class="ae-setting" for="ae-quiet"><span><strong>Mod senyap</strong><small>Matikan sebutan suara dalam modul yang menyokong tetapan ini.</small></span><input id="ae-quiet" type="checkbox"></label>
          <label class="ae-setting" for="ae-calm"><span><strong>Kurangkan hiasan</strong><small>Kurangkan bayang dan elemen hiasan yang dikenal pasti.</small></span><input id="ae-calm" type="checkbox"></label>
        </div>
        <p id="ae-a11y-status" class="ae-muted" role="status" aria-live="polite">Tetapan belum diubah.</p>
        <div id="ae-profile-actions" class="ae-actions" hidden><button type="button" class="ae-primary" id="ae-profile-save">Simpan untuk profil murid</button></div>
        <div class="ae-actions"><button type="button" class="ae-primary" id="ae-close">Selesai</button><button type="button" id="ae-reset">Pulihkan tetapan asal</button></div>
      </section>`;
    document.body.append(overlay);
  }

  const dialog = document.getElementById("ae-a11y-dialog");
  let previouslyFocused = null;
  const close = () => {
    overlay.hidden = true;
    if (previouslyFocused && previouslyFocused.isConnected) previouslyFocused.focus();
  };
  const open = () => {
    previouslyFocused = document.activeElement;
    overlay.hidden = false;
    syncControls();
    dialog.focus();
  };
  const syncControls = () => syncWidgetControls();
  const update = (patch) => {
    preferences = normalize({ ...preferences, ...patch });
    persistLocalPreferences();
    applyPreferences();
    syncControls();
    document.getElementById("ae-a11y-status").textContent = "Tetapan digunakan. Anda boleh mengubahnya pada bila-bila masa.";
  };

  launcher.addEventListener("click", open);
  document.getElementById("access-toggle")?.addEventListener("click", event => {
    event.preventDefault();
    event.stopImmediatePropagation();
    open();
  }, true);
  document.getElementById("ae-profile-save").addEventListener("click", savePreferencesToStudent);
  document.getElementById("ae-close").addEventListener("click", close);
  document.getElementById("ae-reset").addEventListener("click", () => {
    preferences = { ...DEFAULTS };
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
    applyPreferences();
    syncControls();
    document.getElementById("ae-a11y-status").textContent = "Tetapan asal dipulihkan.";
  });
  overlay.addEventListener("click", event => { if (event.target === overlay) close(); });
  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && !overlay.hidden) close();
    if (event.key === "Tab" && !overlay.hidden) {
      const focusable = [...dialog.querySelectorAll("button,input")].filter(el => !el.disabled);
      if (!focusable.length) return;
      const first = focusable[0], last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
  });
  document.getElementById("ae-scale").addEventListener("input", event => update({ textScale: Number(event.target.value) }));
  for (const [id, key] of [["ae-dark","darkMode"],["ae-contrast","highContrast"],["ae-motion","reduceMotion"],["ae-targets","largeTargets"],["ae-quiet","quietMode"],["ae-calm","calmView"]]) {
    document.getElementById(id).addEventListener("change", event => update({ [key]: event.target.checked }));
  }
  syncControls();
  if (requestedStudentId) {
    setProfileActionsVisible(false);
    void verifyStudentContext();
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => { applyPreferences(); renderWidget(); }, { once: true });
} else {
  applyPreferences();
  renderWidget();
}

window.AE_MPBK_ACCESSIBILITY = Object.freeze({
  getPreferences: () => ({ ...preferences }),
  isAudioEnabled: () => !preferences.quietMode,
  isReducedMotion: () => preferences.reduceMotion || window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  update: (patch) => {
    preferences = normalize({ ...preferences, ...patch });
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences)); } catch { /* ignore */ }
    applyPreferences();
  }
});
