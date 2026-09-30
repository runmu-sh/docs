---
title: GMCP and MSDP data
description: Read the game's GMCP and MSDP data from the gmcp table in aliases, triggers, macros and the lua command.
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

A value that reads as a number becomes a Lua number. MSDP tables and arrays become Lua tables. When the game offers MSDP, μClient asks it to report `CHARACTER_NAME`, `HEALTH`, `HEALTH_MAX`, `MANA`, `MANA_MAX`, `ROOM_NAME` and `ROOM_EXITS`.

::: tip
Extensions get the same MSDP variables as packages named `MSDP.<VAR>`. In Lua the prefix is lower case, as in `gmcp.msdp.HEALTH`.
:::

## What μClient asks for

When the game turns GMCP on, μClient introduces itself with `Core.Hello` and asks for these packages with `Core.Supports.Set`: `Char`, `Char.Vitals`, `Char.Status`, `Char.StatusVars`, `Char.Items`, `Char.Skills`, `Char.Defences`, `Char.Afflictions`, `Room`, `Room.Info`, `Room.Players`, `Comm`, `Comm.Channel`, `IRE.Rift`, `IRE.Composer` and `External.Discord`. Games send the ones they support. Packages outside that list land in the table the same way.

Lua can read GMCP but cannot send it. An extension can, with `mu.gmcp.send` (see [GMCP and Lua events](/extensions/events)).

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
- [Every Lua function](/reference/lua/).
