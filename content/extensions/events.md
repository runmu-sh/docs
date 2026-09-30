---
title: GMCP and Lua events
description: React to GMCP from the game and to ext.emit from your Lua triggers, send GMCP back, and know when listeners are disposed.
---

# GMCP and Lua events

An extension hears the game in two ways: the GMCP packages the game sends, and the events your aliases and triggers send with `ext.emit`. Every listener gets the session id, so one extension serves all your sessions at once.

## Listen for a GMCP package

```ts
import { defineExtension } from '@muclient/sdk';

export default defineExtension({
  activate({ mu }) {
    mu.gmcp.on('Room.Info', (data, { sid, pkg }) => {
      const room = data as { name?: string };
      mu.log.info(sid, pkg, room.name);
    });
  },
});
```

`mu.gmcp.on(pkg, fn)` ignores case and matches `pkg` in one of two ways:

- **Exactly**: `'Char.Vitals'` gets `Char.Vitals` only.
- **As a namespace**: a bare name (`'Char'`) or a name ending in `.` (`'Char.'`) gets every package under it, such as `Char.Vitals` and `Char.Status`. Check `pkg` in the handler. It holds the name as the game sent it.

The shorter snippets on this page run inside `activate` in the same way.

## Read the last value

A package that arrived before your extension activated never reaches `on`. `mu.gmcp.state(pkg, sid?)` returns the last payload a session received for it (default: the active session), or `undefined`. It looks the name up exactly as the game spelled it.

```ts
for (const s of mu.sessions.list()) {
  const vitals = mu.gmcp.state('Char.Vitals', s.id);
  if (vitals) mu.log.info(s.worldName, vitals);
}
```

## Ask the game for a package <Since v="1.1" />

Many games send a package only after the client announces it:

```ts
mu.gmcp.supports(['Room 1', 'Char 1']);
```

This sends `Core.Supports.Add` to every connected session of the active world, and to each session of that world that connects later. When the game has not negotiated GMCP yet, it tries again after 0.5, 1, 2, 4 and 8 seconds. On dispose it sends `Core.Supports.Remove` with the same names, without the version numbers.

## Send GMCP <Since v="1.1" />

```ts
mu.gmcp.send('Char.Items.Inv').then((ok) => {
  if (!ok) mu.log.warn('GMCP not sent');
});
```

`mu.gmcp.send(pkg, data?, sid?)` goes to the active session unless you pass `sid`. Without `data` it sends `{}`. It never throws. It resolves `true` when the backend wrote the message, and `false` when the session is not connected, the game has not negotiated GMCP, the package name is not 1–128 characters of `A-Z a-z 0-9 . _ -`, the data is over 64 KB as JSON, or the session is over 50 messages a second.

## Receive events from Lua

A trigger sends data with `ext.emit`, and the extension picks it up by name with `mu.lua.on`. The name matches exactly.

::: code-group

```lua [Trigger]
-- pattern: ^You carve a mark: (.+)$
ext.emit("roomnotes.add", { text = matches[2] })
```

```ts [Extension]
mu.lua.on('roomnotes.add', (data, { sid, name }) => {
  const { text } = data as { text: string };
  mu.sessions.echo(`${name}: ${text}`, sid);
});
```

:::

The event reaches the extensions of every client attached to that session. The naming rules, the size cap and the rate limit are on [Talking to extensions](/automation/ext-emit).

## Sessions

`mu.sessions` describes the sessions this client can see. A session is a `SessionRef`:

| Field | |
|---|---|
| `id` | The session id, the `sid` every handler gets |
| `worldId`, `worldName` | The world it belongs to |
| `state` | `'idle'`, `'connecting'`, `'connected'` or `'disconnecting'` |

| Call | |
|---|---|
| `active()` | The session in front, or `null` |
| `list()` | All sessions |
| `send(text, sid?)` | Send a command as if typed: separators and aliases apply |
| `echo(text, sid?)` | Show a line in that session's terminal only |
| `on('line', fn)` | Every new line from the game, as `fn(line, { sid })` |
| `on('switch', fn)` | The active session changed, as `fn(session)` (`null` when none) |

A call without `sid` acts on the active session.

## Disposal

Each `on`, `supports` and `mu.lines.stage` call returns a function that stops it. When the extension deactivates, μClient disposes everything registered through `mu`, so you call these functions only to stop early. That happens when it is disabled, uninstalled or reloaded, and when you switch to a world where it is not enabled. Put your own timers and listeners in `subscriptions` and they are disposed too:

```ts
import { defineExtension } from '@muclient/sdk';

export default defineExtension({
  activate({ mu, subscriptions }) {
    const stop = mu.gmcp.on('Char.Vitals', () => mu.log.info('vitals'));
    const timer = setInterval(() => mu.log.info(mu.gmcp.state('Char.Vitals')), 60_000);
    subscriptions.push(() => clearInterval(timer));
    mu.commands.register({ id: 'demo.quiet', title: 'Demo: stop logging vitals', run: stop });
  },
});
```

A handler that throws is caught and written to the extension's log (**log** on its card in **Extensions → Installed**). Three errors within a minute disable the extension, and a toast says so.

## Next

- [Panels](/extensions/panels): show what the events carry.
- [Commands and settings](/extensions/commands-settings).
- [Hot reload](/extensions/hot-reload): what happens to listeners when you save.
