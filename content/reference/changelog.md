---
title: Changelog
description: What each version of the @muclient/sdk extension API added, from 1.0 to 1.6.
---

# Changelog

This changelog covers the extension SDK, `@muclient/sdk`. Each version since 1.0 adds members. No version removes or changes one, and there are no [deprecations](/reference/deprecations). For an extension's own changelog, see its marketplace listing.

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
