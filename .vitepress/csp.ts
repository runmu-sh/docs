// What it takes to serve VitePress under a Content-Security-Policy with no 'unsafe-inline' for
// scripts or styles (nginx.conf). scripts/check.mjs fails the build if any of this stops working.
//
// 1. Shiki writes each token's colour as a style attribute. The transformer below turns every style
//    on a <pre> or a token <span> into a class and collects the CSS; the plugin serves it at
//    /shiki.css in dev, `write` emits it at build. The <link> is in config.ts's head.
//    (@shikijs/transformers' transformerStyleToClass only sees `token.htmlStyle`, which a single-theme
//    render never sets; the colour is put on the span afterwards, so the hook has to be `span`.)
// 2. VitePress inlines a one-line script that toggles a `mac` class (the ⌘/Ctrl hint on the search
//    button); the theme sets that class client-side instead (theme/index.ts), so the script goes.
// 3. Two default-theme components bind `:style` to a value that only exists after mount
//    (VPHomeContent's --vp-offset, VPLocalNavOutlineDropdown's --vp-vh). The server render leaves
//    `style=""` / `style="--vp-vh:0px;"` in the markup, and Vue re-applies the live value through
//    the CSSOM after mount (which the CSP allows), so the attribute is removed from the HTML. Any
//    other style attribute is left in place for check.mjs to fail on: it would mean a real style.
// 4. The default theme's icons are `data:image/svg+xml` URLs in CSS masks, which img-src 'self'
//    blocks. `externalizeDataUrls` rewrites every one in dist/**/*.css to a hashed .svg file.
import { createHash } from 'node:crypto';
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { ShikiTransformer } from 'shiki';
import type { SiteConfig } from 'vitepress';
import type { Plugin } from 'vite';

const classes = new Map<string, string>(); // class → declarations
type Styled = { properties: Record<string, unknown> };
function classify(node: Styled): void {
  const style = node.properties.style;
  if (typeof style !== 'string' || !style) return;
  const name = `sk-${createHash('sha1').update(style).digest('hex').slice(0, 6)}`;
  classes.set(name, style);
  delete node.properties.style;
  const cls = node.properties.class;
  node.properties.class = Array.isArray(cls) ? [...cls, name] : cls ? `${cls} ${name}` : name;
}
const transformer: ShikiTransformer & { getCSS(): string } = {
  name: 'runmu:style-to-class',
  pre(node) { classify(node); },
  span(node) { classify(node); },
  getCSS: () => [...classes].map(([c, d]) => `.${c}{${d}}`).join('\n') + '\n',
};

const plugin: Plugin = {
  name: 'runmu-shiki-css',
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      if (req.url?.split('?')[0] === '/docs/shiki.css') {
        res.setHeader('Content-Type', 'text/css');
        res.end(transformer.getCSS());
      } else next();
    });
  },
};

async function write(site: SiteConfig): Promise<void> {
  await mkdir(site.outDir, { recursive: true });
  await writeFile(join(site.outDir, 'shiki.css'), transformer.getCSS());
}

export const shikiClasses = { transformer, plugin, write };

export function stripInlineForCsp(html: string): string {
  return html
    .replace(/<script id="check-mac-os">[^<]*<\/script>\s*/g, '')
    .replace(/ style=""/g, '')
    .replace(/ style="--vp-vh:0px;"/g, '');
}

/** Every `url("data:image/svg+xml,…")` in a CSS file under dist/ becomes a file under assets/icons/. */
export async function externalizeDataUrls(site: SiteConfig): Promise<number> {
  const cssFiles: string[] = [];
  async function walk(dir: string): Promise<void> {
    for (const e of await readdir(dir, { withFileTypes: true })) {
      const p = join(dir, e.name);
      if (e.isDirectory()) await walk(p);
      else if (e.name.endsWith('.css')) cssFiles.push(p);
    }
  }
  await walk(site.outDir);
  const iconsDir = join(site.outDir, 'assets', 'icons');
  await mkdir(iconsDir, { recursive: true });
  let n = 0;
  for (const file of cssFiles) {
    let css = await readFile(file, 'utf8');
    const writes: Promise<void>[] = [];
    css = css.replace(/url\("data:image\/svg\+xml([;,])([^"]*)"\)/g, (_m, sep: string, body: string) => {
      const svg = sep === ';' ? Buffer.from(body.replace(/^base64,/, ''), 'base64').toString('utf8') : decodeURIComponent(body);
      const name = `${createHash('sha1').update(svg).digest('hex').slice(0, 10)}.svg`;
      writes.push(writeFile(join(iconsDir, name), svg));
      n++;
      return `url(${site.site.base}assets/icons/${name})`;
    });
    await Promise.all(writes);
    await writeFile(file, css);
  }
  return n;
}
