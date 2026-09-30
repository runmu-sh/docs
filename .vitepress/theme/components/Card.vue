<script setup lang="ts">
// One linked card: an eyebrow (the audience), a title, a line of text, and the call to action.
import { withBase } from 'vitepress';

defineProps<{
  title: string;
  /** The page, site-relative (`/guide/first-world`); an absolute URL is left alone. */
  href: string;
  eyebrow?: string;
  /** The call to action (default "Read"). */
  go?: string;
}>();
const resolve = (href: string) => (/^https?:/.test(href) ? href : withBase(href));
</script>

<template>
  <a class="card" :href="resolve(href)">
    <span v-if="eyebrow" class="card-eyebrow">{{ eyebrow }}</span>
    <h3>{{ title }}</h3>
    <p><slot /></p>
    <span class="card-go">{{ go ?? 'Read' }} →</span>
  </a>
</template>
