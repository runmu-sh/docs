---
title: Your first trigger
description: Write a trigger that reacts to a line from the game, save it in the Script editor, and switch it off from another script.
audience: automation
---

# Your first trigger

A trigger is a regular expression and a Lua script. When a line from the game matches the expression, the script runs with the captures in `matches`.

## 1. Pick a line

Say the game prints this every time you arrive somewhere:

```text
You enter the Market Square.
```

## 2. Write the pattern

```text
^You enter (.+)\.$
```

`(.+)` captures the room's name into `matches[2]` (`matches[1]` is the whole line).

## 3. Write the script

```lua
echo("Now in " .. matches[2])
send("look")
```

`echo` prints to your session only; `send` sends a command to the game with the line ending added.

## 4. Save it

Open **☰ → Views → Script editor** and press **＋ Trigger**. Give it the name `arrive`, set the pattern's type to **regex**, paste the pattern and the script, and press **Save**. It is saved to your account and runs in the backend from now on, even with the client closed.

## Turning it off from another script

Triggers can toggle each other, which is how you build modes:

```lua
disableTrigger("arrive")   -- stop reacting for now
enableTrigger("arrive")    -- and back on
exists("arrive", "trigger") -- true if it existed when the session started
```

## Reading game data

If the game speaks GMCP, the latest values are in the `gmcp` table:

```lua
if gmcp.Char and gmcp.Char.Vitals and gmcp.Char.Vitals.hp < 200 then
  send("quaff heal")
end
```

MSDP variables sit under `gmcp.msdp.<VAR>`.

## Next

- [Aliases](/automation/aliases): the same thing for lines *you* type.
- [Talking to extensions](/automation/ext-emit): when a trigger should show something in a panel.
- [Every Lua function](/reference/lua/).
