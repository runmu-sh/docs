---
title: Lua functions
description: Every function and context variable the backend's Lua 5.4 automation exposes, with arguments and return values.
audience: automation
---

# Lua functions

This page lists every function and variable your Lua scripts can use. Each **session** runs one Lua 5.4 state in the backend. Your aliases, triggers and startup scripts all run in it. Lua has no UI calls. To add panels or commands to the client, write an [extension](/extensions/).

## Context variables

| Name | In an alias | In a trigger |
|---|---|---|
| `command` | The input line | `nil` |
| `line` | `nil` | The game's line, ANSI stripped |
| `matches` | `matches[1]` the full match, `matches[2..n]` the captures | Same |
| `multimatches` | `{}` (reserved) | `{}` (reserved) |
| `gmcp` | The latest GMCP value per package (`gmcp.Char.Vitals.hp`); MSDP under `gmcp.msdp.<VAR>` | Same |

The backend sets `command`, `line`, `matches` and `multimatches` afresh before each alias or trigger script runs. `gmcp` starts as an empty table and fills as the game sends data.

## Functions

| Function | Does | Returns |
|---|---|---|
| `send(cmd)`, `send(cmd, show)` | Send a command to the game. `\r\n` is added unless `cmd` already ends in a newline. With `show` set to `true`, the command is also printed to the session | nothing |
| `echo(text)` | Print text to the session | nothing |
| `debugc(text)`, `printDebug(text)` | Print with a cyan `[DEBUG]` prefix | nothing |
| `printError(text)` | Print with a red `[ERROR]` prefix | nothing |
| `display(...)` | Pretty-print any Lua values | nothing |
| `enableAlias(name)`, `disableAlias(name)`, `killAlias(name)` | Toggle or delete an alias (saved) | nothing |
| `enableTrigger(name)`, `disableTrigger(name)`, `killTrigger(name)` | Toggle or delete a trigger (saved) | nothing |
| `exists(name, "alias" \| "trigger")` | Whether an alias or trigger with that name exists | `true` or `false` |
| `ext.emit(name, data)` | Send a data message to extensions ([details](/automation/ext-emit)) | `true` when sent, `false` when dropped |

## Arguments and results

### send

`cmd` can be a string, a number or a boolean. Numbers and booleans are sent as their text. Any other value, or no argument, sends nothing and raises no error. `show` counts only when it is the boolean `true`.

```lua
send("look")
send("say hello", true)  -- also shows "say hello" in the session
```

Commands you send from Lua go straight to the game. They do not pass through your aliases.

### Output functions

`echo`, `debugc`, `printDebug` and `printError` take one string. Their lines appear in the session like game output, and are written to the session log when one is open.

`display` takes any number of values of any type and prints them on one line, separated by tabs. Strings print in double quotes. A table with the keys `1..n` prints as `{ a, b }`, on one line up to five entries. Any other table prints as `{ key = value }`, on one line up to three short entries, with number keys as `[1]`. Longer tables print one entry per line. Functions print as `<function>`.

```lua
display(matches)  -- { "You have 12 gold.", "12" }
```

### Alias and trigger functions

`enableAlias`, `disableAlias`, `killAlias`, `enableTrigger`, `disableTrigger` and `killTrigger` take the name of an alias or trigger in the current **world**. The change is saved and takes effect in the running session. They return nothing and raise no error. A name that does not exist is ignored.

### exists

`exists(name, kind)` returns `true` when an alias (`kind` is `"alias"`) or trigger (`kind` is `"trigger"`) with exactly that name exists. Any other `kind` returns `false`.

The list of names is fixed when the session starts. Aliases or triggers created, renamed or deleted after that, from Lua or in the client, do not change what `exists` reports until the session restarts.

```lua
if not exists("autoloot", "trigger") then
  printError("autoloot trigger is missing")
end
```

### ext.emit

`ext.emit(name, data)` returns `true` when the message was queued for the session's clients. It returns `false` when the call is over the limit of 200 per second, or when the session's queue is full.

It raises an error, with a message that starts `ext.emit:`, when:

- `name` is not a string, or not valid UTF-8;
- `name` is not 1–64 characters of `a-z 0-9 . _ -` with at least two non-empty dot-separated parts;
- `data` cannot convert to JSON;
- the JSON is over 65,536 bytes.

The full rules are on [Talking to extensions](/automation/ext-emit).

## Next

- [Your first trigger](/automation/first-trigger).
- [Talking to extensions](/automation/ext-emit).
- [Triggers](/automation/triggers).
