---
title: "@muclient/sdk"
description: Every exported type, function and member of the extension SDK, with the version each one appeared in.
---

# @muclient/sdk

This page lists everything the extension SDK exports. The current version is **1.12.0**. A badge such as <Since v="1.1" /> marks the version a member appeared in. A member without one has been there since 1.0. The guide pages explain each area with examples. This page is the list.

```ts
import { defineExtension } from '@muclient/sdk';

export default defineExtension({
  activate({ mu }) {
    mu.commands.register({ id: 'hello', title: 'Say hello', run: () => mu.ui.toast('Hello') });
  },
});
```

At runtime the bare import `@muclient/sdk` resolves through μClient's import map. Mark it external when you bundle. For the type checker, install the types from npm under that name: `npm i -D @muclient/sdk@npm:@runmu.sh/sdk@^1.12.0` (the scaffolder does this for you). μClient tracks everything you register through `ctx.mu` and disposes it when the extension is disabled, uninstalled or reloaded.

A manifest's `api` is a semver range of major version 1 (`"^1.12"`, `"1.6"`). A μClient whose SDK is older than the range refuses the extension, and tells the player to update. See [`api`](/extensions/manifest#api).

## Exports

| Export | Kind | Meaning |
|---|---|---|
| `SDK_VERSION` | `const string` | The SDK version, `'1.12.0'` |
| `defineExtension(def)` | function | Returns `def` unchanged, typed as an `ExtensionDef` |
| `h(tag, attrs, ...children)` <Since v="1.12" /> | function | Build DOM without HTML strings. Also `mu.ui.h` |
| `THEME_TOKENS` <Since v="1.11" /> | `const` | The theme tokens a line style may use |
| `CHANNEL_COLORS` <Since v="1.7" /> | `const` | The colours a channel may take |
| `PUBLIC_COMMANDS` <Since v="1.12" /> | `const` | The core command ids `mu.commands.run` may run |
| `QuotaExceeded` <Since v="1.9" /> | class | Thrown by a store write over its quota |
| `Dispose` | type | `() => void`, returned by everything that registers |
| `ExtensionDef`, `ExtensionContext`, `CallerContext`, `Mu` | interfaces | The extension and its API object |
| `EventMeta`, `Origin`, `EffectOpts`, `SessionFilter` <Since v="1.8" /> | types | The [event envelope](/extensions/events#the-event-envelope) and effect options |
| `SessionRef`, `SessionMetaView`, `SendOptions`, `SendResult`, `RequestOptions`, `RequestTimeoutError` | interfaces | Sessions |
| `LineView`, `LineCtx`, `LineEdit`, `LineStageSpec`, `LinePhase`, `LineCategory`, `RowClass`, `SpanStyle`, `SpanView`, `TextRange`, `ThemeToken` | types | [Lines](/extensions/lines-input#line-phases) |
| `InputEdit`, `InputStageSpec`, `InputPhase`, `InputSource`, `CompletionSpec`, `CompletionItem`, `MacroSpec` <Since v="1.11" /> | types | [Input](/extensions/lines-input#input-stages) |
| `PanelSpec`, `PanelMountCtx` | interfaces | Panels |
| `MenuSpec`, `ContextMenuSpec`, `ContextTarget`, `PaletteProviderSpec`, `PaletteItem`, `ConfirmSpec`, `PromptSpec`, `PickSpec`, `ModalSpec`, `ModalHandle`, `OverlaySpec`, `FileSaveSpec`, `HudSpec`, `ThemeSpec`, `ThemeTokens`, `ThemeInfo` <Since v="1.12" /> | types | [Surfaces](/extensions/surfaces) |
| `ActionSpec`, `ActionResult`, `ActionSession`, `When`, `PublicCommand` <Since v="1.12" /> | types | Actions and commands |
| `ScenePatch`, `SceneView`, `ChannelsView`, `ChannelView`, `ChannelMessage`, `ChannelProvide`, `ChannelColor`, `FeedsView`, `MediaView`, `MediaSpec` | interfaces | The Scene, Channels, Feeds and Media |
| `McpArgs`, `McpMessages`, `McpMeta`, `McpSendResult`, `McpCord`, `MxpElement`, `SpanPatch`, `EditorSpec`, `EditorHandle`, `GmcpRequestOpts` <Since v="1.10" /> | types | [Protocols](/extensions/protocols) |
| `WidgetSpec` | interface | A HUD widget |
| `SettingSpec`, `SettingsSchema`, `SettingScopeOpts`, `CorePrefs`, `CorePrefName`, `CorePageId` | interfaces | Settings and preferences |
| `CommandSpec` | interface | A command |
| `Storage`, `Store`, `Collection`, `CollectionChange`, `ChangeMeta`, `SyncChannel`, `SyncChannelOpts` | interfaces | [Storage](/extensions/storage) and sync |
| `WasmLoaded` | interface | A loaded WebAssembly module |

Two subpaths carry more types:

| Import | |
|---|---|
| `@muclient/sdk/gmcp` <Since v="1.10" /> | `GmcpPackages` (augment it for your game's packages), `GmcpData<P>`, and the reducers that merge each package into state (`REDUCERS`, `reducerOf`, and `@muclient/sdk/gmcp/reducers.json`) |
| `@muclient/sdk/ui` | The types of [`@muclient/ui`](/extensions/surfaces#shared-components): `Modal`, `Dialog`, `Menu`, `OnOff`, `SafeHtml` |

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
  exports(factory: (caller: CallerContext) => unknown): void;
}
```

| Member | Meaning |
|---|---|
| `id` | The extension's id |
| `version` | The installed version |
| `mu` | The API object ([Mu](#mu)) |
| `subscriptions` | Push extra disposers here, such as timers or listeners you made outside `mu`. They run on deactivate |
| `api(otherId)` <Since v="1.1" /> | The API another extension exports. Takes the package name (`@muclient/ext-tickets`) or the id (`tickets`). Waits while that extension is still activating, and rejects when it is not enabled in this world |
| `exports(factory)` <Since v="1.12" /> | Export one API per calling extension, in place of `activate`'s return value. `factory` runs once for each caller with `{ id, track }`. What `caller.track(dispose)` registers goes when the caller is disabled, so a listener another extension adds through your API cannot outlive it |

```ts
ctx.exports((caller) => ({
  onTicket: (fn: (t: Ticket) => void) => caller.track(listen(fn)),
}));
```

## Mu

`ctx.mu` groups the API by area. Each `mu.*` section is one key of `Mu`. Members that take `sid?` default to the active session. Members that take `opts?: SessionFilter` listen on every session in scope, or on one with `{ sid }`.

### mu.panels

```ts
panels: {
  register(spec: PanelSpec): Dispose;
  open(id: string, params?: Record<string, unknown>, opts?: { title?: string; sid?: string; focus?: boolean }): void;
  close(id: string): void;
  update(id: string, patch: { title?: string; inViewsMenu?: boolean }): void;
  autoAdd(id: string, sid: string): void;
  vue(component: unknown): PanelSpec['mount'];
  openWeb(spec: { url: string; id?: string; title?: string }, sid?: string): 'panel' | 'window' | 'blocked';
  closeWeb(id: string, sid?: string): void;
  badge(id: string, badge: { count?: number; mention?: boolean } | null, sid?: string): void;
  touch(id: string, sid: string): void;
}
```

| Member | Meaning |
|---|---|
| `register(spec)` | Register a panel. The id must be unique, or `register` throws. Dispose unregisters it |
| `open(id, params?, opts?)` | Open a panel, passing `params` to its `mount`. `opts` <Since v="1.7" />: the tab `title`, the session `sid` whose workspace it opens in, and `focus: false` to open it behind |
| `close(id)` | Close a panel |
| `update(id, patch)` <Since v="1.1" /> | Change a panel you registered: its tab and Views title, and whether the Views menu lists it. Throws for a panel this extension did not register |
| `autoAdd(id, sid)` <Since v="1.1" /> | Add the panel to a session's workspace the first time its data arrives. It happens once per world on each device |
| `vue(component)` <Since v="1.1" /> | Turn a Vue component into a `mount` function. The component gets the props `sid`, `worldId` and `params`. Import `vue` from the import map |
| `openWeb(spec, sid?)` <Since v="1.6" /> | Open a web page for a session, the way GMCP `Client.Web.Open` does. It opens in a Web panel or a new window, per **Settings → Access → Open web pages**. A site the player marked as refusing to be framed always gets a window. Only `http` and `https` URLs open. `id` names the page and defaults to the URL. Reopening an id replaces its page. `title` is the tab title. Returns where it went. The panel closes when the extension is disposed |
| `closeWeb(id, sid?)` <Since v="1.6" /> | Close a page this extension opened with `openWeb` |
| `badge(id, badge, sid?)` <Since v="1.12" /> | A count or mention mark on the panel's tab, added to the world's unread. Every client shows it. `null` clears it |
| `touch(id, sid)` <Since v="1.12" /> | Report data for a `show: 'auto'` panel: it is listed, and added to the workspace once. See [Offer it only where it has data](/extensions/panels#offer-it-only-where-it-has-data) |

### mu.commands

```ts
commands: { register(spec: CommandSpec): Dispose; run(id: PublicCommand | string, arg?: unknown): void }
```

| Member | Meaning |
|---|---|
| `register(spec)` | Register a command. The id must be unique, or `register` throws. Dispose unregisters it |
| `run(id, arg?)` | Run an extension's command, or one of `PUBLIC_COMMANDS` <Since v="1.12" />: `settings.open`, `extensions.open`, `layout.save`, `layout.reset`, `log.clear`, `palette.open`, `input.focus`. Any other core id is deprecated: it warns once and stops working in 2.0 |

### mu.actions <Since v="1.12" />

```ts
actions: {
  define(spec: ActionSpec): Dispose;
  run(id: string, args: Record<string, string>, opts: { sid: string; key?: string }): Promise<'sent' | 'handled' | 'hidden' | 'duplicate'>;
  handle(id: string, fn: (args: Record<string, string>, s: { sid: string; worldId: string; character: string }) => boolean | void | Promise<boolean | void>): Dispose;
  visible(id: string, sid: string | null): boolean;
}
```

`ActionSpec` is `{ id, label, group?, via: 'command' | 'gmcp' | 'ext' | 'none', command?, gmcp?(args), args?, when? }`. The player can change `via` and `command` per world. See [Actions](/extensions/commands-settings#actions).

### mu.sessions

```ts
sessions: {
  active(): SessionRef | null;
  list(): SessionRef[];
  all(): SessionRef[];
  send(text: string, sid?: string | EffectOpts): Promise<void>;
  send(text: string, opts: SendOptions): Promise<'sent' | 'duplicate' | 'refused'>;
  request(text: string, opts: RequestOptions): Promise<LineView[] | null>;
  echo(text: string, sid?: string): void;
  on(ev: 'line', fn: (line: LineView, meta: EventMeta & { sid: string }) => void, opts?: SessionFilter): Dispose;
  on(ev: 'switch', fn: (s: SessionRef | null) => void): Dispose;
  on(ev: 'open' | 'close', fn: (s: SessionRef, meta: EventMeta) => void, opts?: SessionFilter): Dispose;
  on(ev: 'state', fn: (s: SessionRef, meta: EventMeta & { reason?: 'user' | 'lost' | 'failed' | 'server'; message?: string }) => void, opts?: SessionFilter): Dispose;
  on(ev: 'identity', fn: (s: SessionRef) => void, opts?: SessionFilter): Dispose;
  each(setup: (s: SessionRef) => void | Dispose): Dispose;
  meta(sid?: string): SessionMetaView | null;
  watchMeta(fn: (meta: SessionMetaView) => void, sid?: string): Dispose;
  provideIdentity(sid: string, src: { name?: string; roles?: string[] }): Dispose;
}
```

| Member | Meaning |
|---|---|
| `active()` | The session in front, or `null` |
| `list()` | The sessions in scope: those of worlds where the extension is enabled (since 1.8; before, every session) |
| `all()` <Since v="1.8" /> | Every session, in any world. Needs the `all-sessions` capability |
| `send(text, sid?)` | Send a command as if typed, through the input pipeline. With `{ sid, onReplay, key }` <Since v="1.8" />, skipped while a replayed event is handled unless `onReplay`, and sent once account-wide with a `key` |
| `send(text, opts)` <Since v="1.11" /> | With `raw` or `echo`, resolves what happened. See [Send and request](/extensions/lines-input#send-and-request) |
| `request(text, opts)` <Since v="1.11" /> | Send a command and capture its answer |
| `echo(text, sid?)` | Show a local line in the session's terminal. Nothing goes to the game |
| `on('line', fn)` | Call `fn` for each output line. The second argument is the event envelope since 1.8 |
| `on('switch', fn)` | Call `fn` when the active session changes, with the new one or `null` |
| `on('open' \| 'state' \| 'close' \| 'identity', fn)` <Since v="1.8" /> | The session lifecycle. See [Sessions](/extensions/events#sessions) |
| `each(setup)` <Since v="1.8" /> | Run `setup` for every session in scope, now and as they open. What it returns runs when the session closes or leaves scope |
| `meta(sid?)`, `watchMeta(fn, sid?)` <Since v="1.8" /> | The session's prompt, now playing, location, latency and links |
| `provideIdentity(sid, src)` <Since v="1.8" /> | Supply the character name or roles when the game does not |

### mu.lines

```ts
lines: {
  stage(spec: LineStageSpec): Dispose;
  stage(spec: { id: string; order?: number; run(line: LineView, ctx: LineCtx): void }): Dispose;
  recent(sid: string, opts?: { limit?: number; before?: number }): LineView[];
  history(sid: string, opts: { before: number; limit: number }): Promise<LineView[]>;
  search(sid: string, query: string | RegExp, opts?: { limit?: number }): LineView[];
}
```

| Member | Meaning |
|---|---|
| `stage(spec)` <Since v="1.11" /> | A phased stage: `{ id, phase, order?, backlog?, run(line: LineEdit, ctx) }`. See [Line phases](/extensions/lines-input#line-phases) |
| `stage(spec)` without `phase` | The v1 form: an `observe` stage, `order` clamped to 300 or more, that may change `category` and `rowCls`, and gag or add text after the line through `ctx` |
| `recent(sid, opts?)` <Since v="1.11" /> | The lines this client holds, oldest first |
| `history(sid, opts)` <Since v="1.11" /> | Older lines from the backend's log, at most 1000 |
| `search(sid, query, opts?)` <Since v="1.11" /> | Held lines that match, newest first |

### mu.input <Since v="1.11" />

```ts
input: {
  stage(spec: InputStageSpec): Dispose;
  completions(spec: CompletionSpec): Dispose;
  history(sid?: string, opts?: { limit?: number }): string[];
  fill(text: string, opts?: { sid?: string; select?: boolean }): void;
  focus(sid?: string): void;
}
macros: { provide(spec: MacroSpec): Dispose }
```

See [Input stages](/extensions/lines-input#input-stages) and [Completions and macros](/extensions/lines-input#completions-and-macros).

### mu.gmcp

```ts
gmcp: {
  on<P extends string>(pkg: P, fn: (data: GmcpData<P>, meta: EventMeta & { sid: string; pkg: string }) => void, opts?: SessionFilter): Dispose;
  state<P extends string>(pkg: P, sid?: string): GmcpData<P> | undefined;
  stateMeta(pkg: string, sid?: string): { data: unknown; meta: EventMeta & { pkg: string } } | undefined;
  watch<P extends string>(pkg: P, fn: (state: GmcpData<P> | undefined, meta: EventMeta & { sid: string; pkg: string }) => void, opts?: SessionFilter): Dispose;
  send(pkg: string, data?: unknown, sid?: string | EffectOpts): Promise<boolean | 'reserved'>;
  request<E extends string>(pkg: string, data: unknown, opts: GmcpRequestOpts<E>): Promise<GmcpData<E>>;
  supports(pkgs: string[]): Dispose;
  supported(pkg: string, sid?: string): number | null;
  seen(pkg: string, sid?: string): boolean;
  whenSeen(pkg: string, opts: { sid?: string; timeoutMs: number }): Promise<boolean>;
  negotiated(sid?: string): boolean;
}
```

| Member | Meaning |
|---|---|
| `on(pkg, fn, opts?)` | Call `fn` for each GMCP message of `pkg`. `pkg` matches exactly, or as a prefix when it ends with `.` or is a bare namespace (`'Room'`). `meta.pkg` is the package that arrived |
| `state(pkg, sid?)` | The package's state on a session |
| `stateMeta(pkg, sid?)` <Since v="1.8" /> | The state with the envelope of the message that set it |
| `watch(pkg, fn, opts?)` <Since v="1.10" /> | Call `fn` with the merged state now and on every change |
| `send(pkg, data?, sid?)` <Since v="1.1" /> | Send a GMCP message. Resolves `true`, `false` (not sent), or `'reserved'` for a package only μClient may send. The options form <Since v="1.8" /> takes `onReplay` and `key` |
| `request(pkg, data, opts)` <Since v="1.10" /> | Send and wait for the answer package. See [Ask and wait](/extensions/events#ask-and-wait) |
| `supports(pkgs)` <Since v="1.1" /> | Declare packages for `Core.Supports`, for every session in scope, while live. Prefer `contributes.gmcp` |
| `supported(pkg, sid?)` <Since v="1.10" /> | The version advertised for a package, or `null` |
| `seen(pkg, sid?)`, `whenSeen(pkg, opts)` <Since v="1.11" /> | Whether the game has sent the package, and a promise that resolves when it does (`false` on timeout) |
| `negotiated(sid?)` <Since v="1.11" /> | Whether GMCP is on |

### mu.msdp, mu.mxp, mu.telnet, mu.mssp <Since v="1.10" />

```ts
msdp: {
  on(variable: string, fn: (value: unknown, meta: EventMeta & { sid: string; variable: string }) => void, opts?: SessionFilter): Dispose;
  state(variable: string, sid?: string): unknown;
  report(variables: string[], sid?: string): Dispose;
  send(variable: string, sid?: string): Promise<boolean>;
  list(kind: string, sid?: string): Promise<string[]>;
}
mxp: {
  on(ev: 'element', fn: (el: MxpElement, meta: EventMeta & { sid: string }) => void, opts?: SessionFilter): Dispose;
  define(tag: string, spec: { render?(attrs: Record<string, string>, text: string): SpanPatch | SpanPatch[] | null }): Dispose;
}
telnet: { options(sid?: string): string[] }
mssp(sid?: string): Record<string, string | string[]> | null;
```

See [Protocols](/extensions/protocols).

### mu.mcp and mu.editor <Since v="1.10" />

```ts
mcp: {
  on(message: string, fn: (args: McpArgs, meta: McpMeta) => void, opts?: SessionFilter): Dispose;
  send(message: string, args?: McpArgs, opts?: EffectOpts): Promise<'sent' | 'duplicate' | 'not-negotiated' | 'refused'>;
  version(pkg: string, sid?: string): string | null;
  negotiated(sid?: string): Record<string, string>;
  cord(type: string, opts?: SessionFilter): Promise<McpCord>;
  onCordOpen(type: string, fn: (cord: McpCord, meta: McpMeta) => void, opts?: SessionFilter): Dispose;
}
editor: { open(spec: EditorSpec): EditorHandle }
```

See [MCP 2.1](/extensions/protocols#mcp-2-1) and [The editor](/extensions/protocols#the-editor).

### mu.scene

The room μClient tracks for a session. The bundled protocol adapters feed it from GMCP and MSDP. The Scene panel is the first-party extension `scene` (`@muclient/ext-scene`), which reads it through `get` and `watch`.

```ts
scene: {
  set(patch: ScenePatch, sid?: string): Dispose;
  get(sid?: string): SceneView | null;
  watch(fn: (scene: SceneView) => void, sid?: string): Dispose;
  provide(sid: string, patch: ScenePatch, opts?: { priority?: number }): Dispose;
}
```

| Member | Meaning |
|---|---|
| `set(patch, sid?)` <Since v="1.1" /> | Feed the scene, for telnet-only games or code that knows the room. Dispose clears what this call set |
| `get(sid?)` <Since v="1.4" /> | A copy of the scene now. `null` with no session |
| `watch(fn, sid?)` <Since v="1.4" /> | Call `fn` with the scene now and on every change, for one session (default the one active at call time) |
| `provide(sid, patch, opts?)` <Since v="1.10" /> | Feed the scene as a provider. For each field the highest `priority` wins |

### mu.channels <Since v="1.1" />

```ts
channels: {
  push(channel: string, sender: string, text: string, sid?: string): Dispose;
  get(sid?: string): ChannelsView | null;
  watch(fn: (channels: ChannelsView) => void, sid?: string): Dispose;
  select(key: string, sid?: string): void;
  markRead(key: string, sid?: string): void;
  send(text: string, key?: string, sid?: string): Promise<void>;
  configure(key: string, patch: { muted?: boolean; alert?: 'all' | 'mentions' | 'none'; color?: ChannelColor | null }, sid?: string): void;
  provide(sid: string, data: ChannelProvide): Dispose;
}
```

| Member | Meaning |
|---|---|
| `push(channel, sender, text, sid?)` | Add a message to the Channels panel. Mentions and unread counts follow the channel's settings. Dispose removes the message |
| `get`, `watch` <Since v="1.7" /> | The session's channels, messages and unread counts |
| `select`, `markRead`, `send`, `configure` <Since v="1.7" /> | What the Channels panel does: pick a channel, mark it read, send on it, and change its mute, alerts and colour |
| `provide(sid, data)` <Since v="1.10" /> | Feed channels from your own protocol. See [Feed the Scene and Channels](/extensions/protocols#feed-the-scene-and-channels) |

### mu.feeds <Since v="1.7" />

```ts
feeds: {
  get(sid?: string): FeedsView | null;
  watch(fn: (feeds: FeedsView) => void, sid?: string): Dispose;
  viewing(label: string | null, sid?: string): void;
  clear(label: string, sid?: string): void;
}
```

The session's feeds (the lines a stage copied or moved there), which one the player is viewing, and clearing one.

### mu.media <Since v="1.1" />

```ts
media: {
  play(spec: MediaSpec, sid?: string | EffectOpts): Dispose;
  stop(filter?: { name?: string; key?: string; type?: 'music' | 'sound' }, sid?: string): void;
  get(sid?: string): MediaView | null;
  watch(fn: (media: MediaView) => void, sid?: string): Dispose;
  clearImages(sid?: string): void;
  setBase(url: string, sid?: string): void;
  showImage(img: { url: string; caption?: string; line?: number }, sid?: string): void;
  setOutput(patch: { volume?: number; muted?: boolean }): void;
}
```

| Member | Meaning |
|---|---|
| `play(spec, sid?)` | Play a cue through the Media panel. Dispose stops it. Plays on the client that owns the session's effects |
| `stop(filter?, sid?)` | Stop the cues that match `filter` |
| `get`, `watch`, `clearImages`, `setOutput` <Since v="1.7" /> | The tracks and image gallery, and the player's volume and mute |
| `setBase(url, sid?)`, `showImage(img, sid?)` <Since v="1.10" /> | The base URL cue names resolve against, and a picture in the gallery |

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
  get<T = unknown>(key: string, at?: string | null | { worldId?: string | null; sid?: string }): T;
  set(key: string, value: unknown, worldId?: string | null): void;
  watch<T = unknown>(key: string, fn: (value: T, meta: ChangeMeta) => void, opts?: { worldId?: string | null; sid?: string }): Dispose;
  open(): void;
}
```

| Member | Meaning |
|---|---|
| `define(schema)` | Register the extension's Settings page, a sub-page of **Settings → Extensions**. μClient renders it from the schema |
| `get(key, at?)` | The resolved value of a setting, for a world id, or <Since v="1.9" /> `{ worldId }` or `{ sid }` |
| `set(key, value, worldId?)` | Write a value to `worldId` (default the active world) when the setting's scope allows, otherwise for all worlds. Pass `null` for all worlds |
| `watch(key, fn, opts?)` | Call `fn` when the value changes. Since 1.9 it also calls `fn` at once, with `meta.replay: true` |
| `open()` | Open the extension's Settings page |

### mu.prefs <Since v="1.9" />

```ts
prefs: {
  get<K extends CorePrefName>(name: K, opts?: { worldId?: string | null }): CorePrefs[K];
  watch<K extends CorePrefName>(name: K, fn: (value: CorePrefs[K], meta: ChangeMeta) => void, opts?: { worldId?: string | null }): Dispose;
}
```

The player's own settings, read-only: `a11y.reduceMotion`, `a11y.screenReader`, `a11y.speak`, `effects.calm`, `effects.glow`, `theme.id`, `audio.volume`, `audio.muted`, `text.fontSize`, `text.fontFamily`, `locale`. `watch` calls `fn` at once.

### mu.lua

```ts
lua: {
  on(name: string, fn: (data: unknown, meta: EventMeta & { sid: string; name: string }) => void, opts?: SessionFilter): Dispose;
  emit(name: string, data: unknown, opts?: { sid?: string }): Promise<boolean>;
}
```

| Member | Meaning |
|---|---|
| `on(name, fn, opts?)` | Call `fn` with the data of each Lua [`ext.emit(name, data)`](/automation/ext-emit) |
| `emit(name, data, opts?)` <Since v="1.10" /> | Run the session's Lua [`ext.on`](/automation/ext-emit#hear-an-extension-ext-on) handlers for `name`. Resolves `false` when not delivered |

### mu.ui

```ts
ui: {
  toast(title: string, body?: string, opts?: { kind?: string; onReplay?: boolean; action?: { label: string; run(): void }; timeoutMs?: number; group?: string }): void;
  css: Record<'btn' | 'primary' | 'tool' | 'chip' | 'inp' | 'secHead' | 'empty' | 'framed' | 'badge' | 'lamp' | 'glow'
    | 'cmd' | 'toggle' | 'plate' | 'count' | 'field' | 'row' | 'label'
    | 'secClose' | 'hlLine' | 'onoff' | 'placeholder' | 'sq' | 'warn' | 'on' | 'off' | 'hot' | 'dim' | 'gold' | 'ok', string>;
  style(css: string): Dispose;
  confirm(spec: ConfirmSpec): Promise<boolean>;
  prompt(spec: PromptSpec): Promise<string | null>;
  pick<T>(spec: PickSpec<T>): Promise<T | null>;
  modal(spec: ModalSpec): ModalHandle;
  overlay(spec: OverlaySpec): Dispose;
  sanitize(html: string, profile?: 'inline' | 'block'): DocumentFragment;
  h: typeof h;
}
```

| Member | Meaning |
|---|---|
| `toast(title, body?, opts?)` | Show a toast. `kind` <Since v="1.1" /> is the small label above the title (default `'info'`). `action`, `timeoutMs` and `group` <Since v="1.12" /> |
| `css` | Class names of μClient's style primitives, for code that does not use Vue. `cmd` to `label` <Since v="1.5" />, `secClose` to `ok` <Since v="1.12" /> |
| `style(css)` <Since v="1.1" /> | Inject a stylesheet for this extension's panels, in `@layer ext.<id>` since 1.12. Use theme tokens. Dispose removes it |
| `confirm`, `prompt`, `pick`, `modal`, `overlay` <Since v="1.12" /> | Host dialogs. See [Dialogs](/extensions/surfaces#dialogs) |
| `sanitize(html, profile?)`, `h` <Since v="1.12" /> | Safe HTML and a DOM builder |

### mu.menus, mu.palette, mu.notify, mu.files, mu.net, mu.a11y, mu.hud <Since v="1.12" />

```ts
menus: {
  add(spec: MenuSpec): Dispose;
  context(spec: ContextMenuSpec): Dispose;
  target(el: Element, target: ContextTarget): Dispose;
}
palette: { provide(spec: PaletteProviderSpec): Dispose; verbs(sid: string | null, verbs: string[]): Dispose }
notify: {
  mention(m: { sid: string; title: string; body: string; key?: string }): Promise<void>;
  alert(a: { sid?: string; title: string; body?: string; sound?: 'blip' | 'none' | MediaSpec; desktop?: boolean; key?: string }): Promise<void>;
}
files: {
  save(spec: { name: string; type?: string; data: Blob | string }): Promise<boolean>;
  open(opts?: { accept?: string[]; multiple?: boolean }): Promise<File[]>;
}
net: { fetch(url: string, init?: RequestInit): Promise<Response> }
a11y: {
  announce(text: string, opts?: { priority?: 'polite' | 'assertive' }): void;
  region(el: HTMLElement, opts: { name: string; key?: string }): Dispose;
}
hud: { mount(spec: { id: string; slot: 'status' | 'rail' | 'top-left' | 'top-right'; order?: number; mount: PanelSpec['mount'] }): Dispose }
```

See [Surfaces](/extensions/surfaces).

### mu.theme

```ts
theme: {
  cssVar(name: string): string;
  watch(fn: (t: { id: string; tokens: ThemeTokens; reduceMotion: boolean }) => void): Dispose;
  register(spec: ThemeSpec): Dispose;
}
```

| Member | Meaning |
|---|---|
| `cssVar(name)` | The current value of a theme CSS variable, with or without the leading `--` |
| `watch(fn)` <Since v="1.12" /> | Call `fn` now and whenever the theme or reduce motion changes |
| `register(spec)` <Since v="1.12" /> | Add a theme to **Settings → Visual**. See [Themes](/extensions/surfaces#themes) |

### mu.storage

```ts
storage: {
  world(worldId?: string | null, opts?: { sync?: boolean }): Store;
  global: Store;
  device: Store;
  account: Store;
  session(sid?: string): Store;
}
```

| Member | Meaning |
|---|---|
| `world(worldId?)` | A store for one world on this device (default the active world). With `{ sync: true }` <Since v="1.9" />, synced across the player's devices |
| `global` | A store shared by every world, on this device |
| `device`, `account`, `session(sid?)` <Since v="1.9" /> | This device; the player's account on every device; one session, gone when it closes |

Tiers, quotas and collections are on [Storage](/extensions/storage).

### mu.effects and mu.sync <Since v="1.9" />

```ts
effects: {
  owner(sid?: string): boolean;
  watch(fn: (owner: boolean) => void, sid?: string): Dispose;
}
sync: { channel<T = unknown>(name: string, opts?: { scope?: 'session' | 'world' | 'account'; sid?: string; worldId?: string }): SyncChannel<T> }
```

`owner` says whether this client plays the session's effects. A sync channel passes values between the player's clients. See [Several clients on one session](/extensions/events#several-clients-on-one-session).

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
interface SessionRef {
  id: string; worldId: string; worldName: string;
  state: 'idle' | 'connecting' | 'connected' | 'disconnecting';
  character: string;
  roles: string[];
  telnet: string[];
  attention: boolean;
}
```

| Field | Meaning |
|---|---|
| `id` | The session id (`sid` elsewhere) |
| `worldId`, `worldName` | The **world** it belongs to |
| `state` | The connection state. Why a link ended is the `state` event's `reason` |
| `character` <Since v="1.8" /> | The character name, from the world's setting, GMCP, MSDP or a provider. `''` when unknown |
| `roles` <Since v="1.8" /> | Roles a provider claimed for the character, such as `'staff'`. For presentation only |
| `telnet` <Since v="1.8" /> | The negotiated telnet options |
| `attention` <Since v="1.8" /> | This client owns the session's effects, as `mu.effects.owner(id)` said when the ref was made |

### LineView

```ts
interface LineView {
  readonly id: number;
  readonly ts: number;
  readonly text: string;
  readonly kind: 'output' | 'echo' | 'system' | 'prompt';
  category: 'speech' | 'pose' | 'combat' | 'comms' | 'look' | 'system';
  rowCls?: string;
  readonly gmcp?: readonly string[];
  readonly spans?: readonly SpanView[];
  readonly media?: { type: 'image' | 'audio' | 'video' | 'youtube'; url: string; caption?: string };
  readonly backlog?: boolean;
  readonly replay?: boolean;
  readonly meta?: EventMeta;
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
| `gmcp` | The GMCP packages that arrived with the line |
| `spans` <Since v="1.11" /> | The rendered runs, each with its `start` and `end` in `text`, its style and link |
| `media` | A picture or clip the line carries |
| `backlog`, `replay` <Since v="1.8" /> | The line is history, or a replay. Effects do not run for it |
| `meta` <Since v="1.8" /> | The line's event envelope |

A phased stage gets a `LineEdit`: a `LineView` with the edit calls on [Lines and input](/extensions/lines-input#lineedit).

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
  show?: 'always' | 'auto' | 'never';
  role?: string;
}
```

| Member | Meaning |
|---|---|
| `id` | The panel id |
| `title` | The tab and Views menu title |
| `mount(el, ctx)` | Render into `el` with any framework or plain DOM. Return a cleanup function if you need one |
| `singleton` | One instance only |
| `perSession` | `true` (default): one instance per session. `false` <Since v="1.8" />: one instance that follows the active session |
| `defaultPosition` | Where it opens the first time (default `'right-bottom'`) |
| `inViewsMenu` <Since v="1.1" /> | Listed in the Views menu (default `true`). Change it later with `mu.panels.update` |
| `order` <Since v="1.4" /> | Place in the Views menu, lower first (default 200). Core panels: Terminal 0, Channels 20, Media 30, Feeds 50, Web page 210, then μClient's own at 300 and up (the GMCP inspector is 330). The Scene extension takes 10 |
| `snapshot(el, ctx)` <Since v="1.2" /> | Hot reload: called on the old build right before its panel unmounts. Return JSON-like state such as input text or a scroll position. `undefined` keeps nothing |
| `restore(el, state, ctx)` <Since v="1.2" /> | Hot reload: called on the new build right after `mount`, with what `snapshot` returned |
| `show` <Since v="1.12" /> | `'always'` (default), `'auto'` (offered once `mu.panels.touch` reports data) or `'never'`. The player overrides it per world |
| `role` <Since v="1.12" /> | Offer the panel only for a character with this role |

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
  id?: string;
  title?: string;
  area?: string;
  desc?: string;
  atmosphere?: string;
  pose?: string;
  exits?: string[];
  present?: string[];
  items?: Array<{ id?: string; name: string; hostile?: boolean }>;
  extras?: Record<string, string>;
}
```

| Field | Meaning |
|---|---|
| `id` <Since v="1.8" /> | The room's id, such as GMCP `Room.Info` `num` |
| `title` | The room title, shown in the Scene header and the HUD location |
| `area` | The area name |
| `desc` | The room description |
| `atmosphere` | The italic atmosphere line |
| `pose` | The pose line with the left rule |
| `exits` | Exit names |
| `present` | Names of the people present |
| `items` | Things in the room, optionally marked hostile |
| `extras` <Since v="1.8" /> | More named fields, for panels that show more than these |

### SceneView <Since v="1.4" />

What the Scene holds for a session. The same fields as `ScenePatch`, all present, plus `known`.

```ts
interface SceneView {
  known: boolean;
  id: string;
  title: string;
  area: string;
  desc: string;
  atmosphere: string;
  pose: string;
  exits: string[];
  present: string[];
  items: Array<{ id: string; name: string; hostile?: boolean }>;
  extras: Record<string, string>;
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
  kind?: 'toggle' | 'range' | 'select' | 'text' | 'color' | 'key' | 'json' | 'textarea';
  options?: Array<{ value: T; label: string }>;
  min?: number; max?: number; step?: number; unit?: string;
  hint?: string;
  group?: string;
  scope?: 'global' | 'world' | 'both';
  sync?: 'account' | 'device';
  when?: { key: string; equals: unknown };
}
```

| Field | Meaning |
|---|---|
| `key` | The key within the extension. It is stored as `ext.<id>.<key>` |
| `label` | The row label |
| `default` | The value when nothing is set |
| `kind` | The control. `color`, `key`, `json` and `textarea` <Since v="1.9" /> |
| `options` | Choices for a select |
| `min`, `max`, `step`, `unit` | For a range |
| `hint` | Help text under the row |
| `group` | The group heading the row sits under |
| `scope` | `'both'` (default): per world, falling back to all worlds. `'world'` or `'global'` for one of the two |
| `sync` <Since v="1.9" /> | `'account'` (default) follows the player to every device. `'device'` stays on this one |
| `when` <Since v="1.9" /> | Show the row only while another setting equals a value |

### SettingsSchema

```ts
interface SettingsSchema {
  title?: string;
  items: SettingSpec[];
  component?: PanelSpec['mount'];
  sections?: Array<{ page: 'visual' | 'effects' | 'text' | 'audio' | 'alerts' | 'access' | 'input'; title: string; keys: string[] }>;
}
```

| Field | Meaning |
|---|---|
| `title` | The page title |
| `items` | The rows |
| `component` <Since v="1.9" /> | Mounted below the rows, for an editor a schema cannot express |
| `sections` <Since v="1.9" /> | Rows of yours shown on a core Settings page too |

## CommandSpec

```ts
interface CommandSpec {
  id: string; title: string; keys?: string[]; run(arg?: unknown): void | Promise<void>;
  when?: 'session' | 'connected' | `role:${string}` | `panel:${string}` | ((sid: string | null) => boolean);
  group?: string;
}
```

| Field | Meaning |
|---|---|
| `id` | The command id |
| `title` | Its name in μClient |
| `keys` | Default key bindings, such as `['Ctrl+J']` |
| `run(arg?)` | What it does |
| `when` <Since v="1.12" /> | When it is offered, for the active session |
| `group` <Since v="1.12" /> | The group it is listed under, after the extension's name (default **Extension**) |

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

Since 1.9 every tier is a `Store`, which adds to `Storage`:

```ts
interface Store extends Storage {
  keys(prefix?: string): string[];
  watch<T = unknown>(key: string, fn: (value: T | undefined, meta: ChangeMeta) => void): Dispose;
  watchAll(fn: (key: string, value: unknown, meta: ChangeMeta) => void): Dispose;
  collection<T = unknown>(name: string): Collection<T>;
  ready: Promise<void>;
}
```

See [Storage](/extensions/storage) for the members, `Collection` and `ChangeMeta`.

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
- [Talking to extensions](/automation/ext-emit): the Lua side of `mu.lua.on` and `mu.lua.emit`.
- [Upgrade to SDK 1.12](/extensions/migrating).
