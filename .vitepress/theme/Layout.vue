<script setup lang="ts">
// The runmu.sh shell around VitePress's layout. SiteShell (header, footer) comes from
// @muclient/brand and is the same component runmu.sh's pages render, so the two cannot drift.
// Between the header and the default layout sits the section bar (Guide / Automation / Extensions /
// Reference, from themeConfig.nav) with the search box, in place of the default navbar, which
// theme.css hides. On the front page (layout: home) the section bar has no current section.
import { SiteShell } from '@muclient/brand';
import DefaultTheme from 'vitepress/theme-without-fonts';
import { VPNavBarSearch } from 'vitepress/theme-without-fonts';
import { useData, useRoute } from 'vitepress';
import { computed } from 'vue';

const { theme, site } = useData();
const route = useRoute();

// The route path without the base, as themeConfig.nav's activeMatch expects it.
const path = computed(() => {
  const base = site.value.base.replace(/\/$/, '');
  const p = route.path.startsWith(base) ? route.path.slice(base.length) : route.path;
  return p || '/';
});
type NavLink = { text: string; link: string; activeMatch?: string };
const sections = computed(() => ((theme.value.nav ?? []) as unknown[]).filter((n): n is NavLink => typeof n === 'object' && n !== null && 'link' in n));
const isCurrent = (n: NavLink) => (n.activeMatch ? new RegExp(n.activeMatch).test(path.value) : path.value === n.link);
const href = (n: NavLink) => `${site.value.base.replace(/\/$/, '')}${n.link}`;

// On runmu.sh the shell's links are same-origin ('' base); a docs dev server on another port
// points them at the production site. The web client is play.runmu.sh unless a <meta> says otherwise.
const siteBase = computed(() => (typeof location !== 'undefined' && location.port && location.port !== '80' && location.port !== '443' ? 'https://runmu.sh' : ''));
</script>

<template>
  <SiteShell section="docs" :site-base="siteBase">
    <div class="docs-sections">
      <div class="wrap">
        <nav class="sections" aria-label="Documentation sections">
          <a v-for="s in sections" :key="s.link" :href="href(s)" :aria-current="isCurrent(s) ? 'page' : undefined">{{ s.text }}</a>
        </nav>
        <VPNavBarSearch class="docs-search" />
      </div>
    </div>
    <DefaultTheme.Layout />
  </SiteShell>
</template>
