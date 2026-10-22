import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { getGameById, getAvailableGames } from '../src/game-registry.js';

const games = [
  { id: 'dunia-emosi', route: '/dunia-emosi.html', file: 'dunia-emosi.html', skills: ['emotion-vocabulary', 'self-regulation'] },
  { id: 'langkah-rutin', route: '/langkah-demi-langkah.html', file: 'langkah-demi-langkah.html', skills: ['sequencing', 'daily-routines'] },
  { id: 'tangan-berbicara', route: '/tangan-berbicara.html', file: 'tangan-berbicara.html', skills: ['my-sign-language'] }
];
for (const game of games) {
  const entry = getGameById(game.id);
  assert.ok(entry, `${game.id}: registry entry exists`);
  assert.equal(entry.status, 'live', `${game.id}: status live`);
  assert.equal(entry.route, game.route, `${game.id}: route`);
  assert.ok(getAvailableGames().some(x => x.id === game.id), `${game.id}: available in catalogue`);
  for (const skill of game.skills) assert.ok(entry.skillCodes.includes(skill), `${game.id}: skill ${skill}`);
  const html = readFileSync(game.file, 'utf8');
  assert.ok(html.includes('createLearningGameRuntime'), `${game.id}: session runtime integrated`);
  assert.ok(html.includes('aria-live="polite"'), `${game.id}: live feedback region`);
  assert.ok(html.includes('prefers-reduced-motion:reduce') || html.includes('prefers-reduced-motion: reduce'), `${game.id}: reduced-motion support`);
  console.log(`PASS ${game.id}: registry, route, skills, runtime and accessibility hooks`);
}
const vite = readFileSync('vite.config.js', 'utf8');
for (const game of games) assert.ok(vite.includes(`'${game.file}'`), `${game.file}: Vite production input`);
console.log('PASS all three additional games are included in Vite production inputs');
