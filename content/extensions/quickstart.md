---
title: Build a panel in 10 minutes
description: Scaffold an extension with npm create muclient-extension, run the dev server, and load your panel into a running μClient.
audience: extensions
---

# Build a panel in 10 minutes

You need Node ≥ 18 and a μClient account.

## 1. Scaffold

```sh
npm create muclient-extension my-ext
```

It asks for an id, a package name, a display name, whether the panel example is Vue or plain DOM, and whether to add a Rust WebAssembly crate. For no prompts:

```sh
npm create muclient-extension my-ext -- --ui vue -y
```

::: tip
`create-muclient-extension` and `@muclient/sdk` are not on npm yet. In a μClient checkout, run the scaffolder from the repository with the local SDK instead: `node clients/create-muclient-extension/index.mjs my-ext --sdk local -y`.
:::

| Option | |
|---|---|
| `[dir]` | Target folder (default: the package name without its scope) |
| `--name <pkg>` | npm name (default `ext-<id>`) |
| `--id <id>` | Extension id, `[a-z0-9][a-z0-9._-]{0,63}` |
| `--display-name`, `--description` | Shown in μClient |
| `--ui vue\|dom` | The panel example (default `dom`) |
| `--wasm` / `--no-wasm` | Add the Rust crate (default no) |
| `--sdk <spec>` | The `@muclient/sdk` devDependency: a range (default `^1.3.0`), `file:<path>`, or `local` |
| `--install` | Run `npm install` afterwards |
| `-y`, `--yes` | No prompts |

## 2. What you got

- `package.json` with the `muclient` manifest: id, `api: "^1.3"`, `source`, and the contributions (a panel, a command, GMCP `Room 1`).
- `src/index.ts`: `defineExtension` with `mu.settings.define`, `mu.gmcp.supports` + `mu.gmcp.on('Room.Info')`, `mu.commands.register`, and `mu.panels.register` with `snapshot()` / `restore()` for hot reload.
- `src/panel.ts`: plain DOM with `mu.ui.css` classes, or a Vue component with render functions mounted with `mu.panels.vue`.
- `scripts/build.mjs`: esbuild, ESM, es2022, externals `vue`, `@muclient/sdk`, `@muclient/ui`, then a manifest check.
- `scripts/dev.mjs`: the dev server.

## 3. Run it

```sh
cd my-ext && npm install && npm run dev
```

In the client, open **☰ → Extensions**, go to **Advanced**, enter the dev server's URL under **Developer** and choose **load from dev server**. Your panel appears under **☰ → Views**. Edit `src/panel.ts` and save, and the panel reloads in place. [Hot reload](/extensions/hot-reload) has the details.

## Next

- [Panels](/extensions/panels): positions, singletons, per-session panels, the Views menu.
- [Commands and settings](/extensions/commands-settings).
- [GMCP and Lua events](/extensions/events): reacting to the game and to triggers.
- [Publish to the marketplace](/extensions/publish).
