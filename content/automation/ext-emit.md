---
title: Talking to extensions
description: Send data from an alias or trigger to your TypeScript extensions with ext.emit, receive their events with ext.on, and the limits that apply.
audience: automation
---

# Talking to extensions

`ext.emit(name, data)` sends `data` to the TypeScript extensions of every client attached to the session. It carries data only, and the extension decides what to draw. The other way, an extension sends Lua an event that `ext.on` receives.

```lua
-- a trigger on "^You enter (.+)\.$"
ext.emit("map.enter", {
  room = matches[2],
  exits = gmcp.Room and gmcp.Room.Info and gmcp.Room.Info.exits,
})
```

An extension receives it with `mu.lua.on`:

```ts
mu.lua.on('map.enter', (data, session) => { /* draw it */ });
```

## Rules

- **`name`**: 1–64 characters of `a-z 0-9 . _ -` with a namespace: at least two non-empty dot-separated parts (`myext.event`, `map.room.enter`). Use the extension's id as the first part.
- **`data`**: anything that converts to JSON, or nothing (which sends `null`). Booleans, numbers and strings map directly. A table with exactly the keys `1..n` becomes an array, an empty table `{}`, any other table an object with number keys written as strings. Functions, userdata, threads, NaN, infinity and tables nested deeper than 64 levels raise an error.
- **Size**: the JSON can be at most 64 KB.
- **Errors**: a bad name, data that will not convert, or a payload over the cap raises a Lua error whose message starts `ext.emit:`. Wrap the call in `pcall` if the script must go on.
- **Rate limit**: 200 calls per second per session. Calls past that are dropped and the function returns `false`; it returns `true` when the message was sent.
- **Transient**: messages are not logged, not kept in snapshots, not replayed. A client that attaches later does not see earlier ones. If an extension needs state, send it again or have the extension ask with a command.
- **Private**: on the wire the event is encrypted with the world key, like GMCP.

## Hear an extension: ext.on

An extension sends an event to the session's Lua with `mu.lua.emit` <Since v="1.10" />. `ext.on(name, fn)` handles it:

```lua
ext.on("map.goto", function(data)
  send("walk " .. data.room)
end)
```

```ts
await mu.lua.emit('map.goto', { room: 'well' }, { sid });
```

- **`name`** follows the same rule as `ext.emit`. A bad one raises an error starting `ext.on:`, such as `ext.on: event name 'nospace' needs a namespace`.
- **`fn`** gets the data, converted from JSON. Several handlers for one name run in the order they were added. `ext.on(name, nil)` removes every handler for the name.
- **Errors**: a handler that fails shows as an `[ERROR] ext.on('<name>'): …` line in the terminal, and the other handlers still run.
- **Limits**: as for `ext.emit`: 64 KB of JSON and 200 events a second per session, transient and encrypted. `mu.lua.emit` resolves `false` when the event was not delivered.

## Next

- [Events, sessions and GMCP](/extensions/events#talk-to-lua): the extension side of `mu.lua.on` and `mu.lua.emit`.
- [GMCP and MSDP data](/automation/gmcp): the data most emits carry.
- [Every Lua function](/reference/lua/).
