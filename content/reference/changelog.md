---
title: Changelog
description: What each version of the @muclient/sdk extension API added, from 1.0 to 1.14, and the dev tools that go with it.
---

# Changelog

This changelog covers the extension SDK, `@muclient/sdk`. Each 1.x version adds members. No version removes or renames one; a few change behaviour, marked below, and some members are [deprecated](/reference/deprecations) until 2.0. Moving from an older version is on [Upgrade to SDK 1.14](/extensions/migrating). For an extension's own changelog, see its marketplace listing.

## 1.14

Extensions own their features. The host keeps neutral registries (Settings tiles and shortcut rows, line routing, context-menu kinds, menu slots, setting migration, panel focus) and names no extension. Released with `@runmu.sh/dev` 0.3.0 and `@runmu.sh/create-extension` 0.5.0. See [Upgrade to SDK 1.14](/extensions/migrating).

- `SettingsSchema.tile` (`SettingsTile`: `glyph`, `order?`, `width?`): the page becomes a tile on the Settings hub. The manifest accepts `contributes.settings.tile`. See [A tile on the Settings hub](/extensions/commands-settings#a-tile-on-the-settings-hub).
- The setting kind `shortcut` (`ShortcutSpec`: `key`, `command`, `label?`, `hint?`, `group?`, `when?`): binds a key combo to one of the extension's commands, stored in the player's key bindings.
- `SettingSpec.migrateFrom`: copy a retired core pref's values once per account. Migratable: `channels.config`, `channels.replyFormat`, `alerts.channels`, `rules.feeds`.
- `mu.lines.route` (`RouteSpec`, `RouteRule`, `RouteCtx`), `mu.lines.testRoutes` and `mu.lines.patternError`. See [Line routing](/extensions/lines-input#line-routing).
- `mu.menus.kind` (`ContextKindSpec`), targets as `{ kind, sid, data }` checked against the kind's schema, and the types `JsonSchema`, `ContextKinds` (augmentable), `KindTarget` and `TargetOf`. `ContextMenuSpec` and `menus.context` are generic over the kind. `ContextTarget` gains `panel`.
- `MenuSpec.slot` `'now-playing'`: the action of the ☰ Sound row's now-playing line.
- `mu.channels.onMessage(fn, { ownsSettings? })` and `ChannelMessageEvent`; `opts.format` on `mu.channels.send`.
- `mu.panels.focus(id)`.
- `mu.prefs` names `effects.performance`, `audio.keySfx` and `audio.keySfxVolume`.
- Manifest: world packs set extension settings with `contributes.settings.values` (`ext.<id>.<key>`, at most 64 keys).
- `@runmu.sh/dev/test`: `host.routers`, `host.route(text, { sid })`, `mu.panels.focus`, `tile` in `host.settingsSchema`, shortcut rows, and `menus.add` in `host.calls`.

Behaviour changes:

- `LineEdit.copyTo` and `moveTo` go to the one router registered with `edits: true`. Without one, `copyTo` does nothing and `moveTo` keeps the line in the terminal. Until 2.0, core's legacy feed buffers take them while no extension holds `edits`.
- Settings → Feeds is no longer a core page. The Feeds extension 2.0 brings its own tile.
- The client no longer binds Alt+C (Channels) or Alt+R (Scene). The Channels and Scene extensions register `focus.channels` and `focus.scene` under the same ids, so a rebinding still applies.
- The client no longer opens the `media` panel from the now-playing line. The Media extension registers the action.
- A saved layout naming a panel no extension provides shows **Awaiting panel …** and **Find in Extensions**.
- `effects.glow` reads the glow as applied, so it is `false` while performance mode is on.
- **Settings → Keys** lists extension commands after the client's own.

Deprecated, removed in 2.0: `mu.feeds` and `FeedsView`, `mu.channels.configure`, `ChannelView.muted`, `alert` and `color`, the context kinds `channel`, `channel-message`, `scene-item`, `scene-exit` and `x-*`, and the pack field `contributes.channelsReplyFormat`. See [Deprecations](/reference/deprecations).

## 1.13

- `muclient.modules` and `mu.modules.load(path)`: extra ES modules, loaded the first time they are needed and pinned by sha256 at install.
- `mu.editor.provide`: an extension supplies the in-game editor. Without one, `mu.editor.open` shows a plain text editor.
- `mu.mcp.acceptLocalEdit(when?)` for LambdaCore local edit, and `ModalSpec.beforeClose()`.

Behaviour change: MCP simpleedit and LambdaCore local edit are handled by the MOO editor extension (`mooedit`).

## Dev tools

`@runmu.sh/dev` 0.2.0 and `@runmu.sh/create-extension` 0.3.0, with no API change (the SDK stays 1.12.0):

- The GMCP inspector records a session to a `.murec` file: redacted, saved on your device, MCP included.
- `@runmu.sh/dev --fixture <file.murec> [--speed n]` replays a recording into a `?demo` client.
- `@runmu.sh/dev/test`: `createHost()`, a headless host for `node --test`. The template has `npm test` with a sample fixture, and its CI runs it.
- **Extensions → Discover** shows **This game sends**: packages the game sends that nothing handles, with the listings that declare them.
- `contributes.gmcp` and `contributes.msdp` are now declared for each session where the extension is enabled, before it starts too.

See [Hot reload and tests](/extensions/hot-reload).

## 1.12

Surfaces and modules. See [Surfaces](/extensions/surfaces).

- Dialogs: `mu.ui.confirm`, `prompt`, `pick`, `modal`, `overlay`. `mu.ui.sanitize`, and `h` (also `mu.ui.h`).
- `mu.menus.add`, `context` and `target`. `mu.palette.provide` and `verbs`.
- `mu.panels.badge` and `touch`. `PanelSpec.show` and `role`, with a **Show panel** row per world.
- `mu.notify.mention` and `alert`. Toast options `action`, `group` and `timeoutMs`.
- `mu.files.save` and `open`, `mu.net.fetch`.
- `mu.theme.watch` and `register`. `mu.a11y.announce` and `region`. `mu.hud.mount`.
- `mu.actions.define`, `run`, `handle` and `visible`.
- `CommandSpec.when` and `group`. `PUBLIC_COMMANDS`.
- `ctx.exports(factory)` and `CallerContext`.
- More `mu.ui.css` names: `secClose`, `hlLine`, `onoff`, `placeholder`, `sq`, `warn`, `on`, `off`, `hot`, `dim`, `gold`, `ok`.
- Manifest: message contracts in `contributes.gmcp[].messages`; `worlds` for world packs; `contributes.verbs` entries as `{ label, send }`.

Behaviour changes:

- Soft capability checks: a call without its capability still works, warns once in the log, and shows **uses undeclared: …** on the card.
- `mu.ui.style` puts the sheet in `@layer ext.<id>`, below μClient's own CSS. Scope selectors to `.ext-panel[data-ext="<id>"]`.
- Core has no game defaults. Underspire's compose modes and verbs come from the bundled world pack `@runmu.sh/pack-underspire`.

Deprecated: `mu.commands.run` with a core id outside `PUBLIC_COMMANDS`.

## 1.11

Lines and input. See [Lines and input](/extensions/lines-input).

- `mu.lines.stage` with a `phase`, and `LineEdit`. `LineView` gains `spans`, `media`, `backlog`, `replay` and `meta`. Manifest `contributes.linePhases`.
- A line stage over 50 ms a line on 20 lines in a row is suspended for the session.
- `mu.lines.recent`, `search` and `history`.
- `mu.input.stage`, `completions`, `history`, `fill` and `focus`. `mu.macros.provide`.
- `mu.sessions.send` with `raw` or `echo` resolves what happened. `mu.sessions.request`.
- `mu.gmcp.seen`, `whenSeen` and `negotiated`.

## 1.10

Protocols, GMCP and MCP. See [Protocols](/extensions/protocols).

- `@muclient/sdk/gmcp`: `GmcpPackages`, `GmcpData` and the reducers.
- `mu.gmcp.watch`, `request` and `supported`. `mu.gmcp.send` resolves `'reserved'` for a core package.
- `mu.msdp`, `mu.mxp`, `mu.telnet.options` and `mu.mssp`.
- `mu.scene.provide`, `mu.channels.provide`, `mu.media.setBase` and `showImage`.
- `mu.lua.emit`, for Lua `ext.on`. Lua also gains `gmcp.send`.
- `mu.mcp` (MCP 2.1: messages, versions, cords) and manifest `contributes.mcp`. `mu.editor.open`.
- `EventMeta.afterLine` and `LineView.gmcp`.

Behaviour change: core no longer reads `Room.*`, `Comm.Channel.*`, `Client.Media.*`, MSP or MSDP itself. Bundled protocol adapters do, through the SDK, and feed the same models.

## 1.9

Several clients, storage and settings. See [Storage](/extensions/storage) and [Several clients on one session](/extensions/events#several-clients-on-one-session).

- `mu.effects.owner` and `watch`. `SessionRef.attention` is live.
- Idempotency keys: `key` on `sessions.send` and `gmcp.send`. `EffectOpts`.
- `mu.sync.channel`.
- Storage tiers `device`, `account`, `world(id, { sync: true })` and `session(sid)`, quotas and `QuotaExceeded`. `Store` members `keys(prefix)`, `watch`, `watchAll`, `collection` and `ready`. `Collection`, `ChangeMeta`.
- `SettingSpec.sync` and `when`, the kinds `color`, `key`, `json` and `textarea`. `SettingsSchema.component` and `sections`. `settings.get` and `watch` take `{ worldId, sid }`.
- `mu.prefs.get` and `watch`.
- Manifest `contributes.storage`.

Behaviour changes:

- Effects that a game event causes run on one client: the one the player is looking at.
- `mu.settings.watch` calls `fn` at once.
- `mu.storage.global` and `world(id)` move to IndexedDB, and a write reaches the extension's other tabs on the device.

## 1.8

Lifecycle and the event envelope. See [Events, sessions and GMCP](/extensions/events).

- `EventMeta` as the second argument of every handler, with `replay`. Effects are skipped while a replayed event is handled.
- `sessions.on('open' | 'state' | 'close' | 'identity')`, `sessions.each`, and `{ sid }` filters.
- `sessions.all`, `meta`, `watchMeta` and `provideIdentity`. `SessionRef.character`, `roles`, `telnet` and `attention`.
- `gmcp.stateMeta`.
- `SceneView.id`, `ScenePatch.id` and `extras`.
- `PanelSpec.perSession: false` is honoured.
- Manifest: `api` is a semver range; `contributes.panels`, `commands` and `settings` work before activation; `dependsOn`; `activation`.
- `@muclient/ui` resolves at runtime.

Behaviour changes:

- An extension receives events only from sessions in worlds where it is enabled. `mu.sessions.all()` and the `all-sessions` capability reach the others.
- An extension stays live while any session of a world that enables it is open.

## 1.7

- `mu.panels.open` takes `{ title, sid, focus }`.
- `mu.channels.get`, `watch`, `select`, `markRead`, `send` and `configure`. `ChannelColor` and `CHANNEL_COLORS`.
- `mu.feeds`.
- `mu.media.get`, `watch`, `clearImages` and `setOutput`.

## 1.6

- `mu.panels.openWeb(spec, sid?)`: open a web page in a Web panel or a window, per **Settings → Access → Open web pages**.
- `mu.panels.closeWeb(id, sid?)`: close a page opened with `openWeb`.

## 1.5

- `mu.ui.css` gains the keys `cmd`, `toggle`, `plate`, `count`, `field`, `row` and `label`.

## 1.4

- `PanelSpec.order`: a panel's place in the Views menu.
- `mu.scene.get(sid?)` and `mu.scene.watch(fn, sid?)`: read the Scene and follow its changes.
- `SceneView`: the shape `get` and `watch` return.

## 1.3

- `mu.wasm.load(path, imports?)`: load a WebAssembly module listed in the manifest.
- `WasmLoaded`: what `load` resolves to.

## 1.2

- `PanelSpec.snapshot` and `PanelSpec.restore`: keep a panel's state across a hot reload.

## 1.1

- `ctx.api(otherId)`: read another extension's exported API.
- `PanelSpec.inViewsMenu`, `mu.panels.update`, `mu.panels.autoAdd` and `mu.panels.vue`.
- `mu.gmcp.send` and `mu.gmcp.supports`.
- `mu.scene.set` and `ScenePatch`.
- `mu.channels.push`.
- `mu.media.play`, `mu.media.stop` and `MediaSpec`.
- `mu.widgets.show`, `mu.widgets.close` and `WidgetSpec`.
- `mu.settings` (`define`, `get`, `set`, `watch`, `open`), `SettingSpec` and `SettingsSchema`.
- `mu.ui.style(css)`.
- The `kind` option of `mu.ui.toast`.

## 1.0

The first version:

- `defineExtension`, `ExtensionDef`, `ExtensionContext` (`id`, `version`, `mu`, `subscriptions`).
- `mu.panels` (`register`, `open`, `close`) and `PanelSpec`, `PanelMountCtx`.
- `mu.commands` and `CommandSpec`.
- `mu.sessions` (`active`, `list`, `send`, `echo`, `on('line')`, `on('switch')`), `SessionRef`, `LineView`.
- `mu.lines.stage` and `LineCtx`.
- `mu.gmcp.on` and `mu.gmcp.state`.
- `mu.lua.on`.
- `mu.ui.toast` and `mu.ui.css` (`btn`, `primary`, `tool`, `chip`, `inp`, `secHead`, `empty`, `framed`, `badge`, `lamp`, `glow`).
- `mu.theme.cssVar`, `mu.storage` and `Storage`, `mu.log`.
- `SDK_VERSION` and `Dispose`.

## Next

- [@muclient/sdk](/reference/sdk/): every member in full.
- [Deprecations](/reference/deprecations).
- [Build a panel in 10 minutes](/extensions/quickstart).
