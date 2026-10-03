---
title: The manifest
description: The muclient field in package.json, every key it takes, what μClient does with it before your code runs, and the rules it checks at build and install.
---

# The manifest

An extension is an npm package whose `package.json` has a `muclient` object. μClient reads it before it fetches any code: it names the extension and the API it needs, says what to show the player in the install prompt, and declares what μClient sets up on the extension's behalf: panels, commands, a Settings page, the GMCP, MSDP and MCP packages it handles, and when it starts.

## A complete example

```json
{
  "name": "@you/ext-roomnotes",
  "version": "0.1.0",
  "type": "module",
  "description": "Keep your own notes per room.",
  "keywords": ["notes", "rooms", "gmcp"],
  "license": "MIT",
  "exports": "./dist/index.js",
  "files": ["dist", "README.md"],
  "muclient": {
    "id": "roomnotes",
    "api": "^1.12",
    "source": "src/index.ts",
    "displayName": "Room notes",
    "description": "Keep your own notes per room, from GMCP Room.Info.",
    "categories": ["mapping"],
    "contributes": {
      "panels": [{ "id": "roomnotes", "title": "Room notes" }],
      "commands": [{ "id": "roomnotes.note", "title": "Room notes: add a note for this room" }],
      "gmcp": ["Room 1"],
      "storage": { "world": ["notes"] }
    },
    "activation": ["onGmcp:Room.Info", "onPanel:roomnotes"],
    "capabilities": ["read-output", "send-commands"]
  }
}
```

`npm create @runmu.sh/extension` writes one like it (see [Build a panel in 10 minutes](/extensions/quickstart)).

## Fields outside `muclient`

| Field | |
|---|---|
| `name` | Required. An npm package name: lowercase, URL-safe, an optional scope, at most 214 characters |
| `version` | The version shown in the client and on the marketplace. Default `0.0.0` |
| `exports` | Required. The built entry file, as a string: `"./dist/index.js"`. A path inside the package: no `..`, no leading `/` |

The marketplace also reads `description`, `keywords`, `license`, `homepage`, `repository` and `bugs` for the listing.

## Keys in `muclient`

| Key | Required | |
|---|---|---|
| `api` | yes | The SDK range your code needs, as a semver range: `"^1.12"`, `">=1.9 <2"` |
| `id` | no | The extension id. Default: `name` without its scope and without a leading `ext-`, so `@you/ext-roomnotes` becomes `roomnotes` |
| `displayName` | no | The name in the client and the install prompt. Default `name` |
| `description` | no | One line under the name in **Extensions → Installed** |
| `source` | no | The TypeScript entry that `npm run build` and the dev server compile into `exports`. Default `src/index.ts` |
| `contributes` | no | What the extension adds: panels, commands, settings, protocol packages, stored data, line phases. See [`contributes`](#contributes) |
| `activation` | no | When the extension starts. Default `["onWorld"]`. See [`activation`](#activation) |
| `dependsOn` | no | Other extensions it needs, by id or package name, with a version range. See [`dependsOn`](#dependson) |
| `worlds` | no | The game hosts it is made for. It makes the extension a world pack. See [`worlds`](#worlds-world-packs) |
| `capabilities` | no | What the extension does, in the words the install prompt shows |
| `wasm` | no | The `.wasm` files `mu.wasm.load` may fetch, with their sha256. See [WebAssembly helpers](/extensions/wasm) |
| `publisherKey` | no | A minisign public key that signs your builds. See [Sign it](/extensions/publish#sign-it) |
| `publisher` | no | Your marketplace handle, or a list of them. Linking a GitHub repository needs it. See [Publish to the marketplace](/extensions/publish) |
| `categories` | no | Marketplace categories, at most three |
| `tags`, `icon` | no | Marketplace tags (instead of `keywords`) and a package-relative icon image |

### `api`

A semver range that μClient's SDK version must satisfy: `"^1.12"`, `"^1.9"`, `">=1.10 <2"`. μClient checks it at install, at update and each time it activates the extension. An installed extension that no longer satisfies it (after a downgrade, say) shows **incompatible** on its card and does not start. Write the lowest minor version whose members you call: an extension that calls `mu.ui.confirm` <Since v="1.12" /> declares `"^1.12"`. The SDK version each member arrived in is on the [SDK reference](/reference/sdk/).

A range μClient does not satisfy is refused with `It needs μClient extension API ^1.13; this μClient has 1.12.0. Update μClient.`

### `id`

The id matches `[a-z0-9][a-z0-9._-]{0,63}`: a lowercase letter or digit, then up to 63 of `a-z 0-9 . _ -`. Your settings are stored as `ext.<id>.<key>`, and the marketplace listing and the short install name (`roomnotes@0.1.0`) use the id. Two installed extensions cannot share an id.

Use it as the prefix of your panel and command ids (`roomnotes`, `roomnotes.note`). Panel and command ids share one registry with μClient's own and every other extension's, and registering an id that is taken throws.

### `contributes`

What μClient sets up for the extension. Since <Since v="1.8" /> it acts on these keys whether or not `activate` has run yet.

| Key | What μClient does with it |
|---|---|
| `panels` | `[{ id, title, order?, defaultPosition?, perSession?, singleton?, inViewsMenu?, icon? }]`. Listed in the Views menu before activation. A saved layout keeps the panel's slot with a placeholder (**Loading Room notes…**, then **Room notes is off in this world** or **Room notes failed to load**) until `mu.panels.register` with the same id replaces it |
| `commands` | `[{ id, title, keys?, when? }]`. Listed in the palette and **Settings → Keys** before activation. Running one starts the extension first |
| `settings` | A package path to a settings schema (`"settings.json"`), or an inline `{ title?, items, tile? }`. The Settings page renders from it before activation. <Since v="1.14" /> A `tile` (`{ glyph, order?, width? }`) puts the page on the Settings hub before activation and in safe mode, and an inline item may carry `migrateFrom`. See [Commands and settings](/extensions/commands-settings#a-tile-on-the-settings-hub). A world pack uses `{ values }` instead, below |
| `gmcp` | GMCP packages with versions, `["Room 1", "Char.Items 1"]`. μClient adds them to `Core.Supports` on every session of a world where the extension is enabled, before activation too, and withdraws them when it is disabled there. An entry may be an object with message contracts, below |
| `msdp` | MSDP variables, `["ROOM_NAME", "ROOM_EXITS"]`. μClient sends `REPORT` for them the same way |
| `mcp` | MCP 2.1 packages: `[{ package, min, max, messages? }]`. Negotiated with a MOO while the extension is live in a session. See [Protocols](/extensions/protocols#mcp-2-1) |
| `storage` | The keys you store, by tier: `{ "account": ["notes"], "world": ["visited"] }`. Listed in the backup and the uninstall prompt. Not enforced. See [Storage](/extensions/storage) |
| `linePhases` | The [line phases](/extensions/lines-input#line-phases) you register stages in. `transform` or `route` makes the install prompt say **Changes game text (line transform or routing stages).** |
| `compose`, `verbs` | A world pack's defaults. See [`worlds`](#worlds-world-packs). `channelsReplyFormat` is deprecated since 1.14 |

Panel and command entries need an `id` of 1–128 of `A-Z a-z 0-9 . _ : -`, starting with a letter or digit, and a `title`. Keep them in step with what your code registers: a runtime `register` of an id the manifest does not declare still works.

`mu.gmcp.supports` and `mu.msdp.report` stay for packages you only need some of the time. A package the live extension declares with `supports` is the extension's to manage from then on, until it deactivates. The client never declares the packages the backend reserves (`Core.*` and `Char.Login*`).

#### Message contracts <Since v="1.12" />

A `gmcp` entry may name its messages and a JSON Schema for each:

```json
"gmcp": [{
  "package": "Client.Tickets 1",
  "messages": {
    "Client.Tickets.List": { "dir": "in", "schema": "schemas/tickets-list.json" },
    "Client.Tickets.Claim": { "dir": "out", "schema": "schemas/tickets-claim.json" }
  }
}]
```

An inbound payload that does not match is dropped before your handlers see it, and the session shows one line a minute per package: `session.error: Client.Tickets.List rejected by tickets: <path>: <reason>`. Outbound payloads are checked in dev builds only. Discover uses `dir` too: a package you only send is not listed as one you handle.

### `activation` <Since v="1.8" />

```json
"activation": ["onGmcp:Client.Tickets", "onPanel:tickets", "onCommand:tickets.open"]
```

| Event | The extension starts |
|---|---|
| `onWorld` | The default. While any session of a world that enables it is open |
| `global` | Always, even with no session open. `"activation": "global"` also works |
| `onGmcp:<pkg>` | The first time that package arrives on a session where it is enabled |
| `onMsdp:<var>` | The first time that MSDP variable arrives |
| `onLua:<name>` | The first time a Lua `ext.emit` of that name arrives |
| `onPanel:<id>` | When the player shows a declared panel |
| `onCommand:<id>` | When a declared command runs |

The event that started the extension reaches it with `replay: false`. What arrived before comes with `replay: true`. An extension for one game's staff, installed everywhere, then costs nothing in worlds that never send its package. Unknown entries are dropped. A list with none left means `onWorld`.

### `dependsOn` <Since v="1.8" />

```json
"dependsOn": { "tickets": "^1.2", "@runmu.sh/ext-scene": "^1.0" }
```

Other extensions this one needs, by id or package name, each with a version range.

- **Install** offers to install what is missing, in the same prompt (**Also installs what it needs:**). An installed one that is too old blocks the install: `Room notes needs tickets ^1.2; Tickets 1.1.0 is installed. Update it first.`
- **Enable** in a world enables the dependencies there too, and μClient tells the player.
- **Order**: a dependency activates first and deactivates last, so `ctx.api('tickets')` on a declared dependency resolves without a race.

### `worlds`: world packs <Since v="1.12" />

```json
"worlds": { "hosts": ["underspire.net", "*.underspire.net"], "suggest": true },
"contributes": {
  "compose": [{ "id": "pose", "label": "Pose", "prefix": "." }, { "id": "looc", "label": "LOOC", "prefix": "looc " }],
  "verbs": ["look", { "label": "Character sheet", "send": "@stats" }],
  "settings": { "values": { "ext.channels.replyFormat": "{channel} {text}" } }
}
```

An extension with `worlds.hosts` is a **world pack**: a game's defaults, in one package, for the worlds at its hosts. Up to 32 hosts. `example.org` matches that host and its subdomains, and `*.example.org` subdomains only. With `suggest: true`, μClient offers to enable it when the player adds or connects a matching world.

While it is enabled in a matching world, its `compose` modes, palette `verbs` (a string, or `{ label, send }`) and <Since v="1.14" /> `settings.values` are that world's defaults. `settings.values` sets other extensions' settings by full key, `ext.<id>.<key>`: at most 64 keys, each at most 8 KB of JSON. `contributes.channelsReplyFormat` still works, warns once per pack and stops working in 2.0; set `ext.channels.replyFormat` instead. The player's own settings always win. μClient itself ships no game defaults: without a pack, the compose bar has **Say** alone and the palette's verbs are Look, Who is online and Inventory. The bundled pack for Underspire, `@runmu.sh/pack-underspire`, is the example to copy. See [World packs](/extensions/protocols#world-packs).

### `capabilities`

| Value | The prompt says | Covers |
|---|---|---|
| `read-output` | read output | `mu.sessions.on('line')`, `mu.lines.stage` |
| `send-commands` | send commands | `mu.sessions.send`, `mu.sessions.request`, `mu.gmcp.send`, `mu.actions.run` |
| `network` | network | `mu.net.fetch` |
| `files` | files | `mu.files.save`, `mu.files.open` |
| `all-sessions` | all sessions | `mu.sessions.all` |

Any other string is shown as written (the Web pages extension declares `open-web`). The list appears after **Declares:** in the install prompt and on the extension's card in **Extensions → Installed**. Declare what the code does, so that a theme asking to send commands stands out.

The checks are soft <Since v="1.12" />. A call that needs a capability you did not declare still works. It writes one warning per capability to the extension's log, and the card shows **uses undeclared: send commands**.

### `categories`, `tags`, `icon`

Read by the marketplace when you publish, ignored by the client. `categories` takes up to three of `mapping`, `combat`, `communication`, `automation`, `interface`, `themes`, `sound`, `accessibility`, `logging`, `developer`, `games`, `other`; other values are dropped. `icon` is a path inside the package to a PNG, JPEG, WebP, GIF, or an SVG under 256 kB.

## Validation

The rules run in three places. The build check is the strictest, so a package that passes it passes the other two.

- `npm run build` and `npm run check` in a scaffolded project (`scripts/manifest.mjs`);
- the client, when it reads a package folder or a dev server;
- the μClient backend, when it fetches an `npm:`, `git+https://` or `.tgz` source.

They share one JSON Schema, [`clients/extensions/schema/muclient-manifest.v1.schema.json`](https://github.com/runmu-sh/client/blob/main/clients/extensions/schema/muclient-manifest.v1.schema.json) in the μClient repository. Point your editor at it for completion in `package.json`.

```sh
npm run check
```

```text
manifest ok: roomnotes 0.1.0 (api ^1.12)
```

A failed check prints the reason and exits with status 1:

| Message | Cause |
|---|---|
| `This package has no "muclient" manifest, so it is not a μClient extension.` | No `muclient` object |
| `The manifest needs "exports" naming the built entry file.` | `exports` missing, or an object. Use a string |
| `Unsafe "exports" path "../index.js".` | The entry points outside the package |
| `It needs μClient extension API ^2.0; this μClient provides 1.x.` | At build: `api` admits no 1.x version. A missing `api` reads `(unspecified)` |
| `It needs μClient extension API ^1.13; this μClient has 1.12.0. Update μClient.` | At install or activation: this μClient's SDK does not satisfy `api` |
| `Invalid extension id "Room Notes".` | The id, given or derived from `name`, breaks the id rule |
| `Invalid package name "…".` | `name` is not an npm name (build check only) |
| `muclient.wasm: "…" is not a path inside the package.` | A bad `wasm` entry |
| `muclient.contributes.panels[0] (map): needs a "title".` | A panel or command entry without an `id` or `title`, or a duplicate id |
| `muclient.contributes.mcp[0] (…): "min" is above "max".` | A bad `mcp` entry. Versions are `major.minor`, and `mcp`, `mcp-negotiate` and `mcp-cord` are reserved |
| `muclient.dependsOn: "…" has an invalid version range "…".` | A `dependsOn` value is not a range, or its key is not an id or package name |
| `muclient.activation must be a list of activation events, or "global".` | `activation` is neither |

## Trust

Extensions run with full access to μClient: every world, all game text, the player's settings and account session. There is no sandbox. The player decides what to trust, and the client adds these safeguards.

- **The install prompt.** Nothing runs before the player accepts **Install `<displayName>` `<version>`?**, which shows the source, the signature state, the full-access warning, your **Declares:** line, and a **view source** link.
- **Pinning.** The client pins the sha256 of your entry file (and of each `.wasm`) at install and checks it on every load. When the bytes at the source change, the extension stops with the status **changed** until the player chooses **accept update**.
- **Signatures.** When the index entry or your `publisherKey` names a key, the client checks `<entry>.minisig` over the entry bytes, at the prompt and again at install. A package key that differs from the index key makes the signature invalid. The prompt shows **Signed by …**, **Not signed by its publisher.** or **Signature invalid: …**, and an invalid signature blocks the install until the player ticks **install anyway: I understand the signature is invalid**. A signed extension's card in **Extensions → Installed** carries a **signed** badge. [Sign it](/extensions/publish#sign-it) shows how to make the signature.
- **Safe mode.** Opening the client with `?safe=1`, holding Shift while it starts, or **Extensions → Advanced → restart in safe mode** starts it with every extension off.
- **Per world.** An installed extension is enabled in all worlds by default. The player can turn it off for one world on its card.

## Next

- [Panels](/extensions/panels): register what `contributes.panels` declares.
- [Protocols](/extensions/protocols): GMCP, MSDP and MCP packages in depth.
- [Publish to the marketplace](/extensions/publish): how the listing uses these fields.
- [SDK reference](/reference/sdk/): every member with its version.
