---
title: Lines and input
description: Change game lines in phases with LineEdit (classify, highlight, link, replace, route), route lines to your own targets, read past lines, run stages on the player's commands, add Tab completions and macros, and send or capture commands.
audience: extensions
---

# Lines and input

Two pipelines carry text through μClient. The **line host** runs every line from the game through phased stages before the terminal draws it. The **input host** runs every command the player sends through stages before it reaches the game. Your extension adds stages to both.

## Line phases <Since v="1.11" />

```ts
import { defineExtension } from '@muclient/sdk';

export default defineExtension({
  activate({ mu }) {
    mu.lines.stage({
      id: 'friends', phase: 'highlight',
      run(line) { line.highlight(/\bBob\b/, { fg: 'gold', bold: true }); },
    });
  },
});
```

Phases run in this order, and each allows some `LineEdit` calls. A call the phase does not allow throws, and counts as a crash.

| Phase | Allows | For |
|---|---|---|
| `protocol` | `replace`, `gag` | Cutting protocol markup out of a line (the MSP adapter is one) |
| `parse` | `classify`, `gag` | Reading structure out of a line |
| `classify` | `classify` | Setting the line's category |
| `transform` | `replace`, `insert`, `link`, `highlight`, `rowClass`, `annotate` | Changing the text |
| `highlight` | `highlight`, `rowClass`, `annotate` | Styling without changing the text |
| `route` | `gag`, `copyTo`, `moveTo`, `after` | Sending the line elsewhere |
| `observe` | nothing | Reading the result |

Within a phase, stages run by `order` (default 0), then by extension id. A stage that changes game text (`transform` or `route`) must be listed in the manifest, and the install prompt then says the extension changes game text:

```json
"contributes": { "linePhases": ["transform", "highlight"] }
```

A stage that takes more than 50 ms a line on 20 lines in a row is suspended for that session. A toast and the extension's log say so, and **resume** on its card in **Extensions → Installed** starts it again. Lines over 8 ms are logged.

### LineEdit

A stage's `run(line, ctx)` gets a `LineEdit`. Reading is always allowed: `text`, `kind`, `category`, `spans` (the rendered runs with their offsets in `text`), `media`, `gmcp` (the packages that arrived right after the line), `backlog`, `replay` and `meta`. `ctx` has `sid`, `worldId`, `phase` and `meta`.

| Call | |
|---|---|
| `classify(category)` | `speech`, `pose`, `combat`, `comms`, `look` or `system` |
| `highlight(range, style)` | Style a `{ start, end }` range, every match of a RegExp, or `'line'` |
| `link(range, link)` | Make text a link: `{ send }` sends a command through the input pipeline, `{ href }` opens an http(s) page, `prompt: true` puts the command in the input box instead, `hint` is the tooltip |
| `replace(range, text, style?)` | Replace a range or every match. Offsets of later spans stay right |
| `insert(at, text, style?)` | Insert text |
| `annotate(text, style?)` | A dim note after the line's text, not part of `text` |
| `rowClass(cls)` | `hl-gold`, `hl-alert`, `hl-accent`, `mention`, or your own `ext-<id>-…` class |
| `gag()` | Drop the line. Later stages do not see it |
| `copyTo(target)`, `moveTo(target)` | Hand the line to the edits router (see [Line routing](#line-routing)) as a copy, or instead of showing it in the terminal. With no edits router, `copyTo` does nothing and `moveTo` keeps the line in the terminal |
| `after({ text, style?, kind? })` | Add a local line after this one |

Keep RegExps static: each is compiled once.

### Styles and links

Colours are theme tokens, never free colours, so lines follow the player's theme: `gold`, `accent`, `accent-bright`, `alert`, `ok`, `fg`, `fg-dim` and `fg-faint` (exported as `THEME_TOKENS`). A `SpanStyle` is `{ fg?, bg?, bold?, italic?, underline?, strike? }`.

```ts
mu.lines.stage({
  id: 'look-links', phase: 'transform',
  run(line) {
    for (const m of line.text.matchAll(/\b(north|south|east|west)\b/g)) {
      line.link({ start: m.index, end: m.index + m[0].length }, { send: m[0], hint: 'walk' });
    }
  },
});
```

## Line routing <Since v="1.14" />

A router sends matching lines to targets your extension shows, such as a feed panel. The rules are one of your own settings, so the player edits them on your page and they leave with your extension.

```ts
import type { FeedLineView } from '@muclient/sdk';

mu.settings.define({
  title: 'Feeds',
  items: [{ key: 'routes', label: 'Routes', kind: 'json', scope: 'world', default: [] }],
});

const store = new Map<string, FeedLineView[]>();
mu.lines.route({
  id: 'feeds', rules: 'routes', edits: true,
  deliver(target, line, ctx) {
    const key = `${ctx.sid}:${target}`;
    store.set(key, [...(store.get(key) ?? []), line]);
  },
});
```

`RouteSpec`:

| Field | |
|---|---|
| `id` | Unique within your extension |
| `rules` | The key of your `kind: 'json'` setting (scope `world` or `both`) that holds `RouteRule[]`. It is read for the session's world. A key that is not a defined json setting throws |
| `deliver(target, line, ctx)` | Called once per matched target with a `FeedLineView` and `ctx: { sid, worldId, meta, move, rule? }`. `rule` is the rule's id, absent for a `copyTo`/`moveTo` |
| `edits` | Also receive every extension's and trigger's `LineEdit.copyTo` and `moveTo`. One router holds this. A second is refused with a warning and routes its own rules only |

A `RouteRule` is `{ id, pattern, target, move?, enabled? }`. `pattern` is plain text (a substring, any case) or `/re/flags` (flags `i m s u`, default `i`).

Routing runs after the Triggers gags, on every line except echoes, backlog lines included and history lines never. When a matching `move` rule's delivery succeeds, the line is hidden from the terminal. A `deliver` that throws counts as a crash of your extension, and the line stays. Dispose, or deactivation, stops the routing. `mu.lines.route` needs the `read-output` capability.

For a rule editor, `mu.lines.testRoutes(text, rules)` runs rules over one line as the host would and returns `{ targets, move }` (a "Try it" box), and `mu.lines.patternError(pattern)` returns why a pattern does not compile (an unknown flag, an invalid regex, a pattern that matches every line), or `''`.

::: tip
The first router with `edits: true` gets a one-time copy of every world's core `rules.feeds` rules into its rules setting, with `label` renamed to `target`. Do not also set `migrateFrom: 'rules.feeds'` on that setting. `mu.feeds` and `FeedsView` are deprecated; keep routed lines in your extension. See [Deprecations](/reference/deprecations).
:::

### Backlog and history

Backlog and history lines go through every phase too, so they look the same, but their effects do not run. The `observe` phase skips them unless the stage sets `backlog: true`.

| Call | |
|---|---|
| `mu.lines.recent(sid, { limit?, before? })` | The lines this client holds, oldest first (default the last 100) |
| `mu.lines.search(sid, query, { limit? })` | Held lines that contain a string (any case) or match a RegExp, newest first |
| `mu.lines.history(sid, { before, limit })` | Older lines from the backend's log, at most 1000 |

### The v1 form

`mu.lines.stage({ id, order?, run(line, ctx) })` without a `phase` still works. It is an `observe` stage that may still `gag`, `after`, and assign `category` and `rowCls`. Its `order` is clamped to 300 or more.

## Input stages <Since v="1.11" />

Every command, typed or from a macro, the palette, the compose bar, a link or an extension, goes through the input host:

```ts
mu.input.stage({
  id: 'speedwalk', phase: 'expand', order: 100,
  run(cmd) {
    const m = /^(\d+)([nsew])$/.exec(cmd.text);
    if (m) cmd.expand(Array(Number(m[1])).fill(m[2]));
  },
});

mu.input.stage({
  id: 'quit', phase: 'guard',
  async run(cmd) {
    if (cmd.text === 'quit' && !(await mu.ui.confirm({ title: 'Quit the game?' }))) cmd.swallow('Quit cancelled.');
  },
});
```

| Phase | Allows | |
|---|---|---|
| `expand` | `expand`, `replace`, `echo` | One entry becomes several (at most 100). Core's `;` separator is an expand stage at order 0, and quick-rule aliases one at 200, so `3n;look` works and an alias applies to each step |
| `rewrite` | `replace`, `echo` | Change the text |
| `guard` | `swallow`, `echo` | Stop a command. The reason shows as a dim line. A guard may be `async`: the command waits, 30 seconds at most, then is swallowed with a message |
| `observe` | nothing | Read what is sent |

`cmd.source` says where the entry came from: `cmd`, `macro`, `palette`, `compose`, `link` or `ext:<id>`. `cmd.echo(null)` sends without an echo, for a password.

## Completions and macros <Since v="1.11" />

```ts
mu.input.completions({
  id: 'items', priority: 15,
  provide: ({ word }) => inventory.filter((i) => i.startsWith(word)).map((text) => ({ text, kind: 'item' })),
});

mu.macros.provide({ id: 'heal', label: 'Heal', keys: ['F5'], run: () => mu.sessions.send('cast heal') });
```

Tab completion merges every provider by `priority` (higher first; core's history is 20 and the Scene's names 10), then by recency, and drops duplicates. `provide` gets `sid`, `text`, `cursor` and the `word` being completed. A macro shows in the hotbar and in **Settings → Macros**, marked as your extension's. `mu.input.history(sid?, { limit? })` reads this device's command history for the world, newest first. `mu.input.fill(text, { sid?, select? })` puts text in the command bar without sending it, and `mu.input.focus(sid?)` focuses it.

## Send and request

`mu.sessions.send(text, sid?)` sends a command as if typed, through the input stages. With options <Since v="1.11" />, it resolves what happened:

```ts
const r = await mu.sessions.send('@who', { sid, raw: true, echo: false });   // 'sent' | 'duplicate' | 'refused'
```

`raw: true` skips the input stages (no separator, no aliases). `echo: false` shows no echo and adds nothing to the history. `key` sends once across the player's clients. `refused` means nothing was sent: no session, a guard swallowed it, or the event being handled was a replay.

`mu.sessions.request` <Since v="1.11" /> sends a command and captures the game's answer, hidden from the terminal:

```ts
const lines = await mu.sessions.request('@tickets', { sid, start: /^=== YOUR/, until: /^\s*q: Quit/ });
```

| Option | |
|---|---|
| `until` | A RegExp that ends the capture on the line it matches, or a function of each line returning `'more'`, `'done'` or `'skip'` |
| `start` | Ignore lines before one that matches |
| `gag` | Hide the captured lines (default `true`) |
| `timeoutMs` | Default 5000. A timeout rejects with a `RequestTimeout` error whose `partial` holds what was captured |
| `key` | Only the client whose send went through captures. The others resolve `null` |
| `raw`, `sid` | As for `send` |

Requests on one session queue, and the player's own commands are not blocked. Both calls need the `send-commands` capability.

## Next

- [Surfaces](/extensions/surfaces): the dialogs a guard stage can await.
- [Protocols](/extensions/protocols): MXP elements and spans.
- [Commands and settings](/extensions/commands-settings): the Settings page that holds your rules.
- [SDK reference](/reference/sdk/#mu-lines).
