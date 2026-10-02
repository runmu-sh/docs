---
title: WebAssembly helpers
description: Add a Rust crate to an extension, build it to a pinned .wasm, and call it from TypeScript with mu.wasm.load.
---

# WebAssembly helpers

<Since v="1.3" /> Put heavy work (pathfinding, parsing, counting) in a WebAssembly module and call it from your extension's TypeScript. Your TypeScript draws the panels. WebAssembly has no access to the page.

## 1. Scaffold with the crate

```sh
npm create @runmu.sh/extension my-ext -- --wasm -y
```

Besides the usual files you get:

| Path | |
|---|---|
| `wasm/` | A Rust `cdylib` crate with plain `#[no_mangle] extern "C"` exports: `add`, `alloc`, `dealloc`, `word_count`. No wasm-bindgen, so there is no JS glue. |
| `src/wasm.ts` | Loads the module and wraps its exports in typed functions. |
| `scripts/build-wasm.mjs` | Builds the crate and pins the result. |

For an existing project, copy those three from a scaffold made with `--wasm`, along with its `build`, `build:js` and `build:wasm` scripts and its `muclient.wasm` entry in `package.json`.

## 2. Build it

You need Rust and its WebAssembly target:

```sh
rustup target add wasm32-unknown-unknown
npm run build
```

With `--wasm`, `npm run build` runs `build:wasm` and then `build:js`. `build:wasm` runs `cargo build --target wasm32-unknown-unknown --release`, copies the module to `dist/<crate>.wasm` (the extension id with `.` and `-` turned into `_`), and writes its sha256 into `package.json`:

```json
{
  "muclient": {
    "wasm": { "dist/my_ext.wasm": "3f9a…" }
  }
}
```

Set `CARGO` to use another cargo.

## 3. Load it

```ts
import { defineExtension } from '@muclient/sdk';

interface Exports { add(a: number, b: number): number }

export default defineExtension({
  async activate({ mu }) {
    const { exports } = await mu.wasm.load('dist/my_ext.wasm');
    const { add } = exports as unknown as Exports;
    mu.log.info('add(2, 40) =', add(2, 40));
  },
});
```

`mu.wasm.load(path, imports?)` fetches `path` relative to the package root, instantiates it with `imports` (default none) and resolves to `{ module, instance, exports }`. Numbers pass straight through. For strings, the scaffold's `src/wasm.ts` calls `alloc`, writes UTF-8 into the module's memory, calls the export with a pointer and length, then `dealloc`s.

The example [runmu-sh/ext-wasm-add](https://github.com/runmu-sh/ext-wasm-add) (`wasm-add` on the marketplace) does the same with a 41-byte module written by hand in WebAssembly text (`wasm/add.wat`), for when you do not want Rust.

## Pinning

`muclient.wasm` is either a list of paths or an object of path → sha256 hex. μClient only loads a listed path. At install it fetches each listed file, checks it against the hash when the manifest gives one, and pins it. Every later load checks the bytes again.

`mu.wasm.load` rejects when:

- the path is not listed in `muclient.wasm`;
- the bytes differ from the pin. The extension then shows **changed** in **Extensions → Installed** until the player accepts the update;
- the file is not WebAssembly, or instantiation fails;
- the extension is a quick extension (one file, nothing to load);
- the extension was deactivated before the load finished.

::: tip
An extension loaded from the dev server loads any path, unpinned, fresh on every call. After you change the Rust code, run `npm run build:wasm`: when the bytes changed it rewrites the hash in `package.json`, and the dev server reloads on that.
:::

## Next

- [Hot reload and tests](/extensions/hot-reload): the dev server.
- [The manifest](/extensions/manifest): the rest of `muclient`.
- [Publish to the marketplace](/extensions/publish): the `.wasm` ships in the package.
