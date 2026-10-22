import { readFileSync, readdirSync } from 'node:fs';

const pages = [
  'index.html','account.html','misi-berdikari.html','learning-center.html',
  'accessibility.html','braille.html','communication-board.html','kataquest.html','nombor-ninja.html','dunia-emosi.html','langkah-demi-langkah.html','tangan-berbicara.html'
];
const warnings = [];
const failures = [];
const warn = (m) => { warnings.push(m); console.warn(`WARN  ${m}`); };
const fail = (m) => { failures.push(m); console.error(`FAIL  ${m}`); };
const pass = (m) => console.log(`PASS  ${m}`);
const attr = (tag, name) => {
  const match = tag.match(new RegExp(`\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i'));
  return match ? (match[1] ?? match[2] ?? match[3] ?? '') : null;
};
for (const page of pages) {
  let html;
  try { html = readFileSync(page, 'utf8'); }
  catch { fail(`Missing page: ${page}`); continue; }
  pass(`Scanned ${page}`);
  const ids = new Map();
  for (const m of html.matchAll(/\bid\s*=\s*["']([^"']+)["']/gi)) {
    const id = m[1];
    ids.set(id, (ids.get(id) || 0) + 1);
  }
  const duplicateIds = [...ids].filter(([, count]) => count > 1).map(([id]) => id);
  if (duplicateIds.length) warn(`${page}: duplicate IDs: ${duplicateIds.join(', ')}`);
  else pass(`${page}: no duplicate IDs detected`);

  for (const m of html.matchAll(/<img\b[^>]*>/gi)) {
    const alt = attr(m[0], 'alt');
    if (alt === null) warn(`${page}: image missing alt attribute`);
  }
  for (const m of html.matchAll(/<button\b[^>]*>([\s\S]*?)<\/button\s*>/gi)) {
    const tag = m[0], body = m[1].replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').trim();
    const label = attr(tag, 'aria-label') || attr(tag, 'title');
    if (!body && !label && !attr(tag, 'aria-labelledby')) warn(`${page}: button may lack an accessible name: ${tag.slice(0,100).replace(/\s+/g,' ')}`);
  }
  for (const m of html.matchAll(/<(input|select|textarea)\b[^>]*>/gi)) {
    const tag = m[0], name = (attr(tag, 'id') || attr(tag, 'name') || 'unnamed control');
    if (attr(tag, 'type')?.toLowerCase() === 'hidden') continue;
    if (attr(tag, 'aria-label') || attr(tag, 'aria-labelledby')) continue;
    const id = attr(tag, 'id');
    const escapedId = id ? id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') : null;
    const associatedLabel = id && new RegExp(`<label\\b[^>]*\\bfor\\s*=\\s*["']${escapedId}["']`, 'i').test(html);
    const wrappedLabel = id && new RegExp(`<label\\b[^>]*>[\\s\\S]{0,500}<${m[1]}\\b[^>]*\\bid\\s*=\\s*["']${escapedId}["']`, 'i').test(html);
    const labelStart = html.lastIndexOf('<label', m.index);
    const labelEnd = html.lastIndexOf('</label', m.index);
    const enclosingLabel = labelStart > labelEnd && html.indexOf('</label', m.index) > m.index;
    if (!associatedLabel && !wrappedLabel && !enclosingLabel) warn(`${page}: form control "${name}" may lack a programmatic label`);
  }
}
console.log(`\nStatic accessibility scan: ${failures.length} failure(s), ${warnings.length} warning(s).`);
console.log('Note: this heuristic cannot validate color contrast, keyboard operation, focus order, screen-reader output, or actual WCAG conformance.');
if (failures.length) process.exitCode = 1;
