---
title: Surfaces
description: Use μClient's own dialogs, menus, palette, badges, alerts and toasts, files and network, safe HTML, the shared Vue components, themes, screen-reader regions and HUD slots, instead of building your own.
audience: extensions
---

# Surfaces <Since v="1.12" />

Use the host's dialogs, menus and palette rather than your own. They follow the theme, trap focus, close on Esc, work with a screen reader, and go away when your extension is disabled.

## Dialogs

```ts
if (await mu.ui.confirm({ title: 'Delete note?', confirm: 'Delete', danger: true })) remove();

const name = await mu.ui.prompt({ title: 'Name the room', validate: (v) => (v ? null : 'A name is required') });

const room = await mu.ui.pick({
  title: 'Go to', filter: true,
  items: rooms.map((r) => ({ label: r.name, hint: r.area, value: r.id })),
});

const m = mu.ui.modal({ title: 'Map', width: 'lg', mount: (el) => draw(el) });
await m.closed;
```

| Call | Resolves |
|---|---|
| `confirm({ title, body?, confirm?, danger?, everywhere? })` | `true`, or `false` on cancel or Esc |
| `prompt({ title, label?, value?, placeholder?, validate?, everywhere? })` | The text, or `null`. `validate` returns an error to show, or `null` |
| `pick({ title, items, filter?, everywhere? })` | The chosen item's `value`, or `null`. `filter` adds a filter field |
| `modal({ title, mount, width?, everywhere? })` | A handle with `close()` and `closed`. `width` is `sm`, `md` or `lg`. `mount` works like a panel's |
| `overlay({ id, mount, anchor? })` | A dispose function. A layer above the workspace that does not block it, at the `top`, `bottom` or `center` |

Dialogs open one at a time; later ones wait. One raised while your extension handles a game event opens only on the client that owns the session's effects, and the others resolve the cancel value. Pass `everywhere: true` for a question the player must answer wherever they are. A dialog open when your extension is disabled resolves the cancel value too.

## Safe HTML and DOM

Never set `innerHTML` from game or network text. `mu.ui.sanitize(html, profile)` returns a `DocumentFragment` cleaned by the host's allow-list: `'block'` (the default, for README-like text) or `'inline'` (`b i u em strong s code span br a`). Scripts, styles, handlers and non-http(s) links go.

`mu.ui.h(tag, attrs, ...children)`, also exported as `h`, builds DOM without HTML strings. An `on…` attribute with a function becomes a listener:

```ts
import { h } from '@muclient/sdk';

el.append(h('button', { class: mu.ui.css.cmd, onclick: go }, '› go'), mu.ui.sanitize(motd, 'inline'));
```

## Menus

```ts
mu.menus.add({ id: 'notes.export', slot: 'main', title: 'Export notes', run: exportNotes });

mu.menus.context({
  id: 'look', target: 'word',
  title: (t) => `Look at ${t.word}`,
  run: (t) => mu.sessions.send(`look ${t.word}`, t.sid),
});

mu.menus.target(rowEl, { kind: 'x-ticket', sid, data: { id: 12 } });
```

`menus.add` puts a row in a menu: `slot: 'main'` is the **☰** menu (with `section` `actions` or `app`, and an `icon` from μClient's glyph set), `'world'` the world menu, `'tab'` a session tab's menu, and `'panel:<id>'` the tab menu of one of your panels. Give it a `command` id or a `run` function, and optionally `order` and `when`.

`menus.context` adds an entry to the context menu of a target kind: `line`, `word`, `link`, `selection`, `channel`, `channel-message`, `scene-item`, `scene-exit`, `world`, `tab`, or your own `x-…` kind. `run` and a function `title` get the target. Core's own entries come first, then extensions' by `order` (default 1000). `when(target)` hides an entry. `menus.target(el, target)` marks an element of yours: right-click or long-press inside it opens that target's menu.

## Palette

```ts
mu.palette.provide({
  mode: 'rooms', prefix: '@', title: 'Rooms',
  items: async (query) => (await find(query)).map((r) => ({ id: r.id, label: r.name, hint: r.area, run: () => go(r) })),
});
mu.palette.verbs(sid, ['@stats', 'score']);
```

A provider with `mode: 'default'` adds to the main list of the Ctrl+K palette. Any other mode is reached by typing its `prefix`. `palette.verbs(sid, verbs)` adds verbs to the default list for that session's world, or for every world with `null`.

## Badges, alerts and toasts

```ts
mu.panels.badge('tickets', { count: 3 }, sid);
mu.notify.mention({ sid, title: 'Vex', body: 'paged you', key: `${meta.id}:page` });
mu.ui.toast('Note saved', undefined, { kind: 'notes', action: { label: 'undo', run: undo }, group: 'notes' });
```

| Call | |
|---|---|
| `panels.badge(id, { count?, mention? } \| null, sid?)` | A count or a mention mark on the panel's tab, added to the session tab's and the world's unread. It is state: every client shows it. `null` clears it |
| `notify.mention({ sid, title, body, key? })` | A mention, like a channel mention: badge, toast, sound and desktop notification per **Settings → Alerts**. With `key` it alerts once across the player's clients |
| `notify.alert({ sid?, title, body?, sound?, desktop?, key? })` | A toast with a sound (`'blip'`, `'none'` or a `MediaSpec` cue) and an optional desktop notification |
| `ui.toast(title, body?, opts?)` | A toast. `kind` is the small label above the title. `action` adds a button, `timeoutMs` keeps it 1.5 to 60 seconds, and three or more toasts of one `group` within 2 seconds collapse into one |

Sounds, toasts and notifications play on the client that owns the session's effects. A player who wants them everywhere turns on **Settings → Alerts → Alert on every device** on each device.

## Files and network

`mu.files.save({ name, type?, data })` downloads a file in the browser and opens the save dialog in the desktop app; it resolves `false` when cancelled. `mu.files.open({ accept?, multiple? })` resolves the picked `File`s, `[]` when cancelled. `mu.net.fetch(url, init?)` is `fetch` under the page's content security policy. Declare the `files` and `network` capabilities.

## Shared components

`@muclient/ui` holds μClient's own Vue components: `Modal`, `Dialog`, `Menu`, `OnOff` (the ON/OFF plate) and `SafeHtml`. At runtime it resolves through the import map, like `@muclient/sdk`, so keep it external in your bundle (the template's build does). For the type checker, add a shim:

```ts
// src/muclient-ui.d.ts
declare module '@muclient/ui' { export * from '@muclient/sdk/ui'; }
```

There is no button component: buttons and fields are the CSS primitives in `mu.ui.css`. Since 1.12 it adds `secClose`, `hlLine`, `onoff`, `placeholder`, `sq`, `warn`, `on`, `off`, `hot`, `dim`, `gold` and `ok`. See [Panels](/extensions/panels#_3-style-it).

## Themes

```ts
mu.theme.watch(({ id, tokens, reduceMotion }) => repaint(tokens));
mu.theme.register({ id: 'dusk', title: 'Dusk', tokens: { bg: '#14121a', /* … all 14 */ } });
```

`theme.watch(fn)` calls `fn` now and whenever the theme or reduce motion changes. `theme.register(spec)` adds a theme to **Settings → Visual**. It must fill all 14 tokens (`bg`, `bgElev`, `bgDeep`, `fg`, `fgDim`, `fgFaint`, `accent`, `accentBright`, `gold`, `alert`, `ok`, `border`, `borderBright`, `glow`) with hex colours, and `fg` and `fgDim` must reach 4.5:1 contrast on `bg` and `bgElev`, or it throws naming the failing pair. `ansi` sets the 16 terminal colours. A world using the theme falls back to the default when it is removed.

## Screen readers and the HUD

`mu.a11y.announce(text, { priority? })` speaks through μClient's live region (`polite`, batched with game output, or `assertive`). `mu.a11y.region(el, { name })` adds one of your panels or overlays to the F6 region cycle.

`mu.hud.mount({ id, slot, order?, mount })` draws in a HUD slot, `status`, `rail`, `top-left` or `top-right`, once per session in scope.

## Next

- [Panels](/extensions/panels): badges, `show` and styles in a panel.
- [Commands and settings](/extensions/commands-settings): actions, `when` and groups.
- [SDK reference](/reference/sdk/#mu-ui).
