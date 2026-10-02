---
title: Commands and settings
description: Add commands to the palette with default keys and conditions, define configurable game actions, give your extension a Settings page, and read, write and watch its values per world and per device.
---

# Commands and settings

A command is an action the player runs from the command palette or a key. A setting is a value the player changes on your extension's own Settings page. Both are registered in `activate` and removed with the extension.

## 1. Register a command

```ts
import { defineExtension } from '@muclient/sdk';

export default defineExtension({
  activate({ mu }) {
    mu.panels.register({ id: 'here', title: 'Here', mount(el) { el.textContent = 'Here'; } });
    mu.commands.register({
      id: 'here.open',
      title: 'Here: open the panel',
      keys: ['Ctrl+Alt+H'],
      run: () => mu.panels.open('here'),
    });
  },
});
```

| Field | |
|---|---|
| `id` | Unique across the client. Prefix it with your extension id. Registering an id that is taken throws |
| `title` | The palette label. Start it with your extension's name so it reads well among the client's own |
| `keys` | Default key bindings, such as `Ctrl+Alt+H`, `F7`, `Ctrl+Shift+K` |
| `run(arg?)` | What it does. It may be `async` |
| `group` <Since v="1.12" /> | The group it is listed under in the palette and **Settings → Keys**, after your extension's name: `group: 'Look'` lists it as **Here: Look**. Without it, **Extension** |
| `when` <Since v="1.12" /> | When it is offered, for the active session: `'session'` (one is open), `'connected'`, `'role:staff'` (the character has the role), `'panel:here'` (that panel is open in the session's workspace), or a function of the session id |

## Where commands appear

- **The command palette.** Ctrl+K opens it. Your command is listed by its `title`, with its keys beside it.
- **Keys.** A default binding works as soon as the command registers. The player can rebind or clear it in **Settings → Keys**, where your command has a row like every other. While the player types in the command line, only bindings with Ctrl, Alt or an F-key work.

Pick defaults that the client does not use already: Ctrl+K (palette) and Ctrl+, (Settings) are taken. **Settings → Keys** lists every binding.

## Run a command

`mu.commands.run(id, arg?)` runs a command your extension or another one registered, or one of μClient's public commands (`PUBLIC_COMMANDS`):

| Id | |
|---|---|
| `settings.open` | Open Settings, at a page id when you pass one |
| `extensions.open` | Open the Extensions window, at a tab (`'installed'`) |
| `layout.save`, `layout.reset` | Save or reset the session's layout |
| `log.clear` | Clear the terminal |
| `palette.open` | Open the command palette |
| `input.focus` | Focus the command bar |

```ts
mu.commands.run('here.open');
mu.commands.run('extensions.open', 'installed');
```

Another core command id still runs in 1.x, and writes one warning per id to the extension's log: `commands.run('<id>'): not a public command. Running core commands other than the public ones is deprecated and stops working in SDK 2.0.` To open a panel, call `mu.panels.open`. See [Deprecations](/reference/deprecations).

An exception that `run` throws is written to the extension's **log** and counts toward the three errors in a minute that disable it. A rejected promise from an `async` `run` is not caught.

Commands you declare in `contributes.commands` are listed before the extension starts, and running one starts it. See [The manifest](/extensions/manifest#contributes).

## Actions <Since v="1.12" />

An action is a game verb as a bindable command. The player chooses per world how it reaches the game, so one extension serves games whose verbs differ:

```ts
mu.actions.define({
  id: 'tickets.claim', label: 'Claim', group: 'Tickets',
  via: 'command', command: '@ticket/claim {id}[ {note}]',
  args: { id: { label: 'Ticket' }, note: { label: 'Note' } },
});

const r = await mu.actions.run('tickets.claim', { id: '12' }, { sid, key: 'claim:12' });
```

| `via` | Sends |
|---|---|
| `command` | The `command` template as the player. `{name}` takes an argument, and a `[…]` part is kept only when every argument in it is non-empty. Nothing is escaped: the game parses the command |
| `gmcp` | The `[package, data]` that `gmcp(args)` returns. When GMCP cannot be sent, the command template is used |
| `ext` | Nothing. A handler registered with `mu.actions.handle` does the work |
| `none` | Nothing. The action is hidden in that world |

The action shows in the palette as **Tickets: Claim**, can be bound in **Settings → Keys**, and your Settings page gets rows for its `via` and command in each world. `run` calls the handlers first (one that returns `true` handles it), then the configured `via`, and resolves `'sent'`, `'handled'`, `'duplicate'` (another client sent the same `key`) or `'hidden'` (`via` is `none`, `ext` without a handler, or `when` fails). `mu.actions.visible(id, sid)` tells a panel whether to show the action's button. The handler gets the arguments and `{ sid, worldId, character }`.

## 2. Define settings <Since v="1.1" />

`mu.settings.define` gives your extension a page in Settings, drawn by the client from the schema like its own pages.

```ts
import { defineExtension } from '@muclient/sdk';

export default defineExtension({
  activate({ mu }) {
    mu.settings.define({
      title: 'Here',
      items: [
        { key: 'showArea', label: 'Show the area under the room name', default: true },
        { key: 'heading', label: 'Heading', default: 'Current room', hint: 'the line above the room name' },
        { key: 'size', label: 'Text size', default: 14, kind: 'range', min: 10, max: 24, step: 1, unit: 'px', group: 'Look' },
        {
          key: 'side', label: 'Exits', default: 'below', group: 'Look',
          options: [{ value: 'below', label: 'below the name' }, { value: 'hidden', label: 'hidden' }],
        },
        { key: 'lastRoom', label: 'Remember the last room', default: false, scope: 'global' },
      ],
    });
  },
});
```

| Field | |
|---|---|
| `key` | The name within your extension. It is stored as `ext.<id>.<key>` |
| `label` | The row's label |
| `default` | The value until the player changes it. Its type is the setting's type |
| `kind` | `toggle`, `range`, `select` or `text`, and <Since v="1.9" /> `color`, `key` (a key-combo capture), `json` (any JSON default) and `textarea` |
| `options` | For `select`: `{ value, label }` pairs |
| `min`, `max`, `step`, `unit` | For `range`. `unit` is shown after the value (`14px`) |
| `hint` | Small text after the label |
| `group` | A heading the row sits under. Groups appear in the order of their first row |
| `scope` | `both` (default), `world` or `global` |
| `sync` <Since v="1.9" /> | `account` (default): the value follows the player to every device. `device` keeps it on this device, for what depends on the hardware or the room the player sits in |
| `when` <Since v="1.9" /> | Show the row only while another of your settings has a value: `{ key: 'sound', equals: true }` |

Without `kind`, the client picks one: `toggle` for a boolean default, `select` when there are `options`, `range` for a number with a `min`, else `text`. A `text` row with a number default takes numbers only.

A key may contain `.` (`sound.volume`). One that names another extension's namespace (`ext.other.x`) is refused.

Define settings before you read them. `get`, `set` and `watch` on a key that is not defined throw `setting "…" is not defined (mu.settings.define)`.

## Where settings appear

The page title is `title` (default your extension id). The player reaches it two ways:

- **☰ → Extensions → Installed**, then **settings** on your extension's card;
- from your code, with `mu.settings.open()`. Tie it to a command or a button in your panel.

The page hangs under the **Extensions** tile of Settings, so **Back** from it leads to **Extensions → Installed**. The switch at the top of Settings, **This world** or **All worlds**, picks the level the rows edit. A row that is `scope: 'global'` shows **all worlds only** when you hover it in **This world**.

Values follow the player's account to every device, except `sync: 'device'` rows. Two devices that change one value resolve by the later write.

### More than rows <Since v="1.9" />

The schema takes two more keys:

- `component`: mounted below the generated rows, like a panel's `mount`, for an editor a schema cannot express.
- `sections`: rows of yours on a core page, `[{ page, title, keys }]`, where `page` is `visual`, `effects`, `text`, `audio`, `alerts`, `access` or `input`.

```ts
mu.settings.define({
  items: [{ key: 'sound', label: 'Play sounds', default: true, sync: 'device' }],
  sections: [{ page: 'alerts', title: 'Here', keys: ['sound'] }],
});
```

A settings schema can also live in the manifest, as `contributes.settings`. The page then renders before the extension starts.

## Scope

| `scope` | Stored | Read as |
|---|---|---|
| `both` | Per world, and for all worlds | The world's value, else the all-worlds value, else `default` |
| `world` | Per world | The world's value, else `default` |
| `global` | For all worlds | The all-worlds value, else `default` |

## 3. Read, write and watch

```ts
import { defineExtension } from '@muclient/sdk';

export default defineExtension({
  activate({ mu }) {
    mu.settings.define({
      title: 'Here',
      items: [{ key: 'heading', label: 'Heading', default: 'Current room' }],
    });
    mu.panels.register({
      id: 'here', title: 'Here',
      mount(el, { worldId }) {
        return mu.settings.watch<string>('heading', (v) => { el.textContent = v; }, { worldId });
      },
    });
    mu.commands.register({
      id: 'here.short', title: 'Here: short heading',
      run: () => mu.settings.set('heading', 'Here'),
    });
    mu.commands.register({ id: 'here.settings', title: 'Here: settings', run: () => mu.settings.open() });
  },
});
```

`get(key, at?)` resolves for the active world when you leave `at` out, and for all worlds with `null`. `at` is a world id, or <Since v="1.9" /> `{ worldId }` or `{ sid }` (that session's world). Inside a panel, pass `ctx.worldId` to read for the session the panel belongs to.

`set(key, value, worldId?)` writes to `worldId` (default the active world) when the setting's scope allows a per-world value, and for all worlds otherwise. Pass `null` to write for all worlds.

`watch(key, fn, opts?)` calls `fn(value, meta)` with the current value at once, with `meta.replay: true` <Since v="1.9" />, and again whenever it changes: the player edited it here or on another device (`meta.origin.self` is false then), your code set it, or the player switched to a world where it differs. Without options it follows the active world; `{ worldId }` or `{ sid }` pins it. It returns a dispose function. One you never call is disposed with the extension.

::: warning
Before 1.9, `watch` did not call `fn` at once. Code that calls `get` and then `watch` now draws twice, which is harmless, and can drop the `get`.
:::

## Core preferences <Since v="1.9" />

`mu.prefs` reads some of the player's own settings, under names that stay stable: `a11y.reduceMotion`, `a11y.screenReader`, `a11y.speak`, `effects.calm`, `effects.glow`, `theme.id`, `audio.volume` (0 to 1), `audio.muted`, `text.fontSize` (px), `text.fontFamily` and `locale`. They are read-only. `watch` calls `fn` at once and on every change.

```ts
mu.prefs.watch('a11y.reduceMotion', (on) => { if (on) stopAnimation(); else startAnimation(); });
```

For looks, prefer CSS: theme variables, and the `data-calm` and `data-theme` attributes on `<html>`.

The scaffold's `src/index.ts` uses the same shape.

## Next

- [Panels](/extensions/panels): the panel your command opens.
- [The manifest](/extensions/manifest): declare commands and settings in `contributes`.
- [Storage](/extensions/storage): data your extension keeps, rather than values the player edits.
- [SDK reference](/reference/sdk/): `CommandSpec`, `SettingSpec` and `mu.settings` in full.
