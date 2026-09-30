// After the build: a Markdown twin of every page (`/docs/guide/triggers.md` next to
// `/docs/guide/triggers`) and `/docs/llms.txt`, the index of them, so an agent or a person who
// wants the source reads it without the app. The twins are the source files with their
// frontmatter kept; the pattern is developers.openai.com's.
import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import type { SiteConfig } from 'vitepress';

export async function writeLlmsIndex(site: SiteConfig): Promise<void> {
  const lines: string[] = [
    `# ${site.site.title}`,
    '',
    `> ${site.site.description}`,
    '',
    'Every page below is also served as Markdown at the same path with `.md` appended.',
    '',
  ];
  for (const page of site.pages.sort()) {
    const src = join(site.srcDir, page);
    const md = await readFile(src, 'utf8');
    const title = /^---[\s\S]*?\btitle:\s*(.+?)\s*$/m.exec(md)?.[1] ?? /^#\s+(.+)$/m.exec(md)?.[1] ?? page;
    const out = join(site.outDir, page);
    await mkdir(dirname(out), { recursive: true });
    await copyFile(src, out);
    lines.push(`- [${title.replace(/^['"]|['"]$/g, '')}](${site.site.base}${page})`);
  }
  await writeFile(join(site.outDir, 'llms.txt'), lines.join('\n') + '\n');
}
