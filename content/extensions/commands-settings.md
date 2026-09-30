---
title: Commands and settings
description: Add commands to the palette with default keys, give your extension a Settings page, and read, write and watch its values per world.
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

## Where commands appear

- **The command palette.** Ctrl+K opens it. Your command is listed by its `title`, with its keys beside it.
- **Keys.** A default binding works as soon as the command registers. The player can rebind or clear it in **Settings → Keys**, where your command has a row like every other. While the player types in the command line, only bindings with Ctrl, Alt or an F-key work.

Pick defaults that the client does not use already: Ctrl+K (palette) and Ctrl+, (Settings) are taken. **Settings → Keys** lists every binding.

## Run a command

`mu.commands.run(id, arg?)` runs any registered command: yours, another extension's, or the client's. Each panel has one called `panel.open.<id>`, and `extensions.open` opens the Extensions window. Call it from `activate` or from a handler, with `mu` from the sample in step 1.

```ts
mu.commands.run('here.open');
mu.commands.run('extensions.open', 'installed');
```

An exception that `run` throws is written to the extension's **log** and counts toward the three errors in a minute that disable it. A rejected promise from an `async` `run` is not caught.

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
| `kind` | `toggle`, `range`, `select` or `text` |
| `options` | For `select`: `{ value, label }` pairs |
| `min`, `max`, `step`, `unit` | For `range`. `unit` is shown after the value (`14px`) |
| `hint` | Small text after the label |
| `group` | A heading the row sits under. Groups appear in the order of their first row |
| `scope` | `both` (default), `world` or `global` |

Without `kind`, the client picks one: `toggle` for a boolean default, `select` when there are `options`, `range` for a number with a `min`, else `text`. A `text` row with a number default takes numbers only.

Define settings before you read them. `get`, `set` and `watch` on a key that is not defined throw `setting "…" is not defined (mu.settings.define)`.

## Where settings appear

The page title is `title` (default your extension id). The player reaches it two ways:

- **☰ → Extensions → Installed**, then **settings** on your extension's card;
- from your code, with `mu.settings.open()`. Tie it to a command or a button in your panel.

The page hangs under the **Extensions** tile of Settings, so **Back** from it leads to **Extensions → Installed**. The switch at the top of Settings, **This world** or **All worlds**, picks the level the rows edit. A row that is `scope: 'global'` shows **all worlds only** when you hover it in **This world**.

Values follow the player's account to every device.

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
        const draw = () => { el.textContent = mu.settings.get<string>('heading', worldId); };
        draw();
        return mu.settings.watch('heading', draw);
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

`get(key, worldId?)` resolves for the active world when you leave `worldId` out, and for all worlds with `null`. Inside a panel, pass `ctx.worldId` to read for the session the panel belongs to.

`set(key, value, worldId?)` writes to `worldId` (default the active world) when the setting's scope allows a per-world value, and for all worlds otherwise. Pass `null` to write for all worlds.

`watch(key, fn)` calls `fn` with the new value whenever the value for the active world changes: the player edited it, your code set it, or the player switched to a world where it differs. It does not call `fn` at once, so read the current value with `get` first, as `draw()` does in the sample. It returns a dispose function. One you never call is disposed with the extension.

The scaffold's `src/index.ts` uses the same shape.

## Next

- [Panels](/extensions/panels): the panel your command opens.
- [The manifest](/extensions/manifest): declare commands in `contributes`.
- [SDK reference](/reference/sdk/): `CommandSpec`, `SettingSpec` and `mu.settings` in full.
