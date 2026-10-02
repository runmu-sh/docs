---
title: Protocols
description: MSDP, MXP, telnet and MSSP; feeding the Scene and Channels from your own protocol; MCP 2.1 on MOO worlds and the editor surface; the bundled protocol adapters, world packs and the GMCP inspector.
audience: extensions
---

# Protocols

μClient's core reads no game protocol for you. Bundled **protocol adapters** read GMCP, MSDP, MSP, MXP media and MCP, and feed the Scene, Channels and Media models through the same SDK your extension uses. Most extensions read those models (`mu.scene`, `mu.channels`, `mu.media`) and never touch a raw package. This page covers the rest: the protocols themselves, for an extension that speaks one.

GMCP has its own section on [Events, sessions and GMCP](/extensions/events#listen-for-a-gmcp-package).

## MSDP <Since v="1.10" />

```ts
const off = mu.msdp.report(['HEALTH', 'HEALTH_MAX'], sid);
mu.msdp.on('HEALTH', (value, meta) => { hp = Number(value); }, { sid });
```

| Call | |
|---|---|
| `on(variable, fn, { sid }?)` | A variable exactly (`'ROOM_NAME'`), or every variable with a prefix ending in `_` (`'ROOM_'`), in any case |
| `state(variable, sid?)` | The variable's last value |
| `report(variables, sid?)` | Send `REPORT`. The backend counts reports across every client and sends `UNREPORT` when the last one goes. Dispose withdraws yours |
| `send(variable, sid?)` | Send `SEND` now. Resolves `false` when MSDP is not negotiated |
| `list(kind, sid?)` | Send `LIST` (`COMMANDS`, `REPORTABLE_VARIABLES`, …) and resolve with the answer, `[]` on a timeout |

Variables you always need go in the manifest as `"contributes": { "msdp": ["ROOM_NAME"] }`, and μClient reports them for you. MSDP arrives as GMCP packages named `MSDP.<VAR>`, so `mu.gmcp.on('MSDP.')` works too.

## MXP <Since v="1.10" />

Core renders MXP formatting, `SEND` and `A`. Everything else is yours to claim:

```ts
mu.mxp.on('element', (el) => { if (el.tag === 'sound') play(el.attrs.fname); });
mu.mxp.define('hp', { render: (attrs, text) => ({ text, style: { fg: 'alert', bold: true } }) });
```

`on('element', fn)` reports custom and media elements (`<SOUND>`, `<IMAGE>`, `!ELEMENT`, unknown tags) with their lower-cased `tag`, `attrs`, `text` and the `line` they were in. `define(tag, { render })` claims a custom element and returns the spans to show in its place, or `null` for nothing. Spans are text with a [theme-token style](/extensions/lines-input#styles-and-links) and an optional link, never HTML. An element nobody claims is never shown as literal text.

## Telnet and MSSP <Since v="1.10" />

`mu.telnet.options(sid?)` lists the negotiated options, such as `['GMCP', 'MSDP', 'NAWS']`. `mu.mssp(sid?)` returns the game's MSSP server info, read once per connection (`{ NAME: 'Underspire', PLAYERS: '12', … }`), or `null`.

## Feed the Scene and Channels <Since v="1.10" />

A game with its own protocol can feed the core models. The Scene, Channels and HUD panels then show it like any other game's:

```ts
const off = mu.scene.provide(sid, { title: 'Chapel of Ash', exits: ['n', 'd'] }, { priority: 10 });
mu.channels.provide(sid, {
  list: [{ name: 'ooc', caption: 'Out of character', command: 'ooc' }],
  message: { channel: 'ooc', sender: 'Vex', text: 'hi' },
});
```

For each Scene field the provider with the highest `priority` wins, and disposing one hands the field back to the next. `channels.provide` takes a channel `list` (which creates channels and sets their caption and command), one `message`, or `players` per channel. `mu.media.setBase(url, sid?)` sets the base URL cue names resolve against, and `mu.media.showImage({ url, caption?, line? }, sid?)` adds a picture to the session's gallery, inline under `line` when you give one.

## MCP 2.1 <Since v="1.10" />

On MOO worlds the backend speaks MCP 2.1: the handshake and its authentication key, `mcp-negotiate`, multiline values, cords and the core packages. Your extension sees decoded messages and never the key. Declare the packages you handle, and they are negotiated while the extension is live in a session:

```json
"contributes": {
  "mcp": [{ "package": "dns-com-example-weather", "min": "1.0", "max": "1.0" }]
}
```

```ts
mu.mcp.on('dns-com-example-weather', (args, meta) => show(meta.sid, args.sky));
const r = await mu.mcp.send('dns-com-example-weather-get', { where: 'here' }, { sid, key: `${meta.id}:wx` });
```

| Call | |
|---|---|
| `on(message, fn, { sid }?)` | A message exactly, or every message with a prefix ending in `-` (`'dns-com-vmoo-userlist-'`) |
| `send(message, args?, opts?)` | Resolves `'sent'`, `'duplicate'` (another client sent the same `key`), `'not-negotiated'`, or `'refused'` for a reserved name, a bad argument, the rate limit of 20 a second, or a replay |
| `version(pkg, sid?)` | The negotiated version (`'1.0'`), or `null` |
| `negotiated(sid?)` | Every negotiated package and its version |
| `cord(type, { sid }?)` | Open a cord. Resolves an `McpCord` with `send`, `on(message \| '*')`, `close()` and `closed`. Rejects when the MOO did not negotiate `mcp-cord` |
| `onCordOpen(type, fn)` | Claim the cords of `type` the server opens. The backend closes a server cord nobody claims |

Arguments are `McpArgs`: each value a string, or a `string[]` for a multiline field. Type the messages you handle by augmenting `McpMessages`:

```ts
declare module '@muclient/sdk' {
  interface McpMessages { 'dns-com-example-weather': { sky: string; temp: string } }
}
```

A manifest entry's version range is `major.minor`. `mcp`, `mcp-negotiate` and `mcp-cord` are reserved. A package the player enables mid-session is offered at once. When the MOO does not confirm it within 5 seconds, **Extensions → Installed** says **Reconnect to enable MCP package …**. Cords close when the extension is disabled and when the session disconnects.

## The editor <Since v="1.10" />

When the game hands the player text to edit and wants it back, open μClient's editor. One surface serves MCP simpleedit, LambdaCore local edit and IRE's composer:

```ts
const ed = mu.editor.open({
  sid, id: ref, title: name, text: lines.join('\n'), language: 'moo-code',
  save: async (text) => {
    const r = await mu.mcp.send('dns-org-mud-moo-simpleedit-set', { reference: ref, type, content: text.split('\n') }, { sid });
    if (r !== 'sent' && r !== 'duplicate') throw new Error(r);
  },
});
ed.update(newText);
```

| Field | |
|---|---|
| `id` | Stable per edited thing. Opening the same id again updates and focuses that editor |
| `title`, `text` | The heading and the text |
| `language` | `'moo-code'`, `'lua'`, `'text'` or `'markdown'` |
| `readOnly` | View only |
| `command` | The command Save sends as the player, when saving does that. The editor shows it, and a verb outside the world's upload verbs asks the player first, once per world |
| `save(text)` | Send the text back. A rejection keeps the editor open with the error |
| `where` | `'modal'`, `'window'` or `'panel'`. Default: **Settings → Input → Open editors in** |

The editor opens on the device that has the session's attention. The others show **Editing … on another device** with **Open here**, and the unsaved draft follows. `update(text)` replaces the text, or asks first when the player has unsaved edits (**The game sent a newer version.**). `close()` closes it, and `closed` resolves when it closes for any reason.

## Protocol adapters

**Extensions → Installed → Protocol adapters** lists the adapters built into μClient. They are pinned by its build, on in every world unless the player turns one off there, and stay on in safe mode. Each is an ordinary extension on this SDK, and their source in `clients/adapters/` of the [μClient repository](https://github.com/runmu-sh/client) is a good set of examples.

| Adapter | Reads | Feeds |
|---|---|---|
| `adapter-gmcp-room` | GMCP `Room.Info`, `Room.Players`, `Char.Items` room lists | The Scene |
| `adapter-msdp` | MSDP `ROOM_NAME`, `ROOM_VNUM`, `ROOM_EXITS`, `AREA_NAME`, `ROOM` | The Scene |
| `adapter-gmcp-channels` | GMCP `Comm.Channel.List`, `Text`, `Players` | Channels |
| `adapter-client-media` | GMCP `Client.Media.Default`, `Play`, `Stop` | Media |
| `adapter-msp` | MSP `!!SOUND` and `!!MUSIC`, MXP `<IMAGE>` and `<SOUND>` | Media |
| `adapter-ire-composer` | GMCP `IRE.Composer.Edit` | The editor. Save sends `IRE.Composer.SetBuffer` |
| `adapter-client-map` | GMCP `Client.Map` | Offers the map file to an installed mapper, or suggests one |
| `adapter-client-gui` | GMCP `Client.GUI` | Tells the player once per world that the game offers a Mudlet GUI package |
| `mcp-simpleedit` | MCP simpleedit | The editor. Save sends `-set` |
| `mcp-status` | MCP `dns-com-awns-status` | A status card |
| `mcp-userlist` | MCP `dns-com-vmoo-userlist` | Who is online. The people in your room join the Scene and Tab completion |
| `mcp-smartcomplete` | MCP `dns-com-vmoo-smartcomplete` | Asks the game to complete a word |
| `mcp-displayurl` | MCP `dns-com-awns-displayurl` | Opens the page the game names. Opt-in per world |

When a game sends a package that no adapter or extension handles, **Extensions → Discover** shows **This game sends** with the marketplace listings that declare it in `contributes.gmcp` or `contributes.mcp`. μClient asks the marketplace by package name only: no game text, no world. A live `gmcp.on`, `gmcp.watch` or `mcp.on` claims its package.

## World packs

A world pack is an extension that carries one game's defaults: compose modes, palette verbs and the channel reply format, for the worlds at its hosts. It is an ordinary manifest with [`worlds`](/extensions/manifest#worlds-world-packs). **Extensions → Installed → World packs** lists the packs built into μClient. They are on in a matching world unless the player turns them off there, and the player's own settings always win.

The bundled pack is `@runmu.sh/pack-underspire`, for `underspire.net` and its subdomains. It gives the compose bar Pose (`.`), Emote (`emote `), Say (`say `), LOOC (`looc `) and Look (`@lp `), and the palette fourteen of the game's verbs. A pack with `suggest: true` that the player has not enabled shows **… pack is available for this world** when they connect, with **enable here**, **review** and **not here**.

## The GMCP inspector

**Open GMCP inspector** in the command palette, or **☰ → Views → GMCP**, opens a per-session panel for debugging what the game and your extension exchange. It records only while it is open.

| Tab | |
|---|---|
| **Log** | Every GMCP message in and out, with the extension or device that sent it. Filter by **package prefix** or **search**, and **pause** |
| **State** | The reduced state of each package |
| **Supports** | The advertised `Core.Supports` set, and who declared each package |
| **Send** | Send a package to the game as this client. Core packages are refused. In the demo and with a dev extension, **inject** delivers it to this client as if the game sent it |
| **MCP** | On MOO worlds: the log grouped by cord, the negotiation table, and send and inject |

**record**, then **save .murec**, saves the session to a file for [replay and tests](/extensions/hot-reload#replay-a-recorded-session).

## Next

- [Lines and input](/extensions/lines-input): line stages and the input pipeline.
- [Hot reload and tests](/extensions/hot-reload): replay a recording and test headless.
- [GMCP and MSDP data](/automation/gmcp): the same data from Lua.
