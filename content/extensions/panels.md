---
title: Panels
description: Register a dock panel in plain DOM or Vue, style it with the client's classes, choose where it opens, offer it only where it has data, badge it, and list it in the Views menu.
---

# Panels

A panel is a tab in the session's dock, next to the Terminal and the Channels. You register it with `mu.panels.register`, and the client calls your `mount` function each time the panel opens.

## 1. Register a panel

```ts
import { defineExtension } from '@muclient/sdk';

export default defineExtension({
  activate({ mu }) {
    const c = mu.ui.css;
    mu.panels.register({
      id: 'here',
      title: 'Here',
      defaultPosition: 'right-bottom',
      mount(el, { sid }) {
        el.innerHTML = `<div class="${c.secHead}">Here</div><p class="${c.glow}"></p><button class="${c.cmd}">look</button>`;
        const name = el.querySelector('p')!;
        el.querySelector('button')!.onclick = () => { if (sid) void mu.sessions.send('look', sid); };
        if (!sid) { name.textContent = 'No session'; return; }
        const off = mu.scene.watch((s) => { name.textContent = s.known ? s.title : 'No room yet'; }, sid);
        return off;
      },
    });
  },
});
```

The panel shows the current room with `mu.scene.watch` <Since v="1.4" />. `mount(el, ctx)` renders into `el` and may return a cleanup function. `ctx` has these fields.

| Field | |
|---|---|
| `sid` | The session whose workspace the panel is open in, or `null` |
| `worldId` | That session's world, or `null` |
| `params` | What `mu.panels.open(id, params)` passed, else `{}` |

The client empties `el` after your cleanup runs. Use the cleanup for what lives outside `el`, such as watchers, timers and entries in your own listener sets. Everything you registered through `mu` is disposed with the extension.

Panel ids share one registry with μClient's own panels and every other extension's. Registering an id that is taken throws, so prefix yours with your extension id.

## 2. Or mount a Vue component <Since v="1.1" />

`mu.panels.vue(component)` turns a component into a `mount` function. The component gets the props `sid`, `worldId` and `params`. Import `vue` as usual. The build keeps it external and the client supplies its own copy through the import map. The client has no SFC compiler, so write render functions with `h`.

```ts
import { defineExtension } from '@muclient/sdk';
import { defineComponent, h, onBeforeUnmount, ref } from 'vue';

export default defineExtension({
  activate({ mu }) {
    const c = mu.ui.css;
    const Here = defineComponent({
      props: { sid: { type: String, default: null }, worldId: { type: String, default: null }, params: { type: Object, default: () => ({}) } },
      setup(props) {
        const title = ref('No room yet');
        const off = props.sid ? mu.scene.watch((s) => { title.value = s.known ? s.title : 'No room yet'; }, props.sid) : null;
        onBeforeUnmount(() => off?.());
        return () => h('div', [h('div', { class: c.secHead }, 'Here'), h('p', { class: c.glow }, title.value)]);
      },
    });
    mu.panels.register({ id: 'here', title: 'Here', mount: mu.panels.vue(Here) });
  },
});
```

`npm create @runmu.sh/extension my-ext -- --ui vue` scaffolds this setup, with `vue` as a devDependency.

## 3. Style it

Use the class names in `mu.ui.css` for your controls, and the panel follows the active theme.

| Key | For |
|---|---|
| `btn`, `primary` | Buttons; `primary` is the highlighted one |
| `tool`, `chip` | A borderless `[ LABEL ]` command and a `■ LABEL` toggle |
| `inp` | Text inputs and selects |
| `secHead` | A section heading |
| `empty` | Dim placeholder text |
| `framed`, `badge`, `lamp`, `glow` | A frame, a badge, a status lamp, glowing text |
| `cmd`, `toggle`, `plate`, `count`, `field`, `row`, `label` <Since v="1.5" /> | The terminal primitives: command, toggle, status plate, counter, field, list row, label |
| `secClose`, `hlLine`, `onoff`, `placeholder`, `sq`, `warn`, `on`, `off`, `hot`, `dim`, `gold`, `ok` <Since v="1.12" /> | More of μClient's own classes (`sec-close`, `hl-line`, `onoff`, …), so code without Vue can match its panels |

For layout of your own, `mu.ui.style(css)` <Since v="1.1" /> adds a stylesheet and removes it when the extension is disposed. Since 1.12 the sheet sits in the CSS layer `@layer ext.<id>`, below μClient's own `mu` layer, and it reaches popped-out panels too. An unscoped rule no longer beats μClient's rules for the same element, so scope your selectors to your panels, `.ext-panel[data-ext="<id>"]`, or to a root class of your own. Take colours from the theme's variables (`var(--fg)`, `var(--fg-dim)`, `var(--bg-elev)`, `var(--accent-bright)`, `var(--border-bright)`). `mu.theme.cssVar('accent')` reads a variable's current value. Call `mu.ui.style` in `activate`, as with the other short snippets on this page:

```ts
mu.ui.style(`.ext-panel[data-ext="here"] .here-panel { padding: 8px 10px; color: var(--fg); background: var(--bg-elev); }`);
```

A dev extension gets a warning in its log for each rule that matches μClient's own elements outside your panels. For dialogs, menus and the ON/OFF plate, use the [shared components and dialogs](/extensions/surfaces) rather than your own.

## Where it opens

`defaultPosition` picks where a new panel lands. The default for an extension panel is `right-bottom`.

| Value | Opens |
|---|---|
| `left` | The main area, as a tab beside the Terminal |
| `right-top` | The right column, top (where the Scene and Media go) |
| `right-bottom` | The right column, bottom (where the Channels go) |
| `float` | A floating window over the dock, centred |

A panel joins the group of an open panel that shares its position. When there is none, the client splits one off. After that the player moves it where they like, and the layout is saved per world.

::: tip
In a workspace narrower than 720 px, as on a phone, a new panel opens as a tab in the active group. `float` still floats.
:::

## Singletons and instances

A panel is a singleton by default: one per session workspace. `mu.panels.open(id)` opens it, or brings it to the front when it is open already.

With `singleton: false`, each `mu.panels.open(id)` adds a new tab. Pass `params.instance` to name one: opening the same instance again focuses it. The panel reads the rest of `params` in `mount`.

```ts
import { defineExtension } from '@muclient/sdk';

export default defineExtension({
  activate({ mu }) {
    mu.panels.register({
      id: 'note', title: 'Note', singleton: false, defaultPosition: 'float',
      mount(el, { params }) { el.textContent = String(params.text ?? ''); },
    });
    mu.commands.register({
      id: 'note.pin', title: 'Note: pin a reminder',
      run: () => mu.panels.open('note', { instance: 'reminder', text: 'Feed the cat' }),
    });
  },
});
```

`mu.panels.close(id)` closes every open tab of that panel. `mu.panels.open(id, params, { title?, sid?, focus? })` <Since v="1.7" /> sets the tab title, picks the session's workspace, and with `focus: false` opens the tab without bringing it to the front.

## One per session

Each session has its own dock, so a panel open in two sessions is mounted twice, each with its own `ctx.sid`. Keep per-session data in `mu.sessions.each`, whose cleanup runs when the session closes, or in `mu.storage.session(sid)`, and read the entry for the `sid` you were mounted with. See [Sessions](/extensions/events#sessions).

With `perSession: false` <Since v="1.8" />, the panel follows the active session instead: one instance, whose `ctx.sid` is the session in front.

## The Views menu

Every registered panel is listed under **☰ → Views**, sorted by `order` (lower first, default 200) <Since v="1.4" />. The client's own panels are Terminal 0, Scene 10, Channels 20, Media 30, Feeds 50, Web page 210, Script editor 300, Logs 310, Session 320 and GMCP 330. The command palette (Ctrl+K) also lists **Open** and the panel's title in lower case for each panel, so the `here` panel gets **Open here**.

`inViewsMenu: false` <Since v="1.1" /> leaves a panel out of Views. Its palette entry stays. Change the title or the listing later with `mu.panels.update` <Since v="1.1" />, which also retitles the open tabs.

```ts
mu.panels.update('here', { title: 'Here (3)' });
mu.panels.update('here', { inViewsMenu: false });
```

To open a panel for the player the first time your data arrives, call `mu.panels.autoAdd(id, sid)` <Since v="1.1" />. It adds the panel once per world on each device, so a panel the player closed stays closed. The Scene extension does it on the first GMCP `Room` message:

```ts
mu.gmcp.on('Room', (_data, { sid }) => mu.panels.autoAdd('scene', sid));
```

Panels you declare in `contributes.panels` are listed before the extension starts. A saved layout keeps their tab with **Loading `<title>`…** until `register` replaces it. See [The manifest](/extensions/manifest#contributes).

## Offer it only where it has data <Since v="1.12" />

A panel for one game's package is clutter in every other world. `show` decides when the panel is offered:

```ts
mu.panels.register({ id: 'tickets', title: 'Tickets', show: 'auto', role: 'staff', mount });
mu.gmcp.on('Client.Tickets.List', (d, meta) => {
  mu.panels.touch('tickets', meta.sid);
  render(d);
});
```

| `show` | |
|---|---|
| `'always'` | The default. Listed in Views everywhere |
| `'auto'` | Kept out of Views until `mu.panels.touch(id, sid)` reports data for the session. Then it is listed, and added to the workspace once |
| `'never'` | Not offered until the player changes it |

μClient adds a **Show panel** row (auto, on, off) per world to your extension's Settings page, stored as `ext.<id>.<panel id>.enabled`. `role: 'staff'` lists the panel only for a character with that role (`SessionRef.roles`, which [`provideIdentity`](/extensions/events#sessions) sets).

## Badges <Since v="1.12" />

`mu.panels.badge(id, { count?, mention? }, sid?)` puts a count or a mention mark on the panel's tab. It adds to the session tab's and the world's unread count, and every client shows it. `null` clears it.

```ts
mu.panels.badge('tickets', { count: open.length, mention: open.some((t) => t.mine) }, sid);
```

## When a panel fails

When `mount` throws, the tab shows **`<title>` crashed · `<message>`** with a **Reload** button, and the rest of the dock keeps working. The error goes to the extension's **log** in **Extensions → Installed** and counts toward the three errors in a minute that disable the extension. Disabling or uninstalling the extension closes its panels.

## Keep state across a reload <Since v="1.2" />

A hot reload remounts your panel in the same tab. Give it `snapshot` and `restore` to carry state such as a draft or a scroll position into the new build. [Keep panel state](/extensions/hot-reload#keep-panel-state) shows how.

## Next

- [Commands and settings](/extensions/commands-settings): open your panel from the palette and give it options.
- [Events, sessions and GMCP](/extensions/events): the data a panel usually shows.
- [Surfaces](/extensions/surfaces): dialogs, menus and the shared components.
- [SDK reference](/reference/sdk/): `mu.panels`, `mu.ui` and `PanelSpec` in full.
