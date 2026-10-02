---
title: GMCP and MSDP data
description: Read the game's GMCP and MSDP data from the gmcp table in aliases, triggers, macros and the lua command, and send GMCP to the game with gmcp.send.
---

# GMCP and MSDP data

Many games send data next to their text, such as your vitals, the room you are in and channel messages. μClient's backend keeps the latest value of each package in the Lua table `gmcp`, so any alias, trigger, macro or `lua` command can read it.

## Look at what the game sends

Type this on the command line:

```text
lua gmcp
```

The session prints the whole table. `lua gmcp.Char` prints one branch. An empty `{}` means the game has sent nothing yet, or does not speak GMCP or MSDP.

## Read a value

A package name is a path into the table, so `Char.Vitals` is `gmcp.Char.Vitals`. JSON objects become tables with the same keys, arrays become tables indexed from 1, and `null` becomes `nil`.

A package may not have arrived yet, so check each step before you index it:

```lua
local v = gmcp.Char and gmcp.Char.Vitals
if v and v.hp and v.hp < 200 then
  send("quaff heal")
end
```

Keys keep the case the game uses, and Lua is case-sensitive. `gmcp.Room.Info` and `gmcp.room.info` are different tables.

## How values update

- Each message replaces the whole value at its path. When the game sends `Char.Vitals {"hp":90}`, any other field `Char.Vitals` had before is gone.
- A message for a parent replaces its children too. `Char {…}` replaces `gmcp.Char.Vitals` along with the rest of `gmcp.Char`.
- A package sent with no data becomes an empty table.
- Values stay until the game sends a new one. Reconnecting does not clear the table.
- The table is written before the text that arrived with it goes through your triggers, so a trigger sees data sent together with its line.

The table belongs to the session's Lua state, so you can also write to it. The next message for that package overwrites what you wrote.

## MSDP

For a game that speaks MSDP, variables go under `gmcp.msdp`, by the name the game gives them:

```lua
local hp, max = gmcp.msdp.HEALTH, gmcp.msdp.HEALTH_MAX
if hp and max and hp < max / 3 then
  send("flee")
end
```

A value that reads as a number becomes a Lua number. MSDP tables and arrays become Lua tables. When the game offers MSDP, μClient itself asks it to report only `CHARACTER_NAME`. The bundled MSDP adapter adds `ROOM_NAME`, `ROOM_VNUM`, `ROOM_EXITS`, `AREA_NAME` and `ROOM`, and each extension adds the variables it declares. A variable no one asked for, such as `HEALTH`, appears only when the game sends it anyway.

::: tip
Extensions get the same MSDP variables as packages named `MSDP.<VAR>`. In Lua the prefix is lower case, as in `gmcp.msdp.HEALTH`.
:::

## What μClient asks for

When the game turns GMCP on, μClient introduces itself with `Core.Hello` and asks for `Core 1` and `Char 1` with `Core.Supports.Set`. The rest of the list comes from what is installed: the bundled protocol adapters add `Room 1`, `Comm.Channel 1` and `Client.Media 1`, and each extension enabled in the world adds the packages it declares. The list changes with `Core.Supports.Add` and `Remove` as extensions turn on and off. The GMCP inspector's **Supports** tab shows the current list and who asked for each package. Packages outside the list land in the table the same way.

## Send GMCP

`gmcp.send(package, data)` sends a GMCP message to the game:

```lua
gmcp.send("Char.Skills.Get", { group = "combat" })
gmcp.send("Core.Ping")   -- raises an error: reserved
gmcp.send("IRE.Rift.Request")
```

- **`package`**: 1–128 characters of `A-Z a-z 0-9 . _ -`.
- **`data`**: converts to JSON like `ext.emit`'s data, at most 64 KB. `nil` sends the bare package name.
- **Result**: `true` when the message was queued, `false` when the game has not turned GMCP on, the session is over its limit of 50 GMCP messages a second (shared with its clients' extensions), or the queue is full.
- **Reserved**: `Core.Hello`, `Core.Supports.*`, `Core.KeepAlive`, `Core.Ping` and `Char.Login*` are sent by μClient only. Sending one raises `gmcp.send: '<package>' is reserved for the client core`.
- **Errors**: a bad package name or data that will not convert raises an error that starts `gmcp.send:`, such as `gmcp.send: data is 70000 bytes, over the 64 KB limit`.

An extension sends GMCP with `mu.gmcp.send` (see [Send GMCP](/extensions/events#send-gmcp)).

## React to a change

The table changes without running any script. To act when a value changes, check it from a trigger on a line the game sends at the same time, such as its prompt:

```lua
-- a trigger with the pattern type "regex" and the text >\s*$
local v = gmcp.Char and gmcp.Char.Vitals
if v and v.hp ~= last_hp then
  last_hp = v.hp
  echo("hp now " .. tostring(v.hp))
end
```

## Next

- [Triggers](/automation/triggers): where most `gmcp` checks live.
- [Talking to extensions](/automation/ext-emit): pass `gmcp` data on to a panel.
- [The GMCP inspector](/extensions/protocols#the-gmcp-inspector): watch what the game sends.
- [Every Lua function](/reference/lua/).
