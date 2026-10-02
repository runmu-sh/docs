// runmu.sh/docs: VitePress, served under /docs/ from the mu-docs image behind the runmu.sh Caddy.
// The shape is developers.openai.com's: a top bar of audience sections (Guide / Automation /
// Extensions / Reference), a sidebar per section, a right-hand outline, local search.
//
// The CSP (nginx.conf) has no 'unsafe-inline' for scripts or styles, so:
//  - appearance: false   removes the inline dark-mode script (the site is dark only);
//  - metaChunk: true     emits the page-hash map as a hashed module instead of an inline script.
// scripts/check.mjs fails the build if an inline <script> or <style> gets into dist/ anyway.
import { defineConfig, type DefaultTheme } from 'vitepress';
import fonts from '@runmu.sh/brand/fonts.json' with { type: 'json' };
import { writeLlmsIndex } from './llms';
import { externalizeDataUrls, shikiClasses, stripInlineForCsp } from './csp';

const guide: DefaultTheme.SidebarItem[] = [
  { text: 'Get started', items: [
    { text: 'What μClient is', link: '/guide/' },
    { text: 'Connect to your first world', link: '/guide/first-world' },
  ] },
  { text: 'Playing', items: [
    { text: 'Worlds and sessions', link: '/guide/worlds-and-sessions' },
    { text: 'Panels and layouts', link: '/guide/panels' },
    { text: 'Logs', link: '/guide/logs' },
    { text: 'Search', link: '/guide/search' },
    { text: 'Themes', link: '/guide/themes' },
  ] },
  { text: 'Account', items: [
    { text: 'Sign-in and devices', link: '/guide/account' },
  ] },
];

const automation: DefaultTheme.SidebarItem[] = [
  { text: 'Start here', items: [
    { text: 'What Lua is for', link: '/automation/' },
    { text: 'Your first trigger', link: '/automation/first-trigger' },
  ] },
  { text: 'Building blocks', items: [
    { text: 'Aliases', link: '/automation/aliases' },
    { text: 'Triggers', link: '/automation/triggers' },
    { text: 'Macros', link: '/automation/macros' },
    { text: 'GMCP and MSDP data', link: '/automation/gmcp' },
    { text: 'Talking to extensions (ext.emit)', link: '/automation/ext-emit' },
  ] },
  { text: 'Reference', items: [
    { text: 'Lua functions', link: '/reference/lua/' },
  ] },
];

const extensions: DefaultTheme.SidebarItem[] = [
  { text: 'Start here', items: [
    { text: 'What an extension is', link: '/extensions/' },
    { text: 'Build a panel in 10 minutes', link: '/extensions/quickstart' },
  ] },
  { text: 'The SDK', items: [
    { text: 'The manifest', link: '/extensions/manifest' },
    { text: 'Panels', link: '/extensions/panels' },
    { text: 'Commands and settings', link: '/extensions/commands-settings' },
    { text: 'Events, sessions and GMCP', link: '/extensions/events' },
    { text: 'Storage', link: '/extensions/storage' },
    { text: 'Protocols', link: '/extensions/protocols' },
    { text: 'Lines and input', link: '/extensions/lines-input' },
    { text: 'Surfaces', link: '/extensions/surfaces' },
    { text: 'WebAssembly helpers', link: '/extensions/wasm' },
    { text: 'Hot reload and tests', link: '/extensions/hot-reload' },
  ] },
  { text: 'Shipping', items: [
    { text: 'Publish to the marketplace', link: '/extensions/publish' },
    { text: 'Upgrade to SDK 1.12', link: '/extensions/migrating' },
  ] },
  { text: 'Reference', items: [
    { text: '@muclient/sdk', link: '/reference/sdk/' },
  ] },
];

const reference: DefaultTheme.SidebarItem[] = [
  { text: 'Reference', items: [
    { text: 'Overview', link: '/reference/' },
    { text: 'Lua functions', link: '/reference/lua/' },
    { text: '@muclient/sdk', link: '/reference/sdk/' },
    { text: 'Games API', link: '/reference/games-api/' },
    { text: 'Marketplace API', link: '/reference/marketplace-api/' },
    { text: 'Wire protocol', link: '/reference/protocol/' },
  ] },
  { text: 'Project', items: [
    { text: 'Changelog', link: '/reference/changelog' },
    { text: 'Deprecations', link: '/reference/deprecations' },
  ] },
];

export default defineConfig({
  title: 'μClient docs',
  titleTemplate: ':title · μClient docs',
  description: 'How to play, automate and extend μClient, the MU* client at runmu.sh.',
  lang: 'en',
  base: '/docs/',
  srcDir: 'content',
  outDir: 'dist',
  cleanUrls: true,
  lastUpdated: true,
  appearance: false,
  metaChunk: true,
  sitemap: { hostname: 'https://runmu.sh' },
  head: [
    ['link', { rel: 'icon', href: '/docs/favicon.svg', type: 'image/svg+xml' }],
    // Shiki's token colours as classes (csp.ts), not style attributes.
    ['link', { rel: 'stylesheet', href: '/docs/shiki.css' }],
    ...fonts.preconnect.map((href): [string, Record<string, string>] => ['link', { rel: 'preconnect', href, ...(href.includes('gstatic') ? { crossorigin: '' } : {}) }]),
    ['link', { rel: 'stylesheet', href: fonts.href }],
  ],
  themeConfig: {
    siteTitle: false,
    logo: undefined,
    // The section bar (Layout.vue draws it from this, not the default nav).
    nav: [
      { text: 'Guide', link: '/guide/', activeMatch: '^/guide/' },
      { text: 'Automation', link: '/automation/', activeMatch: '^/automation/' },
      { text: 'Extensions', link: '/extensions/', activeMatch: '^/extensions/' },
      { text: 'Reference', link: '/reference/', activeMatch: '^/reference/' },
    ],
    sidebar: {
      '/guide/': guide,
      '/automation/': automation,
      '/extensions/': extensions,
      '/reference/': reference,
    },
    outline: { level: [2, 3], label: 'On this page' },
    search: { provider: 'local' },
    editLink: {
      pattern: 'https://github.com/runmu-sh/docs/edit/main/content/:path',
      text: 'Suggest an edit',
    },
    lastUpdated: { text: 'Updated' },
    docFooter: { prev: 'Previous', next: 'Next' },
    socialLinks: [{ icon: 'github', link: 'https://github.com/runmu-sh/docs' }],
    footer: undefined,
  },
  markdown: {
    theme: 'github-dark-default',
    lineNumbers: false,
    codeTransformers: [shikiClasses.transformer],
  },
  // The default is `{ style: { position: 'relative' } }`, an inline style attribute (theme.css has the rule).
  contentProps: { class: 'vp-content' },
  vite: {
    resolve: { dedupe: ['vue'] },
    build: { assetsInlineLimit: 0 },
    plugins: [shikiClasses.plugin],
  },
  transformHtml: stripInlineForCsp,
  // The default navbar is off on every page: the brand's header and the section bar replace it
  // (theme/Layout.vue). The default theme reads this from frontmatter, so it is set here for all.
  transformPageData(page) {
    page.frontmatter.navbar = false;
  },
  async buildEnd(site) {
    await shikiClasses.write(site);
    await externalizeDataUrls(site);
    await writeLlmsIndex(site);
  },
});
