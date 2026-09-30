---
title: Hot reload
description: Run the dev server, load your extension into a running μClient, and keep panel state across rebuilds with snapshot and restore.
---

# Hot reload

While you work, the dev server rebuilds your extension on every save and μClient swaps the new build in without closing its panels.

## 1. Start the dev server

In a project made with `npm create @runmu.sh/extension`:

```sh
npm run dev
```

The first line it prints is the address, `μClient dev server: http://localhost:5199/`. It builds `muclient.source` (default `src/index.ts`) into the file named by `exports` with the same esbuild settings as `npm run build`, plus an inline source map, and serves the folder on localhost only.

| Option | |
|---|---|
| `--port <n>` | Default 5199; `0` picks a free port |
| `--host <h>` | `127.0.0.1` (default), `localhost` or `::1`. Nothing else is accepted |
| `--quiet` | Print nothing, the address included |

Pass them after `--`: `npm run dev -- --port 5200`.

The dev server is the [`@runmu.sh/dev`](https://www.npmjs.com/package/@runmu.sh/dev) devDependency. To use it in a project that did not come from the scaffolder, `npm i -D @runmu.sh/dev esbuild` and run `npx runmu-dev .`. Set `$MUCLIENT_DEV` to a path to another `serve.mjs` to override it.

## 2. Load it in μClient

Open **☰ → Extensions**, go to the **Advanced** tab, and under **Developer** enter the dev server's address and choose **load from dev server**. The install prompt appears; accept it.

Opening the client with `?ext-dev=http://localhost:5199/` in its address does the same: it opens **Extensions → Advanced** with the prompt.

In **Extensions → Installed** the extension carries a **DEV** badge, a lamp that reads **live** or **dev server offline**, and the last build number with how long it took to load.

A dev extension:

- loads from `localhost`, `127.0.0.1` or `[::1]` only;
- is not pinned, so every rebuild runs without asking;
- stays on this device and is never synced to your account;
- cannot share its id with an extension you installed normally. Uninstall that one first.

::: tip
Chrome, Firefox and the desktop app reach the dev server from play.runmu.sh. Safari may block the connection.
:::

## 3. Save a file

On each save the dev server rebuilds and tells μClient. The client then:

1. fetches and imports the new build;
2. deactivates the running one, which disposes everything it registered;
3. activates the new one;
4. remounts its open panels in the same dock slots. Their tabs stay open.

A panel the new build no longer registers closes. A build that fails to compile, or fails to import, leaves the running one in place, and the error shows on the extension's card and in its **log**.

## Keep panel state

Everything in memory starts over on a reload. To carry a panel's state across, give it `snapshot` and `restore` <Since v="1.2" />:

```ts
import { defineExtension } from '@muclient/sdk';

export default defineExtension({
  activate({ mu }) {
    mu.panels.register({
      id: 'notes', title: 'Notes',
      mount(el) {
        el.innerHTML = `<input class="${mu.ui.css.inp}" name="draft" />`;
      },
      snapshot: (el) => el.querySelector('input')?.value,
      restore(el, saved) {
        const input = el.querySelector('input');
        if (input && typeof saved === 'string') input.value = saved;
      },
    });
  },
});
```

`snapshot(el, ctx)` runs on the old build right before its panel unmounts. Return a plain, JSON-like value, such as the input text or a scroll position. Returning `undefined` keeps nothing. `restore(el, state, ctx)` runs on the new build right after `mount`, with that value.

Snapshots are kept per panel id and session, so a panel open in two sessions gets each session's state back. Tabs of a `singleton: false` panel in one session share a single snapshot, and only one of them gets it back.

## What survives

| Survives a reload | Starts over |
|---|---|
| Open panel tabs and their places | Variables and objects in your module |
| What `snapshot` returned, handed to `restore` | Listeners, commands, stages, widgets: registered again by `activate` |
| `mu.storage` and `mu.settings` values | Scene fields set with `mu.scene.set`: they return to their old values until the new build sets them |

The **reload** button on an installed extension's card is a full restart: it deactivates the extension, closes its panels and activates it again, without `snapshot`.

## Next

- [Panels](/extensions/panels): `mount`, positions and per-session panels.
- [WebAssembly helpers](/extensions/wasm): rebuilding the `.wasm` during development.
- [Publish to the marketplace](/extensions/publish).
