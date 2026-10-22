/**
 * Privacy-first local progress for the ae-MBPK learning centre.
 * Stores only game identifiers and session summaries on this browser. It never
 * stores learner answers, names, diagnoses, or synchronises data to a server.
 */
const STORAGE_KEY = 'aembpk-learning-progress-v1';
const MAX_SESSIONS = 500;

function freshState() {
  return { version: 1, favorites: [], opened: {}, sessions: [] };
}

function readState() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (!raw || typeof raw !== 'object') return freshState();
    return {
      version: 1,
      favorites: Array.isArray(raw.favorites) ? [...new Set(raw.favorites.filter(x => typeof x === 'string'))] : [],
      opened: raw.opened && typeof raw.opened === 'object' && !Array.isArray(raw.opened) ? raw.opened : {},
      sessions: Array.isArray(raw.sessions) ? raw.sessions.filter(s => s && typeof s === 'object' && typeof s.gameId === 'string') : []
    };
  } catch {
    return freshState();
  }
}

function writeState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

function safeDate(value, fallback = new Date()) {
  const date = value ? new Date(value) : fallback;
  return Number.isFinite(date.getTime()) ? date.toISOString() : fallback.toISOString();
}

function count(value) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0;
}

export function getLearningProgress() {
  return readState();
}

export function recordGameOpened(gameId, at = new Date()) {
  if (!gameId || typeof gameId !== 'string') return false;
  const state = readState();
  const previous = state.opened[gameId] || {};
  state.opened[gameId] = {
    count: count(previous.count) + 1,
    lastOpenedAt: safeDate(at)
  };
  return writeState(state);
}

export function recordGameCompleted(record, extra = {}) {
  if (!record || typeof record !== 'object') return false;
  const gameId = String(extra.gameId || record.gameId || '').trim();
  if (!gameId) return false;
  const completedAt = safeDate(record.completedAt || record.finishedAt || extra.completedAt);
  const startedAt = safeDate(record.startedAt || extra.startedAt || completedAt);
  const clientSessionId = String(record.clientSessionId || extra.clientSessionId || `${gameId}:${completedAt}`);
  const state = readState();
  if (state.sessions.some(session => session.clientSessionId === clientSessionId)) return true;

  const summary = record.summary && typeof record.summary === 'object' ? record.summary : {};
  const skillCodes = Array.isArray(record.skillCodes) ? record.skillCodes
    : Array.isArray(summary.skillsPractised) ? summary.skillsPractised
    : Array.isArray(extra.skillCodes) ? extra.skillCodes : [];
  const elapsed = Math.max(0, Math.round((new Date(completedAt).getTime() - new Date(startedAt).getTime()) / 1000));
  const session = {
    clientSessionId,
    gameId,
    startedAt,
    completedAt,
    durationSeconds: count(extra.durationSeconds ?? elapsed),
    tasksCompleted: count(record.tasksCompleted ?? record.stepsCompleted ?? summary.tasksCompleted ?? extra.tasksCompleted),
    totalTasks: count(record.totalTasks ?? record.total ?? summary.totalTasks ?? extra.totalTasks),
    attempts: count(record.attempts),
    hintsUsed: count(record.hintsUsed ?? record.hints ?? extra.hintsUsed),
    skillCodes: [...new Set(skillCodes.filter(code => typeof code === 'string').map(code => code.slice(0, 80)))].slice(0, 20),
    score: Number.isFinite(Number(record.score ?? extra.score)) ? Math.max(0, Math.min(100, Math.round(Number(record.score ?? extra.score)))) : null
  };
  state.sessions.unshift(session);
  state.sessions = state.sessions.slice(0, MAX_SESSIONS);
  const opened = state.opened[gameId] || {};
  state.opened[gameId] = { count: Math.max(1, count(opened.count)), lastOpenedAt: safeDate(opened.lastOpenedAt || startedAt) };
  return writeState(state);
}

export function isGameFavorite(gameId) {
  return readState().favorites.includes(gameId);
}

export function toggleGameFavorite(gameId) {
  if (!gameId || typeof gameId !== 'string') return false;
  const state = readState();
  const exists = state.favorites.includes(gameId);
  state.favorites = exists ? state.favorites.filter(id => id !== gameId) : [...state.favorites, gameId];
  writeState(state);
  return !exists;
}

export function resetLearningCenterProgress() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    return true;
  } catch {
    return false;
  }
}

export const LEARNING_PROGRESS_STORAGE_KEY = STORAGE_KEY;
