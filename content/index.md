---
layout: home
title: μClient documentation
titleTemplate: false
hero:
  name: μClient docs
  text: Play, automate, extend.
  tagline: How to use the MU* client at runmu.sh, script it with Lua, and build extensions for it.
  actions:
    - theme: brand
      text: Connect to your first world
      link: /guide/first-world
    - theme: alt
      text: Build an extension
      link: /extensions/quickstart
---

<Cards>
  <Card eyebrow="Players" title="Guide" href="/guide/" go="Start playing">
    Worlds, sessions, panels, logs and themes: everything μClient does out of the box, and how to sign in on more than one device.
  </Card>
  <Card eyebrow="Power users" title="Automation" href="/automation/" go="Write your first trigger">
    Aliases, triggers and macros in Lua 5.4, with GMCP and MSDP data at hand. Runs in the backend, so it keeps working when your browser is closed.
  </Card>
  <Card eyebrow="Developers" title="Extensions" href="/extensions/" go="Build a panel">
    TypeScript extensions with panels, commands, settings and WebAssembly helpers, hot-reloaded while you work and published to the marketplace.
  </Card>
</Cards>

## A trigger in three lines

::: code-group

```lua [Lua trigger]
-- pattern: ^You enter (.+)\.$
ext.emit("map.enter", { room = matches[2] })
echo("Now in " .. matches[2])
```

```ts [Extension listening]
import { defineExtension } from '@muclient/sdk';

export default defineExtension({
  activate({ mu }) {
    mu.lua.on('map.enter', (data, session) => {
      const { room } = data as { room: string };
      mu.scene.set({ title: room }, session.sid);
    });
  },
});
```

:::

Lua is for what happens in the game: it can send, echo and toggle aliases and triggers, and it talks to extensions with `ext.emit`. Extensions are for what you see: panels, commands and settings in the client. [How the two fit together →](/automation/ext-emit)

## Reference

<Cards>
  <Card title="Lua functions" href="/reference/lua/">The whole scripting API, generated from the backend's own function table.</Card>
  <Card title="@muclient/sdk" href="/reference/sdk/">Every type and method of the extension SDK, with the version each appeared in.</Card>
  <Card title="APIs and protocol" href="/reference/">The games and marketplace REST APIs (OpenAPI) and the client–backend wire protocol.</Card>
</Cards>
