---
title: Storage
description: Keep an extension's data on this device, on every device of the player, per world or per session, with collections that merge across devices and the quota of each tier.
audience: extensions
---

# Storage

`mu.storage` keeps an extension's data. Each store is a key–value store of JSON values. `get` is synchronous, because it reads a copy in memory, and `set` and `delete` apply at once and sync in the background. A store holds only your extension's keys.

```ts
import { defineExtension } from '@muclient/sdk';

export default defineExtension({
  activate({ mu }) {
    const store = mu.storage.world(undefined, { sync: true });
    const visits = store.get<number>('visits', 0) + 1;
    store.set('visits', visits);
    mu.log.info(`visit ${visits}`);
  },
});
```

## Tiers <Since v="1.9" />

| Store | Where it lives | Quota |
|---|---|---|
| `mu.storage.device` (also `global`) | This device, for every world. Other tabs on the device see the writes | 5 MB |
| `mu.storage.world(worldId?)` | This device, for one world (default the active world) | Shares the device's 5 MB |
| `mu.storage.world(worldId?, { sync: true })` | That world on every device of the player, encrypted with the world key | 2 MB per world |
| `mu.storage.account` | Every device of the player, encrypted with the account settings key | 512 KB |
| `mu.storage.session(sid?)` | Every client attached to one session, in memory while the session lives, encrypted with the world key | 256 KB |

A write that would take a tier over its quota throws `QuotaExceeded`, with the `tier` and the `limit` in bytes:

```ts
import { QuotaExceeded } from '@muclient/sdk';

try {
  mu.storage.account.set('log', bigLog);
} catch (e) {
  if (e instanceof QuotaExceeded) mu.ui.toast('Notes are full', `The ${e.tier} store holds ${e.limit} bytes.`);
}
```

Use `device` for what depends on this machine (a window size, a cache), `account` for what the player expects everywhere (their notes), a synced `world` store for per-world data they expect everywhere, and `session` for state the clients of one session share, such as a combat timer.

## The store

| Member | |
|---|---|
| `get(key, fallback?)` | The value, or `fallback` |
| `set(key, value)` | Store a JSON value |
| `delete(key)` | Remove a key |
| `keys(prefix?)` | The keys, or those that start with `prefix`. Collection items are not listed |
| `watch(key, fn)` | `fn(value, meta)` for every change of one key, here or on another tab or device. `value` is `undefined` once deleted |
| `watchAll(fn)` | `fn(key, value, meta)` for every change |
| `collection(name)` | A [collection](#collections) |
| `ready` | Resolves once the store is loaded |

μClient waits for your stores to load before it calls `activate`, for 2 seconds at most. Values that arrive later reach `watch`.

A watcher's `meta` is a `ChangeMeta`: `origin` (with `origin.self` false for a change from another tab or device), `hlc`, the write's clock, and `replay`, true for a value delivered when a store finishes loading. Concurrent writes to one key from two devices resolve by that clock: the later write wins.

## Collections

A collection keeps items under ids that are unique across devices, and merges them per item and per field. Two devices that add an item at the same time both keep theirs, and two devices that edit different fields of one item both keep their edit.

```ts
const notes = mu.storage.world(undefined, { sync: true }).collection<{ room: string; text: string }>('notes');
const id = notes.add({ room: 'Chapel of Ash', text: 'the altar moves' });
notes.patch(id, { text: 'the altar moves at midnight' });
notes.watch(({ id, value, meta }) => render());
notes.remove(id);
```

| Member | |
|---|---|
| `add(value)` | Add an item. Returns its id, a ULID, so `list()` is in creation order |
| `put(id, value)` | Replace an item |
| `patch(id, fields)` | Change some fields. Each field merges on its own |
| `remove(id)` | Remove an item. A tombstone is kept for 30 days, so an older copy on another device does not bring it back |
| `get(id)` | One item |
| `list()` | Every item, as `{ id, value }` |
| `watch(fn)` | `fn({ id, value?, meta })` for every change. `value` is `undefined` when the item was removed |

## Declare what you store

List your keys by tier in the manifest. The player sees them in the uninstall prompt and the backup. They are not enforced.

```json
"contributes": { "storage": { "account": ["notes"], "world": ["visited"] } }
```

Uninstalling with **delete data** deletes every tier on every device. The config backup includes account and synced world data, and device data when the player asks for it. Safe mode neither loads nor deletes extension data. **Settings → Extensions →** your extension shows what each tier uses.

## Before 1.9

`mu.storage.global` and `mu.storage.world(id)` used `localStorage` until 1.9. Since then they are IndexedDB with a copy in memory, and existing data moves the first time the extension opens it. `get` stays synchronous, so v1 code keeps working.

## Next

- [Commands and settings](/extensions/commands-settings): values the player edits.
- [Events, sessions and GMCP](/extensions/events): `mu.sync.channel` for live values that are never stored.
- [SDK reference](/reference/sdk/#mu-storage).
