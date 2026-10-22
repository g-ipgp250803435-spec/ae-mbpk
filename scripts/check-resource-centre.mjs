import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const html=readFileSync('learning-center.html','utf8');
const app=readFileSync('index.html','utf8');
const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
const dup=[...new Set(ids.filter((id,i)=>ids.indexOf(id)!==i))];
assert.deepEqual(dup,[],'resource page must not contain duplicate IDs');
for(const topic of ['overview','braille','bim','aac','access','educator','glossary']){
 assert.match(html,new RegExp(`id="topic-${topic}"`),`missing resource topic ${topic}`);
 assert.match(html,new RegExp(`data-topic="${topic}"`),`missing navigation tab ${topic}`);
}
for(const id of ['resource-search','resource-topic-filter','resource-search-results','braille-cell','braille-quiz-question','bim-quiz-question','aac-quiz-question','aac-choices','obs-print','obs-clear']) assert.ok(ids.includes(id),`missing interactive resource control #${id}`);
assert.match(html,/function runResourceSearch\(\)/);
assert.match(html,/card\.textContent\.replace\(/);
assert.match(html,/const aacGroups=/);
assert.match(html,/data-aac-group="kata"/);
assert.match(html,/const braille=\[\['a'/);
assert.match(html,/\['z','⠵',\[1,3,5,6\]\]/);
assert.match(html,/https:\/\/mybim\.org\//);
assert.match(html,/https:\/\/www\.asha\.org\/practice-portal\/professional-issues\/augmentative-and-alternative-communication\//);
assert.match(html,/https:\/\/www\.perkins\.org\/how-the-braille-alphabet-works\//);
assert.match(html,/id="topic-access"/);
assert.match(app,/learning-center\.html#access/);
assert.match(app,/learning-center\.html#educator/);
assert.match(app,/learning-center\.html#glossary/);
assert.doesNotMatch(html,/<section[^>]+id="topic-games"/,'resource centre must not become a game catalogue');
// Verify that the 26 Unicode Braille glyphs match their listed dot combinations.
const brailleLine=html.match(/const braille=\[(.*?)\];/s)?.[1];
assert.ok(brailleLine,'Braille alphabet data must exist');
const entries=[...brailleLine.matchAll(/\['([a-z])','(.)',\[([0-9,]+)\]\]/g)];
assert.equal(entries.length,26,'the Braille demonstrator should include A-Z');
for(const [,letter,glyph,dotText] of entries){
 const dots=dotText.split(',').map(Number); const expected=dots.reduce((n,d)=>n|(1<<(d-1)),0); const actual=glyph.codePointAt(0)-0x2800;
 assert.equal(actual,expected,`Braille glyph for ${letter} must match dots ${dots.join(',')}`);
}
console.log('PASS: seven source topics, unique IDs, resource search and navigation');
console.log('PASS: Braille A-Z Unicode glyphs match their listed dot patterns');
console.log('PASS: BIM, AAC, accessibility, teacher kit and reference resources are present');
console.log('PASS: parent app links to source sections, not only game activities');
