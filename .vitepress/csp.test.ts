import { mkdtemp, readFile, readdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { SiteConfig } from 'vitepress';
import { externalizeDataUrls, shikiClasses, stripInlineForCsp } from './csp';

describe('stripInlineForCsp', () => {
  it('removes the mac-os probe and the empty SSR style attributes, and nothing else', () => {
    const html = '<head><script id="check-mac-os">document.documentElement.classList.toggle("mac",1)</script>\n<link rel="stylesheet" href="/docs/x.css"></head>'
      + '<div class="VPHomeContent" style=""></div><div style="--vp-vh:0px;"></div><p class="keep">text</p>';
    const out = stripInlineForCsp(html);
    expect(out).not.toContain('<script');
    expect(out).not.toContain('style=');
    expect(out).toContain('<link rel="stylesheet" href="/docs/x.css">');
    expect(out).toContain('<p class="keep">text</p>');
  });
  it('leaves a real style attribute alone (so check.mjs can fail on it)', () => {
    expect(stripInlineForCsp('<div style="color:red"></div>')).toContain('style="color:red"');
  });
});

describe('shikiClasses.transformer', () => {
  it('turns a style into a stable class and collects the CSS', () => {
    const span = { properties: { style: 'color:#FF7B72', class: 'line' } };
    shikiClasses.transformer.span!.call({} as never, span as never, 0, 0, {} as never, {} as never);
    expect(span.properties.style).toBeUndefined();
    expect(span.properties.class).toMatch(/^line sk-[0-9a-f]{6}$/);
    const cls = span.properties.class.split(' ')[1];
    expect(shikiClasses.transformer.getCSS()).toContain(`.${cls}{color:#FF7B72}`);
    const again = { properties: { style: 'color:#FF7B72' } } as { properties: Record<string, unknown> };
    shikiClasses.transformer.span!.call({} as never, again as never, 0, 0, {} as never, {} as never);
    expect(again.properties.class).toBe(cls);
  });
});

describe('externalizeDataUrls', () => {
  it('rewrites url-encoded and base64 data: SVGs in every CSS file under dist to hashed files', async () => {
    const out = await mkdtemp(join(tmpdir(), 'mu-docs-'));
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"><path d="M0 0h1v1z"/></svg>';
    await writeFile(join(out, 'a.css'), `.x{mask-image:url("data:image/svg+xml,${encodeURIComponent(svg)}")}`);
    await writeFile(join(out, 'b.css'), `.y{background:url("data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}")}`);
    const n = await externalizeDataUrls({ outDir: out, site: { base: '/docs/' } } as SiteConfig);
    expect(n).toBe(2);
    const a = await readFile(join(out, 'a.css'), 'utf8');
    const b = await readFile(join(out, 'b.css'), 'utf8');
    expect(a).not.toContain('data:');
    expect(b).not.toContain('data:');
    const m = /url\(\/docs\/assets\/icons\/([0-9a-f]{10})\.svg\)/.exec(a);
    expect(m).not.toBeNull();
    expect(b).toContain(`/docs/assets/icons/${m![1]}.svg`); // same SVG → same file
    expect(await readdir(join(out, 'assets', 'icons'))).toEqual([`${m![1]}.svg`]);
    expect(await readFile(join(out, 'assets', 'icons', `${m![1]}.svg`), 'utf8')).toBe(svg);
  });
});
