---
title: Build a panel in 10 minutes
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

| Option | |
|---|---|
| `[dir]` | Target folder (default: the package name without its scope) |
| `--name <pkg>` | npm name (default `ext-<id>`) |
| `--id <id>` | Extension id, `[a-z0-9][a-z0-9._-]{0,63}` |
| `--display-name`, `--description` | Shown in μClient |
| `--ui vue\|dom` | The panel example (default `dom`) |
| `--wasm` / `--no-wasm` | Add the Rust crate (default no) |
| `--install` | Run `npm install` afterwards |

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

Open the client, **Extensions → Develop**, and point it at the dev server's URL. Your panel appears in the Views menu. Edit `src/panel.ts`, save, and watch it reload in place.

## 4. Next

- [Panels](/extensions/panels): positions, singletons, per-session panels, the Views menu.
- [Commands and settings](/extensions/commands-settings).
- [GMCP and Lua events](/extensions/events): reacting to the game and to triggers.
- [Publish to the marketplace](/extensions/publish).
