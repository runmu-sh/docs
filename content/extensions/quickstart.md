---
title: Build a panel in 10 minutes
description: Scaffold an extension with npm create @runmu.sh/extension, run the dev server, and load your panel into a running μClient.
audience: extensions
---

# Build a panel in 10 minutes

You need Node ≥ 20 and a μClient account.

## 1. Scaffold

```sh
npm create @runmu.sh/extension my-ext
```

It asks for an id, a package name, a display name, whether the panel example is Vue or plain DOM, and whether to add a Rust WebAssembly crate. For no prompts:

```sh
npm create @runmu.sh/extension my-ext -- --ui vue -y
```

| Option | |
|---|---|
| `[dir]` | Target folder (default: the package name without its scope) |
| `--name <pkg>` | npm name (default `ext-<id>`) |
| `--id <id>` | Extension id, `[a-z0-9][a-z0-9._-]{0,63}` |
| `--display-name`, `--description` | Shown in μClient |
| `--ui vue\|dom` | The panel example (default `dom`) |
| `--wasm` / `--no-wasm` | Add the Rust crate (default no) |
| `--sdk <spec>` | The `@muclient/sdk` devDependency (default `npm:@runmu.sh/sdk@^1.12.0`), a `file:<path>`, or `local` for the SDK of the μClient checkout the tool runs from |
| `--install` | Run `npm install` afterwards |
| `--force` | Write into a folder that is not empty |
| `-y`, `--yes` | No prompts |

::: tip
Prefer to start from a working example? [runmu-sh/extension_template](https://github.com/runmu-sh/extension_template) is the same project with a Hello world panel and three examples (a Vue panel, GMCP rooms, a line trigger). Choose **Use this template** on GitHub.
:::

## 2. What you got

- `package.json` with the `muclient` manifest: id, `api: "^1.12"`, `source`, and the contributions (a panel, a command, GMCP `Room 1`).
- `src/index.ts`: `defineExtension` with `mu.settings.define`, `mu.gmcp.supports` + `mu.gmcp.on('Room.Info')`, `mu.commands.register`, and `mu.panels.register` with `snapshot()` / `restore()` for hot reload.
- `src/panel.ts`: plain DOM with `mu.ui.css` classes, or a Vue component with render functions mounted with `mu.panels.vue`.
- `scripts/build.mjs`: esbuild, ESM, es2022, externals `vue`, `@muclient/sdk`, `@muclient/ui`, then a manifest check.
- `scripts/dev.mjs`: starts the dev server.
- `test/index.test.mjs` and `test/fixtures/session.murec`: `npm test` runs the extension in a headless host and replays a recorded session. See [Test headless](/extensions/hot-reload#test-headless).
- `CHANGELOG.md`, and `.github/workflows/ci.yml`, which builds, typechecks and tests on every push.

Two devDependencies come from npm. `@muclient/sdk` is an alias of [`@runmu.sh/sdk`](https://www.npmjs.com/package/@runmu.sh/sdk): you import `@muclient/sdk`, the name the client's import map supplies at runtime, and the package gives the type checker its types. [`@runmu.sh/dev`](https://www.npmjs.com/package/@runmu.sh/dev) 0.2 is the dev server and the headless test host.

## 3. Run it

```sh
cd my-ext && npm install && npm run dev
```

In the client, open **☰ → Extensions**, go to **Advanced**, enter the dev server's URL under **Developer** and choose **load from dev server**. Your panel appears under **☰ → Views**. Edit `src/panel.ts` and save, and the panel reloads in place. [Hot reload and tests](/extensions/hot-reload) has the details.

## 4. Put it on GitHub

```sh
git init && git add -A && git commit -m "First version"
gh repo create you/my-ext --public --source . --push
```

When it is ready, [publish it to the marketplace](/extensions/publish): link the repository and push a version tag, or upload the `npm pack` tarball.

## Examples to read

Every first-party extension was made with this tool and is published the same way: a `vX.Y.Z` tag on its repository reaches the marketplace through the GitHub link. None is bundled with the client; players install them from **☰ → Extensions → Discover**.

| Extension | Repository | Shows |
|---|---|---|
| Scene | [runmu-sh/ext-scene](https://github.com/runmu-sh/ext-scene) | A default-layout panel over `mu.scene.watch` |
| Room Notes | [runmu-sh/ext-roomnotes](https://github.com/runmu-sh/ext-roomnotes) | Panel, command, GMCP `Room.Info`, a line stage, Lua `ext.emit`, per-world storage |
| WASM Add | [runmu-sh/ext-wasm-add](https://github.com/runmu-sh/ext-wasm-add) | [`mu.wasm.load`](/extensions/wasm) with a pinned hash |
| Vitals | [runmu-sh/ext-vitals](https://github.com/runmu-sh/ext-vitals) | GMCP `Char.Vitals` into status-bar gauges |
| Web pages | [runmu-sh/ext-webpages](https://github.com/runmu-sh/ext-webpages) | GMCP `Client.Web.*` into `mu.panels.openWeb` |
| Tickets | [runmu-sh/ext-tickets](https://github.com/runmu-sh/ext-tickets) | Two panels and a typed exported API (`ctx.api('tickets')`) |
| Assist | [runmu-sh/ext-assist](https://github.com/runmu-sh/ext-assist) | A GMCP-driven staff queue |
| Puppets | [runmu-sh/ext-puppets](https://github.com/runmu-sh/ext-puppets) | Per-puppet feeds with unread counts |

Tickets, Assist and Puppets share [`@runmu.sh/ext-kit`](https://www.npmjs.com/package/@runmu.sh/ext-kit) ([runmu-sh/ext-kit](https://github.com/runmu-sh/ext-kit)): DOM helpers, the `.mx` panel CSS, a GMCP payload validator and a list model. Any extension can use it; esbuild bundles it in.

## Next

- [Panels](/extensions/panels): positions, singletons, per-session panels, the Views menu.
- [Commands and settings](/extensions/commands-settings).
- [Events, sessions and GMCP](/extensions/events): reacting to the game and to triggers.
- [Publish to the marketplace](/extensions/publish).
