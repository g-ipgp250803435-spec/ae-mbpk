import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

const html = readFileSync('index.html', 'utf8');
const registry = readFileSync('src/game-registry.js', 'utf8');
const runtime = readFileSync('src/learning-game-runtime.js', 'utf8');
const progress = readFileSync('src/learning-center-progress.js', 'utf8');
const misi = readFileSync('misi-berdikari.html', 'utf8');
const braille = readFileSync('braille.html', 'utf8');
const board = readFileSync('communication-board.html', 'utf8');

for (const id of ['daily-mission', 'recent-section', 'home-pathways', 'resource-center-enter', 'favorites-only', 'game-results-count', 'command-open', 'mobile-more', 'reward-overview', 'reset-progress']) {
  assert.match(html, new RegExp(`id="${id}"`), `missing interactive UI element #${id}`);
}
console.log('PASS: dashboard, pathways, search, mobile navigation, rewards and reset controls are present');

assert.doesNotMatch(html, /68%|4\s*\/\s*6|25\s*<small[^>]*>min<\/small>/, 'dashboard must not use hard-coded example learner progress');
assert.match(html, /getLearningProgress\(\)/);
assert.match(html, /renderDashboard\(\)/);
console.log('PASS: dashboard progress is derived from local session summaries, not fixed demo metrics');

for (const route of ['/learning-center.html', '/learning-center.html#braille', '/learning-center.html#bim', '/learning-center.html#aac']) {
  assert.ok(html.includes(route), `resource-centre link ${route} must exist`);
}
const resource = readFileSync('learning-center.html', 'utf8');
for (const id of ['topic-braille', 'topic-bim', 'topic-aac', 'topic-educator', 'topic-glossary', 'braille-cell', 'aac-choices', 'lesson-output']) {
  assert.match(resource, new RegExp(`id="${id}"`), `learning resource missing ${id}`);
}
assert.doesNotMatch(resource, /data-game=/, 'resource centre should not duplicate game catalogue');
console.log('PASS: Learning Centre is a distinct resource library with Braille, BIM, AAC and teacher resources');

assert.match(html, /data-favorite=/);
assert.match(html, /toggleGameFavorite/);
assert.match(html, /openCommandPalette/);
assert.match(html, /openMoreMenu/);
assert.match(html, /more-menu-item/);
console.log('PASS: favourites, quick search and mobile access to secondary sections are wired');

const topActions = html.match(/<div class="top-actions" aria-label="Kawalan aplikasi">([\s\S]*?)<\/div>/)?.[1] || '';
assert.ok(topActions, 'top-bar action group must exist');
assert.doesNotMatch(topActions, /<svg\b/, 'top-bar must not layer SVG fallbacks over Flaticon images');
assert.match(topActions, /data-flaticon="search"/);
assert.match(topActions, /data-flaticon="accessibility"/);
assert.match(topActions, /data-flaticon="profile"/);
console.log('PASS: top-bar icons use monochrome Flaticon images without stacked SVG fallback symbols');

assert.match(runtime, /recordGameOpened\(gameId\)/);
assert.match(runtime, /recordGameCompleted\(record\)/);
assert.match(misi, /ae-mbpk-learning-session-completed/);
assert.match(braille, /recordGameCompleted\(record\)/);
assert.match(board, /recordGameOpened\("papan-komunikasi"\)/);
assert.match(progress, /MAX_SESSIONS/);
assert.doesNotMatch(progress, /rawResponse|answerText|diagnosis/i);
console.log('PASS: local progress is integrated across game sessions and omits raw answers/diagnoses');

assert.match(html, /href="\/account\.html"/);
assert.match(html, /recentSessionsText:"Bukan data murid sebenar\."/);
console.log('PASS: real Teacher Portal is linked and Teacher Studio sample analytics remain labelled as demo');
