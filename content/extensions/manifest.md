---
title: The manifest
description: The muclient field in package.json, every key it takes, the rules μClient checks at build and install, and what the player sees before your code runs.
---

# The manifest

An extension is an npm package whose `package.json` has a `muclient` object. μClient reads it before it fetches any code: it names the extension, the API it needs, and what to show the player in the install prompt.

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
    "api": "^1.4",
    "source": "src/index.ts",
    "displayName": "Room notes",
    "description": "Keep your own notes per room, from GMCP Room.Info.",
    "categories": ["mapping"],
    "contributes": {
      "panels": [{ "id": "roomnotes", "title": "Room notes" }],
      "commands": [{ "id": "roomnotes.note", "title": "Room notes: add a note for this room" }],
      "gmcp": ["Room 1"]
    },
    "capabilities": ["read-output", "send-commands"]
  }
}
```

`npm create muclient-extension` writes one like it (see [Build a panel in 10 minutes](/extensions/quickstart)).

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
| `api` | yes | The SDK range your code needs: `"^1.4"`, `"1.x"`, `"1"` |
| `id` | no | The extension id. Default: `name` without its scope and without a leading `ext-`, so `@you/ext-roomnotes` becomes `roomnotes` |
| `displayName` | no | The name in the client and the install prompt. Default `name` |
| `description` | no | One line under the name in **Extensions → Installed** |
| `source` | no | The TypeScript entry that `npm run build` and the dev server compile into `exports`. Default `src/index.ts` |
| `contributes` | no | What the extension adds: panels, commands, GMCP packages |
| `capabilities` | no | What the extension does, in the words the install prompt shows |
| `wasm` | no | The `.wasm` files `mu.wasm.load` may fetch, with their sha256. See [WebAssembly helpers](/extensions/wasm) |
| `publisherKey` | no | A minisign public key that signs your builds. See [Sign it](/extensions/publish#sign-it) |
| `publisher` | no | Your marketplace handle, or a list of them. Linking a GitHub repository needs it. See [Publish to the marketplace](/extensions/publish) |
| `categories` | no | Marketplace categories, at most three |
| `tags`, `icon` | no | Marketplace tags (instead of `keywords`) and a package-relative icon image |

### `api`

Write `1`, `1.x`, `^1` or `^1.4`: major version 1, with or without a caret. Anything else is refused with `It needs extension API ^2.0; this μClient provides 1.x.` The client checks only the major version, so write the lowest minor version whose members you call. An extension that calls `mu.panels.openWeb` <Since v="1.6" /> declares `"^1.6"`. The SDK version each member arrived in is on the [SDK reference](/reference/sdk/).

### `id`

The id matches `[a-z0-9][a-z0-9._-]{0,63}`: a lowercase letter or digit, then up to 63 of `a-z 0-9 . _ -`. Your settings are stored as `ext.<id>.<key>`, and the marketplace listing and the short install name (`roomnotes@0.1.0`) use the id. Two installed extensions cannot share an id.

Use it as the prefix of your panel and command ids (`roomnotes`, `roomnotes.note`). Panel and command ids share one registry with μClient's own and every other extension's, and registering an id that is taken throws.

### `contributes`

```json
"contributes": {
  "panels": [{ "id": "roomnotes", "title": "Room notes" }],
  "commands": [{ "id": "roomnotes.note", "title": "Room notes: add a note for this room" }],
  "gmcp": ["Room 1"]
}
```

A declaration of what your code registers when it activates. The marketplace stores it with each published version. The client registers nothing from it. The panel exists once `activate` calls `mu.panels.register`, and the game hears about `Room 1` once `mu.gmcp.supports(['Room 1'])` runs. Keep the two in step. See [Panels](/extensions/panels), [Commands and settings](/extensions/commands-settings) and [GMCP and Lua events](/extensions/events).

### `capabilities`

| Value | The prompt says |
|---|---|
| `read-output` | read output |
| `send-commands` | send commands |
| `network` | network |

Any other string is shown as written (the Web pages extension declares `open-web`). The list appears after **Declares:** in the install prompt and on the extension's card in **Extensions → Installed**. It is a statement to the player, and the client does not enforce it. Declare what the code does, so that a theme asking to send commands stands out.

### `categories`, `tags`, `icon`

Read by the marketplace when you publish, ignored by the client. `categories` takes up to three of `mapping`, `combat`, `communication`, `automation`, `interface`, `themes`, `sound`, `accessibility`, `logging`, `developer`, `games`, `other`; other values are dropped. `icon` is a path inside the package to a PNG, JPEG, WebP, GIF, or an SVG under 256 kB.

## Validation

The rules run in three places. The build check is the strictest, so a package that passes it passes the other two.

- `npm run build` and `npm run check` in a scaffolded project (`scripts/manifest.mjs`);
- the client, when it reads a package folder or a dev server;
- the μClient backend, when it fetches an `npm:`, `git+https://` or `.tgz` source.

```sh
npm run check
```

```text
manifest ok: roomnotes 0.1.0 (api ^1.4)
```

A failed check prints the reason and exits with status 1:

| Message | Cause |
|---|---|
| `This package has no "muclient" manifest, so it is not a μClient extension.` | No `muclient` object |
| `The manifest needs "exports" naming the built entry file.` | `exports` missing, or an object. Use a string |
| `Unsafe "exports" path "../index.js".` | The entry points outside the package |
| `It needs extension API ^2.0; this μClient provides 1.x.` | `api` is not a 1.x range. A missing `api` reads `(unspecified)` |
| `Invalid extension id "Room Notes".` | The id, given or derived from `name`, breaks the id rule |
| `Invalid package name "…".` | `name` is not an npm name (build check only) |
| `muclient.wasm: "…" is not a path inside the package.` | A bad `wasm` entry |

## Trust

Extensions run with full access to μClient: every world, all game text, the player's settings and account session. There is no sandbox. The player decides what to trust, and the client adds these safeguards.

- **The install prompt.** Nothing runs before the player accepts **Install `<displayName>` `<version>`?**, which shows the source, the signature state, the full-access warning, your **Declares:** line, and a **view source** link.
- **Pinning.** The client pins the sha256 of your entry file (and of each `.wasm`) at install and checks it on every load. When the bytes at the source change, the extension stops with the status **changed** until the player chooses **accept update**.
- **Signatures.** When the index entry or your `publisherKey` names a key, the client checks `<entry>.minisig` over the entry bytes, at the prompt and again at install. A package key that differs from the index key makes the signature invalid. The prompt shows **Signed by …**, **Not signed by its publisher.** or **Signature invalid: …**, and an invalid signature blocks the install until the player ticks **install anyway: I understand the signature is invalid**. A signed extension's card in **Extensions → Installed** carries a **signed** badge. [Sign it](/extensions/publish#sign-it) shows how to make the signature.
- **Safe mode.** Opening the client with `?safe=1`, holding Shift while it starts, or **Extensions → Advanced → restart in safe mode** starts it with every extension off.
- **Per world.** An installed extension is enabled in all worlds by default. The player can turn it off for one world on its card.

## Next

- [Panels](/extensions/panels): register what `contributes.panels` declares.
- [Publish to the marketplace](/extensions/publish): how the listing uses these fields.
- [SDK reference](/reference/sdk/): every member with its version.
