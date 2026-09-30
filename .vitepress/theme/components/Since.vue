<script setup lang="ts">
// "Since 1.4": the version an SDK member or Lua function appeared in, next to its heading. The
// values come from the `@since` tags in @muclient/sdk and the backend's function table.
defineProps<{ v: string; what?: string }>();
</script>

<template>
  <span class="since" :title="`${what ?? 'Since SDK'} ${v}`">{{ what ? `${what} ` : '' }}{{ v }}</span>
</template>
