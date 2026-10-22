/**
 * ae-MBPK Game Session Contract v1
 *
 * Shared, privacy-conscious session model for all game modules.
 * By default, records stay in memory. No names, diagnoses, answer text, or raw
 * learner responses are collected. Persist/sync only after the host has verified
 * the teacher session and the selected student profile.
 */
const CONTRACT_VERSION = 1;
const MAX_SKILL_CODES = 20;

function uuid() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  // RFC4122 v4-compatible fallback for browsers without crypto.randomUUID.
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    return (c === "x" ? r : (r & 3 | 8)).toString(16);
  });
}

function safeCode(value, max = 80) {
  return String(value ?? "").trim().replace(/[^a-zA-Z0-9._:-]/g, "-").slice(0, max);
}

function safeCount(value) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0;
}

function safeScore(value) {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return Math.min(100, Math.max(0, Math.round(n * 100) / 100));
}

function parseDate(value) {
  const d = value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(d.getTime())) throw new TypeError("Tarikh sesi tidak sah.");
  return d;
}

export function createGameSession({
  gameId,
  skillCodes = [],
  difficulty = "standard",
  clock = () => new Date(),
  idFactory = uuid
} = {}) {
  const normalizedGameId = safeCode(gameId);
  if (!normalizedGameId) throw new TypeError("gameId diperlukan.");
  const started = parseDate(clock());
  const skills = [...new Set(skillCodes.map(code => safeCode(code)).filter(Boolean))].slice(0, MAX_SKILL_CODES);
  const record = {
    contractVersion: CONTRACT_VERSION,
    clientSessionId: idFactory(),
    gameId: normalizedGameId,
    skillCodes: skills,
    difficulty: safeCode(difficulty, 32) || "standard",
    startedAt: started.toISOString(),
    completedAt: null,
    status: "in_progress",
    attempts: 0,
    correctAttempts: 0,
    hintsUsed: 0,
    tasksCompleted: 0,
    totalTasks: 0,
    score: null,
    events: []
  };
  let finalized = false;

  function assertActive() {
    if (finalized || record.status !== "in_progress") {
      throw new Error("Sesi sudah ditamatkan atau dibatalkan.");
    }
  }
  function addEvent(type, details = {}) {
    record.events.push({
      type,
      at: parseDate(clock()).toISOString(),
      skillCode: safeCode(details.skillCode || "", 80) || null,
      correct: typeof details.correct === "boolean" ? details.correct : null,
      hintUsed: Boolean(details.hintUsed)
    });
  }

  return Object.freeze({
    getSnapshot() {
      return JSON.parse(JSON.stringify(record));
    },
    recordAttempt({ skillCode, correct = false, hintUsed = false } = {}) {
      assertActive();
      record.attempts += 1;
      if (correct === true) record.correctAttempts += 1;
      if (hintUsed) record.hintsUsed += 1;
      const code = safeCode(skillCode || "", 80);
      if (code && !record.skillCodes.includes(code) && record.skillCodes.length < MAX_SKILL_CODES) {
        record.skillCodes.push(code);
      }
      addEvent("attempt", { skillCode: code, correct: correct === true, hintUsed });
      return this.getSnapshot();
    },
    useHint({ skillCode } = {}) {
      assertActive();
      record.hintsUsed += 1;
      addEvent("hint", { skillCode });
      return this.getSnapshot();
    },
    setTaskProgress({ completed = record.tasksCompleted, total = record.totalTasks } = {}) {
      assertActive();
      const t = safeCount(total);
      record.totalTasks = t;
      record.tasksCompleted = Math.min(t || safeCount(completed), safeCount(completed));
      return this.getSnapshot();
    },
    complete({ score = null, summary = {} } = {}) {
      assertActive();
      const completed = parseDate(clock());
      record.completedAt = completed.toISOString();
      record.status = "completed";
      record.score = safeScore(score);
      record.summary = {
        tasksCompleted: record.tasksCompleted,
        totalTasks: record.totalTasks,
        correctAttempts: record.correctAttempts,
        skillsPractised: [...record.skillCodes],
        noteCode: safeCode(summary.noteCode || "", 40) || null
      };
      finalized = true;
      return this.getSnapshot();
    },
    cancel({ reasonCode = "user-exit" } = {}) {
      assertActive();
      record.status = "cancelled";
      record.cancelledAt = parseDate(clock()).toISOString();
      record.cancelReasonCode = safeCode(reasonCode, 40) || "user-exit";
      finalized = true;
      return this.getSnapshot();
    }
  });
}

/**
 * Map a completed contract record to the current public.game_sessions schema.
 * `studentId` is supplied only by the authenticated host after selecting a profile.
 * RLS remains the source of truth for whether this teacher may write the session.
 */
export function toSupabaseGameSession(record, { studentId, createdBy } = {}) {
  if (!record || record.contractVersion !== CONTRACT_VERSION) {
    throw new TypeError("Format rekod sesi tidak disokong.");
  }
  if (record.status !== "completed" || !record.completedAt) {
    throw new Error("Hanya sesi yang selesai boleh disegerakkan.");
  }
  if (!studentId || !createdBy) {
    throw new Error("Profil murid dan identiti guru yang disahkan diperlukan.");
  }
  const started = parseDate(record.startedAt).getTime();
  const completed = parseDate(record.completedAt).getTime();
  return {
    client_session_id: record.clientSessionId,
    student_id: studentId,
    game_slug: safeCode(record.gameId, 80),
    skill_code: record.skillCodes?.[0] || null,
    score: safeScore(record.score),
    attempts: safeCount(record.attempts),
    hints_used: safeCount(record.hintsUsed),
    duration_seconds: Math.max(0, Math.round((completed - started) / 1000)),
    result_summary: {
      contract_version: CONTRACT_VERSION,
      status: "completed",
      correct_attempts: safeCount(record.correctAttempts),
      tasks_completed: safeCount(record.tasksCompleted),
      total_tasks: safeCount(record.totalTasks),
      skills_practised: (record.skillCodes || []).map(code => safeCode(code)).filter(Boolean).slice(0, MAX_SKILL_CODES),
      difficulty: safeCode(record.difficulty, 32) || "standard",
      ...(record.summary?.noteCode ? { note_code: safeCode(record.summary.noteCode, 40) } : {})
    },
    completed_at: record.completedAt,
    created_by: createdBy
  };
}

/**
 * Sync a completed record once. Duplicate client_session_id (23505) is treated
 * as already saved. Student ownership is enforced by Supabase RLS.
 */
export async function syncCompletedGameSession(supabase, record, { studentId } = {}) {
  if (!supabase?.auth?.getUser || !supabase?.from) {
    throw new TypeError("Klien Supabase yang sah diperlukan.");
  }
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;
  const user = authData?.user;
  if (!user?.id) throw new Error("Guru perlu log masuk sebelum menyegerakkan sesi.");
  const payload = toSupabaseGameSession(record, { studentId, createdBy: user.id });
  const { error } = await supabase.from("game_sessions").insert(payload);
  if (error?.code === "23505") {
    return { status: "already-saved", clientSessionId: payload.client_session_id };
  }
  if (error) throw error;
  return { status: "synced", clientSessionId: payload.client_session_id };
}

export const GAME_SESSION_CONTRACT_VERSION = CONTRACT_VERSION;
