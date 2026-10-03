---
title: Upgrade to SDK 1.14
description: Move an extension from an earlier 1.x SDK to 1.14. Nothing breaks within 1.x. The page lists the changes worth making, with a section for each from 1.13 to 1.14.
audience: extensions
---

# Upgrade to SDK 1.14

The SDK stays backwards compatible within 1.x, so an extension built for 1.6 runs on a 1.14 client unchanged. Each step below is optional, and each makes an extension smaller or better behaved.

## 1. Bump the versions

```json
"muclient": { "api": "^1.14" },
"devDependencies": {
  "@muclient/sdk": "npm:@runmu.sh/sdk@^1.14.0",
  "@runmu.sh/dev": "^0.3.0"
}
```

With `^1.14`, a client older than 1.14 refuses to load the extension and tells the player to update. Keep the lower range if you use nothing newer.

## 2. Changes worth making from before 1.12

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

## 3. 1.13 → 1.14

In 1.14 the client hands each feature to the extension that provides it. The client keeps the registries (Settings tiles and shortcut rows, line routing, context-menu kinds, menu slots, commands, panel focus, setting migration) and names no extension. The old paths keep working in 1.x and warn once in the extension's log. Set `"api": "^1.14"` and `@muclient/sdk` `npm:@runmu.sh/sdk@^1.14.0` before you use the new members.

- **A Settings tile.** Add `tile: { glyph, order?, width? }` to your schema, and to `contributes.settings` so the tile shows before activation. See [A tile on the Settings hub](/extensions/commands-settings#a-tile-on-the-settings-hub).
- **Shortcut rows.** Put a `{ key, kind: 'shortcut', command }` row on your page for each of your commands the player may want to rebind. See [Shortcut rows](/extensions/commands-settings#shortcut-rows).
- **Line routing.** Replace `mu.feeds` with `mu.lines.route`: keep the rules in a `kind: 'json'` setting, keep the routed lines in your extension, and declare `read-output`. A router with `edits: true` receives `LineEdit.copyTo` and `moveTo`; with none, `moveTo` keeps the line in the terminal. See [Line routing](/extensions/lines-input#line-routing).
- **Context kinds.** Register each kind you publish with `mu.menus.kind({ id: '<extId>.<name>', title, schema? })` and publish `{ kind, sid, data }`. Replace `channel`, `channel-message`, `scene-item`, `scene-exit` and `x-*` with registered kinds, and augment `ContextKinds` for typed entries. Add `menus.kind` to any fake host in your tests. See [Context kinds](/extensions/surfaces#context-kinds).
- **Channel settings.** Keep mute, alert and colour per channel, the reply format and the alert toggle in your own settings with `migrateFrom`, register `mu.channels.onMessage(fn, { ownsSettings: true })`, raise mentions with `mu.notify.mention`, and pass `{ format }` to `mu.channels.send`. Stop calling `mu.channels.configure` and reading `ChannelView.muted`, `alert` and `color`. See [Own the channel settings](/extensions/protocols#own-the-channel-settings).
- **Take over a core setting.** `migrateFrom` copies the player's values from a retired core pref once per account. See [Take over a core setting](/extensions/commands-settings#take-over-a-core-setting).
- **World packs.** Replace `contributes.channelsReplyFormat` with `contributes.settings: { "values": { "ext.channels.replyFormat": "…" } }`. See [World packs](/extensions/manifest#worlds-world-packs).
- **Panel shortcuts.** The client no longer binds Alt+C (Channels) or Alt+R (Scene). Register a command with default `keys` that calls `mu.panels.focus?.(id)`, and list it in `contributes.commands` too. See [Focus a panel](/extensions/panels#focus-a-panel).
- **The now-playing action.** The **☰** Sound row's now-playing line runs a `slot: 'now-playing'` menu row. Wrap the call in `try`, since a host before 1.14 throws `unknown slot "now-playing"`. See [Menus](/extensions/surfaces#menus).
- **Tests.** `@runmu.sh/dev/test` has `host.routers`, `host.route(text, { sid })`, `mu.panels.focus`, `tile` in `host.settingsSchema`, and records `menus.add` in `host.calls`.

## 4. Examples

The first-party extensions are open source and use the current SDK. [runmu-sh/ext-feeds](https://github.com/runmu-sh/ext-feeds) 2.0.0 routes lines with its own Settings tile, [runmu-sh/ext-channels](https://github.com/runmu-sh/ext-channels) 1.2.0 owns the channel settings and registers context kinds and Alt+C, [runmu-sh/ext-scene](https://github.com/runmu-sh/ext-scene) 1.2.0 registers its kinds and Alt+R, and [runmu-sh/ext-media](https://github.com/runmu-sh/ext-media) 1.2.0 registers the now-playing action. [Get started](/extensions/quickstart) lists the others.

## Next

- [Changelog](/reference/changelog): every SDK release.
- [Deprecations](/reference/deprecations): what stops working in 2.0.
