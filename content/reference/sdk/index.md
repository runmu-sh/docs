---
title: "@muclient/sdk"
description: Every exported type, function and member of the extension SDK, with the version each one appeared in.
---

# @muclient/sdk

This page lists everything the extension SDK exports. The current version is **1.6.0**. A badge such as <Since v="1.1" /> marks the version a member appeared in. A member without one has been there since 1.0.

```ts
import { defineExtension } from '@muclient/sdk';

export default defineExtension({
  activate({ mu }) {
    mu.commands.register({ id: 'hello', title: 'Say hello', run: () => mu.ui.toast('Hello') });
  },
});
```

At runtime the bare import `@muclient/sdk` resolves through μClient's import map. Mark it external when you bundle. For the type checker, install the types from npm under that name: `npm i -D @muclient/sdk@npm:@runmu.sh/sdk@^1.6.0` (the scaffolder does this for you). μClient tracks everything you register through `ctx.mu` and disposes it when the extension is disabled, uninstalled or reloaded.

A manifest's `api` must name major version 1, with or without a caret (`"^1.3"`, `"1.6"`). μClient refuses anything else with "this μClient provides 1.x".

## Exports

| Export | Kind | Meaning |
|---|---|---|
| `SDK_VERSION` | `const string` | The SDK version, `'1.6.0'` |
| `defineExtension(def)` | function | Returns `def` unchanged, typed as an `ExtensionDef` |
| `Dispose` | type | `() => void`, returned by everything that registers |
| `ExtensionDef` | interface | What your entry file exports by default |
| `ExtensionContext` | interface | What `activate` receives |
| `Mu` | interface | The API object at `ctx.mu` |
| `SessionRef`, `LineView`, `LineCtx` | interfaces | Sessions and output lines |
| `PanelSpec`, `PanelMountCtx` | interfaces | Panels |
| `ScenePatch`, `SceneView` | interfaces | The Scene |
| `MediaSpec` | interface | A Media panel cue |
| `WidgetSpec` | interface | A HUD widget |
| `SettingSpec`, `SettingsSchema` | interfaces | An extension's Settings page |
| `CommandSpec` | interface | A command |
| `Storage` | interface | A key–value store |
| `WasmLoaded` | interface | A loaded WebAssembly module |

## defineExtension

```ts
function defineExtension(def: ExtensionDef): ExtensionDef
```

An identity helper. It returns `def` as it is, and gives your object literal its types.

## ExtensionDef

```ts
interface ExtensionDef {
  activate(ctx: ExtensionContext): void | unknown | Promise<void | unknown>;
  deactivate?(): void | Promise<void>;
}
```

| Member | Meaning |
|---|---|
| `activate(ctx)` | Called when the extension starts. What it returns (or resolves to) is the extension's exported API, which other extensions read with `ctx.api` |
| `deactivate()` | Optional. Called first when the extension stops. μClient then runs `ctx.subscriptions` and disposes what you registered through `mu`, newest first |

## ExtensionContext

```ts
interface ExtensionContext {
  id: string;
  version: string;
  mu: Mu;
  subscriptions: Dispose[];
  api<T = unknown>(otherId: string): Promise<T>;
}
```

| Member | Meaning |
|---|---|
| `id` | The extension's id |
| `version` | The installed version |
| `mu` | The API object ([Mu](#mu)) |
| `subscriptions` | Push extra disposers here, such as timers or listeners you made outside `mu`. They run on deactivate |
| `api(otherId)` <Since v="1.1" /> | The value another extension's `activate` returned. Takes the package name (`@muclient/ext-tickets`) or the id (`tickets`). Waits while that extension is still activating, and rejects when it is not enabled in this world |

## Mu

`ctx.mu` groups the API by area. Each `mu.*` section is one key of `Mu`.

### mu.panels

```ts
panels: {
  register(spec: PanelSpec): Dispose;
  open(id: string, params?: Record<string, unknown>): void;
  close(id: string): void;
  update(id: string, patch: { title?: string; inViewsMenu?: boolean }): void;
  autoAdd(id: string, sid: string): void;
  vue(component: unknown): PanelSpec['mount'];
  openWeb(spec: { url: string; id?: string; title?: string }, sid?: string): 'panel' | 'window' | 'blocked';
  closeWeb(id: string, sid?: string): void;
}
```

| Member | Meaning |
|---|---|
| `register(spec)` | Register a panel. The id must be unique, or `register` throws. Dispose unregisters it |
| `open(id, params?)` | Open a panel, passing `params` to its `mount` |
| `close(id)` | Close a panel |
| `update(id, patch)` <Since v="1.1" /> | Change a panel you registered: its tab and Views title, and whether the Views menu lists it. Throws for a panel this extension did not register |
| `autoAdd(id, sid)` <Since v="1.1" /> | Add the panel to a session's workspace the first time its data arrives. It happens once per world on each device |
| `vue(component)` <Since v="1.1" /> | Turn a Vue component into a `mount` function. The component gets the props `sid`, `worldId` and `params`. Import `vue` from the import map |
| `openWeb(spec, sid?)` <Since v="1.6" /> | Open a web page for a session, the way GMCP `Client.Web.Open` does. It opens in a Web panel or a new window, per **Settings → Access → Open web pages**. A site the player marked as refusing to be framed always gets a window. Only `http` and `https` URLs open. `id` names the page and defaults to the URL. Reopening an id replaces its page. `title` is the tab title. Returns where it went. The panel closes when the extension is disposed |
| `closeWeb(id, sid?)` <Since v="1.6" /> | Close a page this extension opened with `openWeb` |

### mu.commands

```ts
commands: { register(spec: CommandSpec): Dispose; run(id: string, arg?: unknown): void }
```

| Member | Meaning |
|---|---|
| `register(spec)` | Register a command. The id must be unique, or `register` throws. Dispose unregisters it |
| `run(id, arg?)` | Run a command by id |

### mu.sessions

```ts
sessions: {
  active(): SessionRef | null;
  list(): SessionRef[];
  send(text: string, sid?: string): Promise<void>;
  echo(text: string, sid?: string): void;
  on(ev: 'line', fn: (line: LineView, s: { sid: string }) => void): Dispose;
  on(ev: 'switch', fn: (s: SessionRef | null) => void): Dispose;
}
```

| Member | Meaning |
|---|---|
| `active()` | The session in front, or `null` |
| `list()` | Every open session |
| `send(text, sid?)` | Send a command as if typed. It goes through the input pipeline, so separators and aliases apply |
| `echo(text, sid?)` | Show a local line in the session's terminal. Nothing goes to the game |
| `on('line', fn)` | Call `fn` for each output line, with the session id |
| `on('switch', fn)` | Call `fn` when the active session changes, with the new one or `null` |

### mu.lines

```ts
lines: {
  stage(spec: { id: string; order?: number; run(line: LineView, ctx: LineCtx): void }): Dispose;
}
```

| Member | Meaning |
|---|---|
| `stage(spec)` | Add a stage to the output line pipeline. `order` is clamped to 300 or more, so your stage runs after the parser, the classifier and quick rules. `run` can change the line's `category` and `rowCls`, and use `ctx` to gag it or add text after it |

### mu.gmcp

```ts
gmcp: {
  on(pkg: string, fn: (data: unknown, s: { sid: string; pkg: string }) => void): Dispose;
  state(pkg: string, sid?: string): unknown;
  send(pkg: string, data?: unknown, sid?: string): Promise<boolean>;
  supports(pkgs: string[]): Dispose;
}
```

| Member | Meaning |
|---|---|
| `on(pkg, fn)` | Call `fn` for each GMCP message of `pkg`. `pkg` matches exactly, or as a prefix when it ends with `.` or is a bare namespace (`'Room'`). `s.pkg` is the package that arrived |
| `state(pkg, sid?)` | The last value seen for a package on a session |
| `send(pkg, data?, sid?)` <Since v="1.1" /> | Send a GMCP message to the game (default the active session). Resolves `false` when the transport cannot send GMCP |
| `supports(pkgs)` <Since v="1.1" /> | Announce packages with `Core.Supports.Add` on every connected session of the active world, for example `['Client.Tickets 1']`. Dispose sends `Core.Supports.Remove` |

### mu.scene

The room μClient tracks for a session from GMCP `Room.*`, `Char.Items.*`, MSDP and `mu.scene.set`. The Scene panel is the first-party extension `scene` (`@muclient/ext-scene`), which reads it through `get` and `watch`.

```ts
scene: {
  set(patch: ScenePatch, sid?: string): Dispose;
  get(sid?: string): SceneView | null;
  watch(fn: (scene: SceneView) => void, sid?: string): Dispose;
}
```

| Member | Meaning |
|---|---|
| `set(patch, sid?)` <Since v="1.1" /> | Feed the scene, for telnet-only games or code that knows the room. Dispose clears what this call set |
| `get(sid?)` <Since v="1.4" /> | A copy of the scene now. Default the active session. `null` with no session |
| `watch(fn, sid?)` <Since v="1.4" /> | Call `fn` with the scene now and on every change, for one session (default the one active at call time). Dispose stops it |

### mu.channels <Since v="1.1" />

```ts
channels: { push(channel: string, sender: string, text: string, sid?: string): Dispose }
```

| Member | Meaning |
|---|---|
| `push(channel, sender, text, sid?)` | Add a message to the Channels panel. Mentions and unread counts follow the channel's settings. Dispose removes the message |

### mu.media <Since v="1.1" />

```ts
media: {
  play(spec: MediaSpec, sid?: string): Dispose;
  stop(filter?: { name?: string; key?: string; type?: 'music' | 'sound' }, sid?: string): void;
}
```

| Member | Meaning |
|---|---|
| `play(spec, sid?)` | Play a cue through the Media panel. Dispose stops it |
| `stop(filter?, sid?)` | Stop the cues that match `filter` |

### mu.widgets <Since v="1.1" />

```ts
widgets: { show(spec: WidgetSpec, sid?: string): Dispose; close(id: string, sid?: string): void }
```

| Member | Meaning |
|---|---|
| `show(spec, sid?)` | Place a card, menu, form, table or gauge on the HUD. Showing the same `id` again replaces it. Dispose closes it |
| `close(id, sid?)` | Close a widget |

### mu.settings <Since v="1.1" />

Values resolve in the order world, then all worlds, then the setting's default.

```ts
settings: {
  define(schema: SettingsSchema): Dispose;
  get<T = unknown>(key: string, worldId?: string | null): T;
  set(key: string, value: unknown, worldId?: string | null): void;
  watch<T = unknown>(key: string, fn: (value: T) => void): Dispose;
  open(): void;
}
```

| Member | Meaning |
|---|---|
| `define(schema)` | Register the extension's Settings page, a sub-page of **Settings → Extensions**. μClient renders it from the schema. Values sync with the account |
| `get(key, worldId?)` | The resolved value of a setting |
| `set(key, value, worldId?)` | Write a value to `worldId` (default the active world) when the setting's scope allows, otherwise for all worlds. Pass `null` for all worlds |
| `watch(key, fn)` | Call `fn` when the value changes |
| `open()` | Open the extension's Settings page |

### mu.lua

```ts
lua: { on(name: string, fn: (data: unknown, s: { sid: string; name: string }) => void): Dispose }
```

| Member | Meaning |
|---|---|
| `on(name, fn)` | Call `fn` with the data of each Lua [`ext.emit(name, data)`](/automation/ext-emit), and the session id and event name |

### mu.ui

```ts
ui: {
  toast(title: string, body?: string, opts?: { kind?: string }): void;
  css: Record<'btn' | 'primary' | 'tool' | 'chip' | 'inp' | 'secHead' | 'empty' | 'framed' | 'badge' | 'lamp' | 'glow'
    | 'cmd' | 'toggle' | 'plate' | 'count' | 'field' | 'row' | 'label', string>;
  style(css: string): Dispose;
}
```

| Member | Meaning |
|---|---|
| `toast(title, body?, opts?)` | Show a toast. `opts.kind` <Since v="1.1" /> is the small label above the title, such as a module name (default `'info'`) |
| `css` | Class names of μClient's style primitives, for code that does not use Vue. `tool` and `chip` render as the borderless `cmd` (`[ LABEL ]`) and `toggle` (`■ LABEL`) primitives. The keys `cmd`, `toggle`, `plate`, `count`, `field`, `row` and `label` <Since v="1.5" /> |
| `style(css)` <Since v="1.1" /> | Inject a stylesheet for this extension's panels. Use theme tokens. Dispose removes it |

### mu.theme

```ts
theme: { cssVar(name: string): string }
```

| Member | Meaning |
|---|---|
| `cssVar(name)` | The current value of a theme CSS variable, with or without the leading `--` |

### mu.storage

```ts
storage: { world(worldId?: string | null): Storage; global: Storage }
```

| Member | Meaning |
|---|---|
| `world(worldId?)` | A store for one world (default the active world) |
| `global` | A store shared by every world |

### mu.wasm <Since v="1.3" />

```ts
wasm: { load(path: string, imports?: WebAssembly.Imports): Promise<WasmLoaded> }
```

| Member | Meaning |
|---|---|
| `load(path, imports?)` | Fetch `path` (relative to the package root, such as `'dist/pathfind.wasm'`) from the extension's own base and instantiate it with `imports`. WebAssembly never drives the DOM |

The path must be listed in the manifest's `muclient.wasm`, as a list of paths or an object of path to sha256 hex. The sha256 is pinned at install and checked on every load. `load` rejects when:

- the path is not listed (dev extensions are exempt)
- the bytes changed since install (the extension shows "changed" until you accept the update)
- the file is not WebAssembly, or instantiation fails
- the extension is a quick extension
- the extension was deactivated before the load finished

### mu.log

```ts
log: { info(...a: unknown[]): void; warn(...a: unknown[]): void; error(...a: unknown[]): void }
```

| Member | Meaning |
|---|---|
| `info`, `warn`, `error` | Log at that level, tagged with the extension |

## Sessions and lines

### SessionRef

```ts
interface SessionRef { id: string; worldId: string; worldName: string; state: string }
```

| Field | Meaning |
|---|---|
| `id` | The session id (`sid` elsewhere) |
| `worldId`, `worldName` | The **world** it belongs to |
| `state` | The connection state |

### LineView

```ts
interface LineView {
  readonly id: number;
  readonly ts: number;
  readonly text: string;
  readonly kind: 'output' | 'echo' | 'system' | 'prompt';
  category: 'speech' | 'pose' | 'combat' | 'comms' | 'look' | 'system';
  rowCls?: string;
}
```

| Field | Meaning |
|---|---|
| `id` | The line's id |
| `ts` | Its timestamp |
| `text` | The text |
| `kind` | Where it came from: the game, a local echo, μClient itself, or a prompt |
| `category` | The classifier's reading. A stage can change it |
| `rowCls` | An extra class for the row. A stage can set it |

### LineCtx

```ts
interface LineCtx { sid: string; worldId: string; gag(): void; after(text: string): void }
```

| Member | Meaning |
|---|---|
| `sid`, `worldId` | The line's session and world |
| `gag()` | Hide the line |
| `after(text)` | Add a line after this one |

## Panels

### PanelSpec

```ts
interface PanelSpec {
  id: string;
  title: string;
  mount(el: HTMLElement, ctx: PanelMountCtx): void | Dispose;
  singleton?: boolean;
  perSession?: boolean;
  defaultPosition?: 'left' | 'right-top' | 'right-bottom' | 'float';
  inViewsMenu?: boolean;
  order?: number;
  snapshot?(el: HTMLElement, ctx: PanelMountCtx): unknown;
  restore?(el: HTMLElement, state: unknown, ctx: PanelMountCtx): void;
}
```

| Member | Meaning |
|---|---|
| `id` | The panel id |
| `title` | The tab and Views menu title |
| `mount(el, ctx)` | Render into `el` with any framework or plain DOM. Return a cleanup function if you need one |
| `singleton` | One instance only |
| `perSession` | One instance per session |
| `defaultPosition` | Where it opens the first time (default `'right-bottom'`) |
| `inViewsMenu` <Since v="1.1" /> | Listed in the Views menu (default `true`). Change it later with `mu.panels.update` |
| `order` <Since v="1.4" /> | Place in the Views menu, lower first (default 200). Core panels: Terminal 0, Channels 20, Media 30, Feeds 50, Web page 210, then μClient's own at 300 and up. The Scene extension takes 10 |
| `snapshot(el, ctx)` <Since v="1.2" /> | Hot reload: called on the old build right before its panel unmounts. Return JSON-like state such as input text or a scroll position. `undefined` keeps nothing |
| `restore(el, state, ctx)` <Since v="1.2" /> | Hot reload: called on the new build right after `mount`, with what `snapshot` returned |

### PanelMountCtx

```ts
interface PanelMountCtx {
  sid: string | null;
  worldId: string | null;
  params: Record<string, unknown>;
}
```

| Field | Meaning |
|---|---|
| `sid` | The session the panel belongs to. `null` for a global panel with no active session |
| `worldId` | Its world, or `null` |
| `params` | What `mu.panels.open` passed |

## Scene

### ScenePatch <Since v="1.1" />

A patch for the Scene. Fields you leave out stay as they are.

```ts
interface ScenePatch {
  title?: string;
  area?: string;
  desc?: string;
  atmosphere?: string;
  pose?: string;
  exits?: string[];
  present?: string[];
  items?: Array<{ id?: string; name: string; hostile?: boolean }>;
}
```

| Field | Meaning |
|---|---|
| `title` | The room title, shown in the Scene header and the HUD location |
| `area` | The area name |
| `desc` | The room description |
| `atmosphere` | The italic atmosphere line |
| `pose` | The pose line with the left rule |
| `exits` | Exit names |
| `present` | Names of the people present |
| `items` | Things in the room, optionally marked hostile |

### SceneView <Since v="1.4" />

What the Scene holds for a session. The same fields as `ScenePatch`, all present, plus `known`.

```ts
interface SceneView {
  known: boolean;
  title: string;
  area: string;
  desc: string;
  atmosphere: string;
  pose: string;
  exits: string[];
  present: string[];
  items: Array<{ id: string; name: string; hostile?: boolean }>;
}
```

| Field | Meaning |
|---|---|
| `known` | `false` until a room name, description or exit arrives. The Scene shows "No room yet" until then |

## MediaSpec <Since v="1.1" />

A cue for the Media panel, the same shape as GMCP `Client.Media.Play`.

```ts
interface MediaSpec {
  name: string;
  url?: string;
  type?: 'music' | 'sound';
  volume?: number;
  loops?: number;
  key?: string;
}
```

| Field | Meaning |
|---|---|
| `name` | The file name, resolved against `url` or the session's media base |
| `url` | A base URL |
| `type` | Music or a sound |
| `volume` | 0 to 100, default 50 |
| `loops` | Repeat count. `-1` loops forever |
| `key` | Identity for `stop({ key })`. Defaults to `name` |

## WidgetSpec <Since v="1.1" />

A HUD widget. Gauges stack top left, and the other types show as cards on the right.

```ts
interface WidgetSpec {
  id: string;
  type: 'card' | 'menu' | 'form' | 'table' | 'gauge';
  title?: string;
  body?: string;
  buttons?: Array<{ label: string; cmd?: string }>;
  options?: Array<{ label: string; cmd?: string }>;
  fields?: Array<{ name: string; label?: string; type?: 'input' | 'select' | 'textarea'; options?: string[]; value?: string; placeholder?: string }>;
  cmd?: string;
  submit?: string;
  columns?: string[];
  rows?: Array<Array<string | number>>;
  value?: number;
  max?: number;
  color?: 'accent' | 'accent-bright' | 'ok' | 'gold' | 'alert';
  label?: string;
  dismissible?: boolean;
  source?: string;
  order?: number;
}
```

| Field | Meaning |
|---|---|
| `id` | The widget id. Showing the same id replaces the widget |
| `type` | Which kind of widget |
| `title`, `body` | Heading and text |
| `buttons` | Buttons, each sending `cmd` |
| `options` | Menu entries, each sending `cmd` |
| `fields` | Form fields |
| `cmd` | For a form: a command template with `{field}` placeholders |
| `submit` | The submit button's label |
| `columns`, `rows` | Table headings and cells |
| `value`, `max` | A gauge's value and maximum |
| `color` | A token name for the gauge fill |
| `label` | A gauge's label |
| `dismissible` | The player can close it |
| `source` | Who shows it. μClient sets the extension id when you leave it out |
| `order` | Sort order |

## Settings

### SettingSpec <Since v="1.1" />

One row on an extension's Settings page.

```ts
interface SettingSpec<T = string | number | boolean> {
  key: string;
  label: string;
  default: T;
  kind?: 'toggle' | 'range' | 'select' | 'text';
  options?: Array<{ value: T; label: string }>;
  min?: number; max?: number; step?: number; unit?: string;
  hint?: string;
  group?: string;
  scope?: 'global' | 'world' | 'both';
}
```

| Field | Meaning |
|---|---|
| `key` | The key within the extension. It is stored as `ext.<id>.<key>` |
| `label` | The row label |
| `default` | The value when nothing is set |
| `kind` | The control |
| `options` | Choices for a select |
| `min`, `max`, `step`, `unit` | For a range |
| `hint` | Help text under the row |
| `group` | The group heading the row sits under |
| `scope` | `'both'` (default): per world, falling back to all worlds. `'world'` or `'global'` for one of the two |

### SettingsSchema

```ts
interface SettingsSchema { title?: string; items: SettingSpec[] }
```

| Field | Meaning |
|---|---|
| `title` | The page title |
| `items` | The rows |

## CommandSpec

```ts
interface CommandSpec { id: string; title: string; keys?: string[]; run(arg?: unknown): void | Promise<void> }
```

| Field | Meaning |
|---|---|
| `id` | The command id |
| `title` | Its name in μClient |
| `keys` | Default key bindings, such as `['Ctrl+J']` |
| `run(arg?)` | What it does |

## Storage

```ts
interface Storage {
  get<T = unknown>(key: string, fallback?: T): T;
  set(key: string, value: unknown): void;
  delete(key: string): void;
  keys(): string[];
}
```

| Member | Meaning |
|---|---|
| `get(key, fallback?)` | The stored value, or `fallback` |
| `set(key, value)` | Store a value |
| `delete(key)` | Remove a key |
| `keys()` | Every key in the store |

## WasmLoaded <Since v="1.3" />

What `mu.wasm.load` resolves to.

```ts
interface WasmLoaded {
  module: WebAssembly.Module;
  instance: WebAssembly.Instance;
  exports: WebAssembly.Exports;
}
```

| Field | Meaning |
|---|---|
| `module` | The compiled module |
| `instance` | The instance |
| `exports` | `instance.exports` |

## Next

- [SDK changelog](/reference/changelog): what each version added.
- [Build a panel in 10 minutes](/extensions/quickstart).
- [Talking to extensions](/automation/ext-emit): the Lua side of `mu.lua.on`.
