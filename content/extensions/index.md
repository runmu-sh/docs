---
title: What an extension is
description: An extension is an npm package that μClient loads, with a TypeScript SDK for panels, commands, settings, game events and protocols, line and input stages, storage, host surfaces and WebAssembly helpers.
audience: extensions
---

# What an extension is

An extension is an npm package with a `muclient` manifest in its `package.json` and one ES module that the client loads. It gets a `mu` object, the SDK, and with it registers **panels** (any framework or plain DOM, mounted into the client's layout), **commands**, **settings**, listeners for **GMCP**, MSDP, MXP and MCP and for **Lua events**, stages that change **game lines** and the player's **commands**, and optional **WebAssembly** helpers. Everything it registers is tracked and disposed when the extension is disabled, uninstalled or hot-reloaded, so you do not clean up by hand.

- Written in TypeScript against `@muclient/sdk`, version 1.12. The types come from npm as [`@runmu.sh/sdk`](https://www.npmjs.com/package/@runmu.sh/sdk); the client supplies the runtime through its import map.
- Built with esbuild to one `dist/index.js`; `vue` is external, so a Vue panel uses the client's Vue.
- Runs in every session of the worlds where the player enables it, and hears only those sessions. When the player has a session open on several devices, each runs the extension: state everywhere, effects such as sounds and toasts on one.
- Developed with a dev server that hot-reloads the extension in a running client and replays recorded game sessions, and tested headless with `npm test`.
- Published to the [marketplace](https://runmu.sh/marketplace/) from a GitHub tag or release, or as an uploaded `.tgz`.

## What the SDK covers

| Page | |
|---|---|
| [The manifest](/extensions/manifest) | `package.json`: contributions, activation, dependencies, world packs, capabilities |
| [Panels](/extensions/panels) | Dock panels, styles, `show` and badges |
| [Commands and settings](/extensions/commands-settings) | Palette commands, actions, the Settings page, preferences |
| [Events, sessions and GMCP](/extensions/events) | The event envelope, sessions, GMCP, Lua events, several clients |
| [Storage](/extensions/storage) | Device, account, world and session data, synced collections |
| [Protocols](/extensions/protocols) | MSDP, MXP, telnet, MCP 2.1, the editor, adapters and world packs |
| [Lines and input](/extensions/lines-input) | Line phases, input stages, completions, macros, send and request |
| [Surfaces](/extensions/surfaces) | Dialogs, menus, palette, alerts, files, themes, screen readers, HUD |
| [Hot reload and tests](/extensions/hot-reload) | The dev loop |

## Next

- [Build a panel in 10 minutes](/extensions/quickstart): scaffold one and load it.
- [The manifest](/extensions/manifest): what goes in `package.json`.
- [Upgrade to SDK 1.12](/extensions/migrating): from an earlier 1.x.
- [SDK reference](/reference/sdk/): every member of `mu`.
