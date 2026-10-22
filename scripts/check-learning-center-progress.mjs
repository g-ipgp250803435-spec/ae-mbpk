import assert from 'node:assert/strict';

const store = new Map();
globalThis.localStorage = {
  getItem(key) { return store.has(key) ? store.get(key) : null; },
  setItem(key, value) { store.set(key, String(value)); },
  removeItem(key) { store.delete(key); }
};

const progress = await import('../src/learning-center-progress.js');
const { getLearningProgress, recordGameOpened, recordGameCompleted, toggleGameFavorite, isGameFavorite, resetLearningCenterProgress } = progress;
const startedAt = '2026-10-22T10:00:00.000Z';
const completedAt = '2026-10-22T10:04:30.000Z';

assert.equal(recordGameOpened('kataquest', startedAt), true);
assert.equal(recordGameOpened('nombor-ninja', startedAt), true);
assert.equal(getLearningProgress().opened.kataquest.count, 1);

const record = {
  clientSessionId: 'test-session-1', gameId: 'kataquest', startedAt, completedAt,
  status: 'completed', attempts: 7, hintsUsed: 2, tasksCompleted: 5, totalTasks: 6,
  score: 83, skillCodes: ['syllable-recognition', 'word-building'],
  events: [{ answer: 'must never be persisted', rawResponse: 'private test payload' }]
};
assert.equal(recordGameCompleted(record), true);
assert.equal(recordGameCompleted(record), true, 'duplicate completion should be idempotent');
let state = getLearningProgress();
assert.equal(state.sessions.length, 1);
assert.equal(state.sessions[0].durationSeconds, 270);
assert.equal(state.sessions[0].hintsUsed, 2);
assert.deepEqual(state.sessions[0].skillCodes, ['syllable-recognition', 'word-building']);
assert.equal(JSON.stringify(state).includes('private test payload'), false, 'raw event payloads must not be stored');

assert.equal(toggleGameFavorite('kataquest'), true);
assert.equal(isGameFavorite('kataquest'), true);
assert.equal(toggleGameFavorite('kataquest'), false);
assert.equal(isGameFavorite('kataquest'), false);
assert.equal(resetLearningCenterProgress(), true);
state = getLearningProgress();
assert.equal(state.sessions.length, 0);
assert.equal(Object.keys(state.opened).length, 0);
assert.equal(state.favorites.length, 0);

console.log('PASS: local progress stores session summaries only');
console.log('PASS: duplicate session completion is idempotent');
console.log('PASS: favourites toggle and persist');
console.log('PASS: centre progress can be reset without touching game-specific keys');
