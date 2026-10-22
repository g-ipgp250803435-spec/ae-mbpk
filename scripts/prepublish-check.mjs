import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const failures = [];
const warnings = [];
const pass = (message) => console.log(`PASS  ${message}`);
const fail = (message) => { failures.push(message); console.error(`FAIL  ${message}`); };
const warn = (message) => { warnings.push(message); console.warn(`WARN  ${message}`); };

const required = [
  'index.html','account.html','misi-berdikari.html','accessibility.html','src/learning-center-progress.js','scripts/check-learning-center-progress.mjs','scripts/check-learning-center-ui.mjs',
  'braille.html','communication-board.html','learning-center.html','kataquest.html','nombor-ninja.html','dunia-emosi.html','langkah-demi-langkah.html','tangan-berbicara.html','src/supabase.js','src/learning-game-runtime.js','scripts/check-learning-games.mjs','.env.example',
  '.gitignore','vercel.json','supabase/migrations'
];
for (const item of required) {
  if (existsSync(item)) pass(`Required release file exists: ${item}`);
  else fail(`Required release file missing: ${item}`);
}

const pkg = JSON.parse(readFileSync('package.json','utf8'));
for (const script of ['dev','build','preview','check:release','check:games','check:added-games','check:progress','check:ui']) {
  if (pkg.scripts?.[script]) pass(`package.json script exists: ${script}`);
  else fail(`package.json script missing: ${script}`);
}

const ignore = readFileSync('.gitignore','utf8');
if (/^\.env\.\*$/m.test(ignore) && /^!\.env\.example$/m.test(ignore)) pass('Environment files are ignored while .env.example is allowed');
else fail('.gitignore should ignore .env.* and explicitly allow .env.example');

const example = readFileSync('.env.example','utf8');
if (/VITE_SUPABASE_URL/.test(example) && /VITE_SUPABASE_PUBLISHABLE_KEY/.test(example)) pass('Example environment file documents required public Supabase settings');
else fail('.env.example does not list expected Vite Supabase settings');

const supabase = readFileSync('src/supabase.js','utf8');
if (/VITE_SUPABASE_PUBLISHABLE_KEY/.test(supabase)) pass('Supabase client uses publishable-key environment variable');
else fail('Supabase client does not use expected publishable-key variable');
if (/service_role|sb_secret_/i.test(supabase)) fail('Potential privileged key reference found in client Supabase module');
else pass('No service-role/secret-key literal found in src/supabase.js');

const vite = readFileSync('vite.config.js','utf8');
for (const page of ['index.html','account.html','misi-berdikari.html','accessibility.html','braille.html','communication-board.html','learning-center.html','kataquest.html','nombor-ninja.html','dunia-emosi.html','langkah-demi-langkah.html','tangan-berbicara.html']) {
  if (vite.includes(`'${page}'`)) pass(`Vite production input includes ${page}`);
  else fail(`Vite production input missing ${page}`);
}

const vercel = JSON.parse(readFileSync('vercel.json','utf8'));
const headers = vercel.headers?.[0]?.headers || [];
for (const key of ['X-Content-Type-Options','X-Frame-Options','Referrer-Policy','Permissions-Policy']) {
  if (headers.some(h=>h.key.toLowerCase()===key.toLowerCase())) pass(`Vercel security header configured: ${key}`);
  else fail(`Vercel security header missing: ${key}`);
}
if (headers.some(h=>h.key.toLowerCase()==='content-security-policy')) warn('CSP is configured; manually verify it does not block Supabase/auth/app resources.');
else warn('No Content-Security-Policy is enforced by this package; consider a tested CSP after checking inline scripts and Supabase domains.');

const envLocalExists = existsSync('.env.local');
if (envLocalExists) warn('.env.local exists locally; never commit it. Ensure it is excluded by Git and configure production values in Vercel settings.');
else pass('.env.local is not present in the release package');

const migrationDir='supabase/migrations';
if (existsSync(migrationDir)) {
  const migrations=readdirSync(migrationDir).filter(n=>n.endsWith('.sql')).sort();
  if (migrations.length) pass(`${migrations.length} SQL migration file(s) found; review applied status in Supabase separately`);
  else warn('No SQL migrations found');
}

console.log(`\nRelease static check: ${failures.length} failure(s), ${warnings.length} warning(s).`);
if (failures.length) process.exitCode=1;
