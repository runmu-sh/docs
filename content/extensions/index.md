---
title: What an extension is
audience: extensions
---

# What an extension is

An extension is an npm package with a `muclient` manifest in its `package.json` and one ES module that the client loads. It gets a `mu` object, the SDK, and with it registers **panels** (any framework or plain DOM, mounted into the client's layout), **commands**, **settings**, listeners for **GMCP** packages and for **Lua events**, and optional **WebAssembly** helpers. Everything it registers is tracked and disposed when the extension is disabled, uninstalled or hot-reloaded, so there is no manual cleanup.

- Written in TypeScript against `@muclient/sdk` (types only; the client supplies the runtime through its import map).
- Built with esbuild to one `dist/index.mjs`; `vue` is external, so a Vue panel uses the client's Vue.
- Developed with a dev server that hot-reloads the extension in a running client, keeping panel state across reloads.
- Published to the [marketplace](https://runmu.sh/marketplace/) from a GitHub release.

Start with [Build a panel in 10 minutes →](/extensions/quickstart)
