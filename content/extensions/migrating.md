---
title: Upgrade to SDK 1.12
description: Move an extension from an earlier 1.x SDK to 1.12. Nothing breaks within 1.x; this lists the changes worth making and links the migration guides for each first-party package.
audience: extensions
---

# Upgrade to SDK 1.12

The SDK stays backwards compatible within 1.x, so an extension built for 1.6 runs on a 1.12 client unchanged. Each step below is optional, and each makes an extension smaller or better behaved.

## 1. Bump the versions

```json
"muclient": { "api": "^1.12" },
"devDependencies": {
  "@muclient/sdk": "npm:@runmu.sh/sdk@^1.12.0",
  "@runmu.sh/dev": "^0.2.0"
}
```

With `^1.12`, a client older than 1.12 refuses to load the extension and tells the player to update. Keep the lower range if you use nothing newer.

## 2. Changes worth making

- **Per-session state.** Keep it in `mu.sessions.each(setup)`, whose returned function runs when the session leaves scope, or in `mu.storage.session(sid)`. A module-level `Map` keyed by sid is never cleared. See [Sessions](/extensions/events#sessions).
- **Drop replay loops.** A late-starting extension is replayed every open session and the GMCP state with `meta.replay: true`, and effects are skipped while a replayed event is handled. Delete loops over `sessions.list()` and `gmcp.state`. See [The event envelope](/extensions/events#the-event-envelope).
- **Declare packages in the manifest.** `contributes.gmcp` and `contributes.msdp` are declared for a session while your extension is enabled in its world, before it starts. Keep `mu.gmcp.supports` for packages that depend on runtime state.
- **Declare capabilities.** Undeclared ones still work, but warn once in the log and show **uses undeclared: …** on the card. See [Capabilities](/extensions/manifest#capabilities).
- **Effects on one client.** Pass a `key` to `sessions.send` and `gmcp.send` when every client would send the same thing. See [Several clients on one session](/extensions/events#several-clients-on-one-session).
- **Synced storage.** `mu.storage.global` and `world(id)` still stay on this device. Opt in to synced tiers and collections. See [Storage](/extensions/storage#before-1-9).
- **Phased line stages.** Move a v1 stage to a phase and use `LineEdit`. See [Line phases](/extensions/lines-input#line-phases).
- **Host surfaces.** Replace hand-built dialogs, menus, unread counts and mentions with [Surfaces](/extensions/surfaces), and offer a game-specific panel with `show: 'auto'` and `panels.touch`. See [Panels](/extensions/panels#offer-it-only-where-it-has-data).
- **Actions.** Turn hard-coded game verbs into [actions](/extensions/commands-settings#actions) the player can remap per world.
- **Public commands only.** `commands.run` of a core id outside `PUBLIC_COMMANDS` is deprecated. See [Run a command](/extensions/commands-settings#run-a-command).
- **Scope your CSS.** `mu.ui.style` now sits in `@layer ext.<id>`. See [Style it](/extensions/panels#_3-style-it).
- **Settings watch.** `mu.settings.watch` now calls at once. A `get` before it is redundant.
- **Tests.** Add `test/index.test.mjs` from a fresh scaffold, and record a fixture. See [Test headless](/extensions/hot-reload#test-headless).

## 3. The migration guides

The [μClient repository](https://github.com/runmu-sh/client/tree/main/docs/extensions-sdk/migrations) has a guide per release, and one per first-party package that quotes its code and gives the replacement, the manifest diff and test notes.

| Guide | Covers |
|---|---|
| [Storage 1.9](https://github.com/runmu-sh/client/blob/main/docs/extensions-sdk/migrations/storage-1.9.md) | Synced tiers and collections, `sync: 'device'` settings |
| [Surfaces 1.12](https://github.com/runmu-sh/client/blob/main/docs/extensions-sdk/migrations/surfaces-1.12.md) | Capabilities, dialogs and menus, panel `show`, `role`, `touch` and `badge`, actions, mentions, message contracts, `ctx.exports`, world packs |
| [ext-kit](https://github.com/runmu-sh/client/blob/main/docs/extensions-sdk/migrations/ext-kit.md) | Host panels, roles, actions and contracts instead of the kit's own; grouped toasts |
| [ext-tickets](https://github.com/runmu-sh/client/blob/main/docs/extensions-sdk/migrations/ext-tickets.md) | `sessions.request` and `gmcp.whenSeen`, message contracts, badges, mentions, `ctx.exports` |
| [ext-scene](https://github.com/runmu-sh/client/blob/main/docs/extensions-sdk/migrations/ext-scene.md) | `panels.touch` from the Scene, `SceneView.id`, exit context targets |
| [ext-roomnotes](https://github.com/runmu-sh/client/blob/main/docs/extensions-sdk/migrations/ext-roomnotes.md) | The room per session, a phased `highlight` stage, confirm before delete |
| [ext-vitals](https://github.com/runmu-sh/client/blob/main/docs/extensions-sdk/migrations/ext-vitals.md) | `gmcp.watch` on the merged `Char.Vitals` state |
| [ext-webpages](https://github.com/runmu-sh/client/blob/main/docs/extensions-sdk/migrations/ext-webpages.md) | Skip replayed `Client.Web.Open`, `Client.Web` contracts |

## Next

- [Changelog](/reference/changelog): every SDK release.
- [Deprecations](/reference/deprecations): what stops working in 2.0.
