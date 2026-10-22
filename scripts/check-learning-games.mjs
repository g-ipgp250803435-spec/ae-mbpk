import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { GAME_REGISTRY, getGameById, getAvailableGames } from '../src/game-registry.js';

const games = [
  { id: 'kataquest', route: '/kataquest.html', file: 'kataquest.html', modes: ['data-mode="syllable"', 'data-mode="build"', 'data-mode="read"'], skills: ['syllable-recognition', 'word-building', 'word-reading'] },
  { id: 'nombor-ninja', route: '/nombor-ninja.html', file: 'nombor-ninja.html', modes: ['data-mode="count"', 'data-mode="compare"', 'data-mode="operate"'], skills: ['number-recognition', 'counting', 'quantity-comparison', 'addition', 'subtraction'] }
];
for (const game of games) {
  const entry = getGameById(game.id);
  assert.ok(entry, `${game.id} exists in registry`);
  assert.equal(entry.status, 'live', `${game.id} is marked live`);
  assert.equal(entry.route, game.route, `${game.id} route matches page`);
  assert.ok(getAvailableGames().some(item => item.id === game.id), `${game.id} appears in available games`);
  const html = readFileSync(game.file, 'utf8');
  for (const mode of game.modes) assert.ok(html.includes(mode), `${game.id} has ${mode}`);
  assert.ok(html.includes('createLearningGameRuntime'), `${game.id} uses shared session runtime`);
  assert.ok(html.includes('aria-live="polite"'), `${game.id} includes live status feedback`);
  assert.ok(html.includes('prefers-reduced-motion:reduce') || html.includes('prefers-reduced-motion: reduce'), `${game.id} respects reduced motion`);
  for (const skill of game.skills) assert.ok(entry.skillCodes.includes(skill), `${game.id} registry includes ${skill}`);
  assert.ok(!/https?:\/\//i.test(html), `${game.id} should not depend on remote assets`);
  if (game.id === 'kataquest') {
    const dataMatch = html.match(/const words=(\[[\s\S]*?\]);\s*const translations=/);
    assert.ok(dataMatch, 'KataQuest word bank exists');
    const words = runInNewContext(`(${dataMatch[1]})`);
    assert.ok(words.length >= 15, 'KataQuest has enough word data');
    for (const item of words) assert.equal(item.syllables.join(''), item.word, `Syllables must reconstruct ${item.word}`);
    const svgMap = html.match(/const svgs=\{([\s\S]*?)\};return svgs/);
    assert.ok(svgMap, 'KataQuest local illustration bank exists');
    const visuals = new Set([...svgMap[1].matchAll(/([a-z]+):\'/g)].map(match => match[1]));
    for (const item of words) assert.ok(visuals.has(item.visual), `Missing local illustration for ${item.word}`);
    console.log('PASS: KataQuest word bank, syllable joins and matching local illustrations');
  }
  console.log(`PASS: ${game.id} registry, route, modes, session integration and accessibility hooks`);
}
assert.ok(GAME_REGISTRY.every(game => game.id), 'all game registry entries have IDs');
console.log('PASS: learning game static integration checks');
