#!/usr/bin/env node
// Checks runmu.sh/docs over the source and over dist/ (run `npm run build` first). The rules are the
// runmu.sh site's (clients/site/scripts/check.mjs in runmu-sh/client), because the docs are served
// under the same kind of Content-Security-Policy (nginx.conf: no 'unsafe-inline' anywhere).
//  Source
//  - no v-html / innerHTML / insertAdjacentHTML / document.write in the theme;
//  - no `style=` attribute and no string `:style` binding in a theme template; no eval;
//  - no literal colour (#…, rgb(, hsl(, color-mix() in any CSS or <style> outside @muclient/brand's
//    tokens.css (the theme maps --vp-* onto the brand tokens; content pages have no style at all);
//  - every content page has frontmatter with a title, and `audience` if set is one of the four;
//  - every path in stable-paths.txt has a page (the client and the marketplace deep-link to these).
//  Dist
//  - no inline <script> or <style> in any HTML, no style attribute, no inline event handler;
//  - no data: URL in any CSS; every local href/src in the HTML and url() in the CSS is an emitted file;
//  - llms.txt and a .md twin of every page exist;
//  - the size budget: the landing page's and one doc page's first load (scripts + CSS, gzipped) ≤ 120 kB.
// Usage: node scripts/check.mjs
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const content = join(root, 'content');
const theme = join(root, '.vitepress');
const dist = join(root, 'dist');
const BASE = '/docs/';
const BUDGET = 120 * 1024;
const SITE_PATHS = new Set(['/', '/games/', '/marketplace/', '/login/']);
const AUDIENCES = new Set(['guide', 'automation', 'extensions', 'reference']);
const errors = [];
const rel = (p) => relative(root, p);

function files(dir, test) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true }).flatMap((d) =>
    d.name === 'node_modules' || d.name === 'cache' || d.name === 'dist' ? [] : d.isDirectory() ? files(join(dir, d.name), test) : test(d.name) ? [join(dir, d.name)] : []);
}
const strip = (code) => code.replace(/^\s*\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');

// ---- Source: the theme --------------------------------------------------------------------------
for (const f of files(theme, (n) => /\.(ts|vue|mjs)$/.test(n))) {
  const code = strip(readFileSync(f, 'utf8'));
  if (/\bv-html\b/.test(code)) errors.push(`${rel(f)} uses v-html`);
  if (/\.(innerHTML|outerHTML)\s*=|\binsertAdjacentHTML\(|\bdocument\.write(ln)?\(/.test(code)) errors.push(`${rel(f)} sets HTML from a string`);
  if (f.endsWith('.vue')) {
    const template = code.slice(code.indexOf('<template'));
    if (/\s:style="['`]/.test(template)) errors.push(`${rel(f)} binds :style to a string`);
    if (/\sstyle="/.test(template)) errors.push(`${rel(f)} has a style attribute (blocked by the CSP)`);
  }
  if (/\beval\(|new Function\(/.test(code)) errors.push(`${rel(f)} uses eval (blocked by the CSP)`);
}
for (const f of files(theme, (n) => n.endsWith('.css') || n.endsWith('.vue'))) {
  let css = readFileSync(f, 'utf8');
  if (f.endsWith('.vue')) {
    const m = /<style[^>]*>([\s\S]*?)<\/style>/.exec(css);
    if (!m) continue;
    css = m[1];
  }
  const bare = strip(css).match(/#[0-9a-fA-F]{3,8}\b|\brgba?\(|\bhsla?\(|\bcolor-mix\(/g);
  if (bare) errors.push(`${rel(f)} has colours outside @muclient/brand's tokens.css: ${[...new Set(bare)].join(', ')}`);
}

// ---- Source: the content ------------------------------------------------------------------------
const pages = files(content, (n) => n.endsWith('.md'));
const routes = new Set();
for (const f of pages) {
  const md = readFileSync(f, 'utf8');
  const fm = /^---\n([\s\S]*?)\n---/.exec(md);
  if (!fm) { errors.push(`${rel(f)} has no frontmatter (title: is required)`); continue; }
  if (!/^title:\s*\S/m.test(fm[1])) errors.push(`${rel(f)} has no title in its frontmatter`);
  const aud = /^audience:\s*(\S+)/m.exec(fm[1]);
  if (aud && !AUDIENCES.has(aud[1])) errors.push(`${rel(f)}: audience "${aud[1]}" is not one of ${[...AUDIENCES].join(', ')}`);
  if (/<style[\s>]|\sstyle="/.test(md)) errors.push(`${rel(f)} has inline style (blocked by the CSP)`);
  routes.add('/' + relative(content, f).replace(/\\/g, '/').replace(/(^|\/)index\.md$/, '$1').replace(/\.md$/, ''));
}
const stable = join(root, 'stable-paths.txt');
if (existsSync(stable)) {
  for (const line of readFileSync(stable, 'utf8').split('\n')) {
    const p = line.replace(/#.*/, '').trim();
    if (p && !routes.has(p) && !routes.has(p + '/')) errors.push(`stable-paths.txt: ${p} has no page (the client links to it; add a redirect page rather than dropping it)`);
  }
}

// ---- Dist ---------------------------------------------------------------------------------------
if (!existsSync(dist)) {
  errors.push('dist is missing: run `npm run build` first');
} else {
  const emitted = new Set(files(dist, () => true).map((f) => relative(dist, f).replace(/\\/g, '/')));
  const refOk = (ref, from) => {
    if (/^(https?:|mailto:|#|data:|javascript:)/.test(ref)) return;
    if (SITE_PATHS.has(ref)) return; // the brand shell's links to the rest of runmu.sh (served by mu-landing, not this image)
    const clean = ref.split(/[?#]/)[0];
    if (!clean) return;
    let path = clean.startsWith(BASE) ? clean.slice(BASE.length) : clean.startsWith('/') ? null : relative(dist, resolve(dirname(from), clean)).replace(/\\/g, '/');
    if (path === null) { errors.push(`${relative(dist, from)}: ${ref} is absolute but not under ${BASE} (runmu.sh serves the docs there; use withBase)`); return; }
    path = path.replace(/\/$/, '');
    if (path === '') path = 'index.html';
    if (emitted.has(path) || emitted.has(`${path}.html`) || emitted.has(`${path}/index.html`)) return;
    errors.push(`${relative(dist, from)}: missing file: ${ref}`);
  };
  const htmlOut = files(dist, (n) => n.endsWith('.html'));
  for (const f of htmlOut) {
    const html = readFileSync(f, 'utf8');
    if (/\sstyle="/.test(html)) errors.push(`${relative(dist, f)} has a style attribute (blocked by the CSP): ${html.match(/\sstyle="[^"]*"/g).slice(0, 3).join(' ')}`);
    if (/<style[\s>]/.test(html)) errors.push(`${relative(dist, f)} has a <style> element (blocked by the CSP)`);
    if (/\son[a-z]+="/.test(html)) errors.push(`${relative(dist, f)} has an inline event handler (blocked by the CSP)`);
    for (const m of html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)) {
      if (!/\bsrc="/.test(m[1]) || m[2].trim()) errors.push(`${relative(dist, f)} has an inline <script> (blocked by the CSP): ${m[0].slice(0, 80)}`);
    }
    for (const m of html.matchAll(/<(?:a|link|script|img)\s[^>]*?\s(?:href|src)="([^"]+)"/g)) refOk(m[1], f);
  }
  for (const f of files(dist, (n) => n.endsWith('.css'))) {
    const css = readFileSync(f, 'utf8');
    if (/url\(\s*['"]?data:/.test(css)) errors.push(`${relative(dist, f)} has a data: URL (blocked by the CSP)`);
    for (const m of css.matchAll(/url\(\s*['"]?([^'")]+)['"]?\s*\)/g)) refOk(m[1], f);
  }
  if (!emitted.has('llms.txt')) errors.push('dist/llms.txt is missing');
  for (const f of pages) {
    const twin = relative(content, f).replace(/\\/g, '/');
    if (!emitted.has(twin)) errors.push(`dist/${twin} (the Markdown twin) is missing`);
  }

  // Size budget.
  const gz = (p) => gzipSync(readFileSync(join(dist, p))).length;
  const staticImports = (p, seen = new Set()) => {
    if (seen.has(p) || !emitted.has(p)) return seen;
    seen.add(p);
    const js = readFileSync(join(dist, p), 'utf8');
    for (const m of js.matchAll(/(?:^|[;\s])import\s*(?:[^'"()]*?from\s*)?['"]([^'"]+)['"]/gm)) staticImports(relative(dist, resolve(dirname(join(dist, p)), m[1])).replace(/\\/g, '/'), seen);
    return seen;
  };
  const report = [];
  for (const page of ['index.html', 'automation/first-trigger.html']) {
    if (!emitted.has(page)) continue;
    const html = readFileSync(join(dist, page), 'utf8');
    const load = new Set();
    for (const m of html.matchAll(/<script[^>]*\ssrc="([^"]+)"/g)) for (const p of staticImports(m[1].replace(BASE, ''))) load.add(p);
    for (const m of html.matchAll(/<link[^>]*rel="(?:[^"]*stylesheet[^"]*|modulepreload)"[^>]*href="([^"]+)"/g)) {
      const p = m[1].replace(BASE, '');
      if (p.endsWith('.js')) for (const q of staticImports(p)) load.add(q);
      else if (emitted.has(p)) load.add(p);
    }
    const parts = [...load].map((p) => [p, gz(p)]);
    const total = parts.reduce((n, [, s]) => n + s, 0);
    report.push(`  ${BASE}${page.replace(/index\.html$/, '').replace(/\.html$/, '').padEnd(28)} ${(total / 1024).toFixed(1).padStart(6)} kB gz  (${parts.map(([p, s]) => `${p.replace(/^assets\/(chunks\/)?/, '')} ${(s / 1024).toFixed(1)}`).join(', ')})`);
    if (total > BUDGET) errors.push(`${BASE}${page}: first load ${(total / 1024).toFixed(1)} kB gzipped is over the ${BUDGET / 1024} kB budget`);
  }
  console.log(`first load (scripts + CSS, gzipped; budget ${BUDGET / 1024} kB):\n${report.join('\n')}`);
}

if (errors.length) {
  console.error(errors.map((e) => `✗ ${e}`).join('\n'));
  process.exit(1);
}
console.log(`✓ runmu.sh/docs: theme clean (no HTML sinks, no inline styles, colours from brand tokens), ${pages.length} pages with frontmatter, dist has no inline script/style/data: URL, every reference emitted, llms.txt and .md twins present`);
