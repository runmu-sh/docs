---
title: Events, sessions and GMCP
description: React to sessions, GMCP and ext.emit from your Lua triggers; the event envelope and replay; send GMCP once across clients; share live values between your instances; and know when listeners are disposed.
---

# Events, sessions and GMCP

An extension hears the game through events: the sessions that open and close, the GMCP packages the game sends, and the events your aliases and triggers send with `ext.emit`. Every handler gets the session id, so one extension serves all your sessions at once.

## Listen for a GMCP package

```ts
import { defineExtension } from '@muclient/sdk';

export default defineExtension({
  activate({ mu }) {
    mu.gmcp.on('Room.Info', (room, meta) => {
      mu.log.info(meta.sid, meta.pkg, room.name);
    });
  },
});
```

`mu.gmcp.on(pkg, fn, opts?)` ignores case and matches `pkg` in one of two ways:

- **Exactly**: `'Char.Vitals'` gets `Char.Vitals` only.
- **As a namespace**: a bare name (`'Char'`) or a name ending in `.` (`'Char.'`) gets every package under it, such as `Char.Vitals` and `Char.Status`. Check `meta.pkg` in the handler. It holds the name as the game sent it.

The shorter snippets on this page run inside `activate` in the same way.

## The event envelope <Since v="1.8" />

The second argument of every `gmcp.on`, `lua.on`, `msdp.on`, `mcp.on` and `sessions.on` handler is an `EventMeta`, with the v1 fields (`sid`, `pkg`, `name`) alongside:

| Field | |
|---|---|
| `id` | Stable identity. The same event has the same id on every client: `<sid>:<seq>` for a server event, `<sid>:L<line>` for a log line |
| `sid`, `worldId` | The session and world it belongs to |
| `seq` | The backend's per-session sequence number, when it sends one |
| `ts` | Server time in ms for server events, local time otherwise |
| `origin` | Who caused it: `{ kind: 'game' }`, `'automation'`, or `'user'`, `'ext'` and `'core'` with the client's `conn` and `self` (this client) |
| `replay` | `true` when the event is delivered again: the GMCP snapshot on (re)connect, history, or an extension that activated late |
| `afterLine` <Since v="1.10" /> | GMCP only: the id of the last output line before this message |

### Replay

Handlers see replayed events so that state is right: an extension that activates while a session is open gets the session's last GMCP values with `replay: true`, and needs no hand-written catch-up. Effects are a different matter. `mu.media.play`, `mu.ui.toast`, `mu.sessions.send`, `mu.gmcp.send` with options, and `mu.panels.openWeb` do nothing while a replayed event is handled, unless you pass `{ onReplay: true }`. A toast for a tell from an hour ago is noise.

## Sessions <Since v="1.8" />

An extension sees the sessions **in scope**: those of worlds where it is enabled. It stays live while any of them is open, not only while its world is the active tab.

```ts
mu.sessions.each((s) => {
  const stop = mu.gmcp.watch('Char.Vitals', (v) => draw(s.id, v), { sid: s.id });
  return () => { stop(); forget(s.id); };
});
```

`each(setup)` runs `setup` for every session in scope, now and as they open. What it returns runs when that session leaves scope. Keep per-session state inside it, and pass `{ sid }` to the handlers you register there so each one hears one session.

| Call | |
|---|---|
| `active()` | The session in front, or `null` |
| `list()` | The sessions in scope |
| `all()` | Every session, in any world. Declare the `all-sessions` capability |
| `send(text, sid?)` | Send a command as if typed: separators and aliases apply. See [Lines and input](/extensions/lines-input#send-and-request) for the options form |
| `request(text, opts)` <Since v="1.11" /> | Send a command and capture the game's answer. See [Lines and input](/extensions/lines-input#send-and-request) |
| `echo(text, sid?)` | Show a line in that session's terminal only |
| `on('line', fn)` | Every new line from the game, as `fn(line, meta)`. Declare `read-output` |
| `on('switch', fn)` | The active session changed, as `fn(session)` (`null` when none) |
| `on('open', fn)` | A session came into scope: it opened, its world was enabled, or the extension activated while it was open (as a replay) |
| `on('state', fn)` | The link state changed. On the way to idle, `meta.reason` is `user`, `lost`, `failed` or `server`, and `meta.message` carries the game's `Core.Goodbye` text |
| `on('close', fn)` | A session left scope |
| `on('identity', fn)` | The character name or roles changed |
| `meta(sid?)` | What the HUD shows: `prompt`, `nowPlaying`, `location`, `latencyMs` and `links` (`home`, `help`). `null` out of scope |
| `watchMeta(fn, sid?)` | `meta` now and on every change |
| `provideIdentity(sid, { name?, roles? })` | Tell μClient who the character is, or which roles it has, from a game API you read |

A call without `sid` acts on the active session. A `SessionRef` has:

| Field | |
|---|---|
| `id` | The session id, the `sid` every handler gets |
| `worldId`, `worldName` | The world it belongs to |
| `state` | `'idle'`, `'connecting'`, `'connected'` or `'disconnecting'` |
| `character` | The character's name: the world's character-name setting, else GMCP `Char.Name`, `Char.Status` or `Char.Base`, else MSDP `CHARACTER_NAME`, else a provider. `''` when unknown |
| `roles` | Roles providers claimed, such as `staff`. They show or hide panels and commands (`role`, `when: 'role:staff'`) |
| `telnet` | The negotiated telnet options: `GMCP`, `MSDP`, `NAWS`, … |
| `attention` | This client owns the session's effects. See [Several clients on one session](#several-clients-on-one-session) |

## Read GMCP state

A package that arrived before your extension activated reaches `on` as a replay. To read it on demand, `mu.gmcp.state(pkg, sid?)` returns the session's state for it (default: the active session), or `undefined`. Since <Since v="1.10" /> this is the package's reduced state: `Char.Vitals` and other status packages merge field by field, `Char.Items` is a list per location, and message packages such as `Comm.Channel.Text` and `Client.Media.Play` keep none. State is cleared on a new connection.

```ts
mu.gmcp.watch('Char.Vitals', (v, meta) => {
  bar.value = Number(v?.hp);
}, { sid });
```

`watch(pkg, fn, { sid })` <Since v="1.10" /> calls `fn` with the state now (with `meta.replay: true`) and on every change. It is the GMCP equivalent of `mu.scene.watch`. `stateMeta(pkg, sid?)` returns the state with its envelope, so you can tell how old it is.

| Call | |
|---|---|
| `seen(pkg, sid?)` <Since v="1.11" /> | The game sent this package, or one under it, on this connection |
| `whenSeen(pkg, { sid?, timeoutMs })` <Since v="1.11" /> | Resolves `true` once it has, `false` after the timeout or when GMCP is off |
| `negotiated(sid?)` <Since v="1.11" /> | GMCP is on for the session's connection |
| `supported(pkg, sid?)` <Since v="1.10" /> | The version of `pkg` the backend advertises for the session (the highest any client declared), or `null` |

### Typed packages <Since v="1.10" />

`on`, `state`, `watch` and `request` take their data type from `GmcpPackages` in `@muclient/sdk/gmcp`, which already knows `Char.*`, `Room.*`, `Comm.Channel.*` and the other common packages. Add a game's own by declaration merging:

```ts
declare module '@muclient/sdk/gmcp' {
  interface GmcpPackages {
    'Client.Tickets.List': { tickets: Array<{ id: number; title: string }> };
  }
}
```

## Ask the game for a package <Since v="1.1" />

Many games send a package only after the client announces it in `Core.Supports`. Declare it in the manifest, and μClient announces it on every session where the extension is enabled, before the extension starts:

```json
"contributes": { "gmcp": ["Room 1", "Char.Items 1"] }
```

For a package you need only some of the time, call `mu.gmcp.supports(['Client.Tickets 1'])`. Dispose withdraws it.

The backend owns the list <Since v="1.10" />. It starts from `Core 1` and `Char 1`, counts the declarations of every client on the session, sends `Core.Supports.Add` for a package's first declaration and `Remove` for its last, and sends them again after a reconnect. Disposing on one device never withdraws a package another device still declares. The protocol adapters declare the packages they read, such as `Room 1` and `Comm.Channel 1`.

## Send GMCP <Since v="1.1" />

```ts
const ok = await mu.gmcp.send('Char.Items.Inv', {}, { sid, key: `${meta.id}:inv` });
```

`mu.gmcp.send(pkg, data?, sid | opts?)` goes to the active session unless you name one. The third argument is a session id, or <Since v="1.9" /> `{ sid?, key?, onReplay? }`. It resolves:

- `true` when the backend wrote the message, or when another client already sent the same `key`;
- `false` when the session is not connected, the game has not negotiated GMCP, the package name is not 1–128 characters of `A-Z a-z 0-9 . _ -`, the data is over 64 KB as JSON, the session is over 50 messages a second, or (with options) the event being handled is a replay;
- `'reserved'` <Since v="1.10" /> for a package only μClient sends: `Core.Hello`, `Core.Supports.*`, `Core.KeepAlive`, `Core.Ping` and `Char.Login*`. Nothing reaches the game, and the log says so once.

Declare `send-commands`.

### Ask and wait <Since v="1.10" />

```ts
const inv = await mu.gmcp.request('Char.Items.Inv', {}, {
  sid, expect: 'Char.Items.List', match: (d) => d.location === 'inv', timeoutMs: 3000,
});
```

`request` sends `pkg` and resolves with the next `expect` package that passes `match`. It asks once across the player's clients: a request with the same key waits for the answer to the first. `maxAgeMs` answers from state younger than that, without sending. It rejects with `Error('timeout')` after `timeoutMs` (default 5000), and with `Error('reserved')` for a reserved package.

## Talk to Lua

A trigger sends data with `ext.emit`, and the extension picks it up by name with `mu.lua.on`. The name matches exactly. In the other direction <Since v="1.10" />, `mu.lua.emit(name, data, { sid })` runs the handlers a startup script registered with `ext.on`.

::: code-group

```lua [Trigger]
-- pattern: ^You carve a mark: (.+)$
ext.emit("roomnotes.add", { text = matches[2] })

-- startup script
ext.on("roomnotes.say", function(data)
  send("say " .. data.text)
end)
```

```ts [Extension]
mu.lua.on('roomnotes.add', (data, { sid, name }) => {
  const { text } = data as { text: string };
  mu.sessions.echo(`${name}: ${text}`, sid);
});

await mu.lua.emit('roomnotes.say', { text: 'noted' }, { sid });
```

:::

An `ext.emit` reaches the extensions of every client attached to that session. The naming rules, the size cap and the rate limit are on [Talking to extensions](/automation/ext-emit).

## Several clients on one session <Since v="1.9" />

A player can have one session open in several tabs and on several devices. Every client runs your extension, so decide what should happen once.

**State runs everywhere. Effects run where the player is.** A sound, toast or notification caused by the game plays on one client: the one the player last focused or typed in, which owns the session's effects. When nobody is looking, the leader tab of each device plays it. `media.play`, `ui.toast` and `notify.*` follow this rule themselves. For an effect of your own, such as a WebAudio cue, ask:

```ts
if (mu.effects.owner(meta.sid)) beep();
mu.effects.watch((owner) => { indicator.hidden = !owner; }, sid);
```

**Sends that must happen once take a key.** With `key`, the game gets the send once account-wide, however many clients make it within 10 minutes. Derive the key from event ids, never from content. It is at most 200 bytes and scoped to your extension. `mu.sessions.send`, `mu.gmcp.send`, `mu.mcp.send` and `mu.actions.run` take one.

```ts
mu.sessions.on('line', (l, meta) => {
  if (/tells you/.test(l.text)) void mu.sessions.send('reply busy', { sid: meta.sid, key: `${meta.id}:reply` });
});
```

**Live values between your instances** go through a sync channel:

```ts
const draft = mu.sync.channel<string>('draft');          // session scope; or { scope: 'world' | 'account' }
draft.on((text, meta) => { box.value = text; });          // meta.origin.conn names the client
void draft.publish(box.value);
draft.last();                                              // the newest value from another client
```

A channel name is 1–100 of `A-Z a-z 0-9 . _ : -`. Values are encrypted, relayed and never stored, at most 64 KB each and 50 a second per connection. A channel never hears its own publishes. `all()` returns every other client's latest value, and `close()` stops it.

## Disposal

Each `on`, `watch`, `supports`, `each` and `stage` call returns a function that stops it. When the extension deactivates, μClient disposes everything registered through `mu`, so you call these functions only to stop early. That happens when it is disabled, uninstalled or reloaded, and when the last session of a world where it is enabled closes. Put your own timers and listeners in `subscriptions` and they are disposed too:

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

- [Protocols](/extensions/protocols): MSDP, MXP, MCP, the editor and the protocol adapters.
- [Lines and input](/extensions/lines-input): change lines, commands and completions.
- [Storage](/extensions/storage): keep data per world, per account or per session.
- [Hot reload and tests](/extensions/hot-reload): replay a recorded session.
