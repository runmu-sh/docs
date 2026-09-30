---
title: What an extension is
description: An extension is an npm package that μClient loads, with a TypeScript SDK for panels, commands, settings, game events and WebAssembly helpers.
audience: extensions
---

# What an extension is

An extension is an npm package with a `muclient` manifest in its `package.json` and one ES module that the client loads. It gets a `mu` object, the SDK, and with it registers **panels** (any framework or plain DOM, mounted into the client's layout), **commands**, **settings**, listeners for **GMCP** packages and for **Lua events**, and optional **WebAssembly** helpers. Everything it registers is tracked and disposed when the extension is disabled, uninstalled or hot-reloaded, so you do not clean up by hand.

- Written in TypeScript against `@muclient/sdk`. The types come from npm as [`@runmu.sh/sdk`](https://www.npmjs.com/package/@runmu.sh/sdk); the client supplies the runtime through its import map.
- Built with esbuild to one `dist/index.js`; `vue` is external, so a Vue panel uses the client's Vue.
- Developed with a dev server that hot-reloads the extension in a running client. Panels that implement `snapshot` and `restore` keep their state across reloads.
- Published to the [marketplace](https://runmu.sh/marketplace/) from a GitHub tag or release, or as an uploaded `.tgz`.

## Next

- [Build a panel in 10 minutes](/extensions/quickstart): scaffold one and load it.
- [The manifest](/extensions/manifest): what goes in `package.json`.
- [SDK reference](/reference/sdk/): every member of `mu`.
