---
title: Lua functions
audience: automation
---

# Lua functions

The whole scripting API. The backend test `lua_exposes_automation_functions_only` fails if a function is added without updating this list, and Lua never gets UI calls: that is what [extensions](/extensions/) are for.

::: info Generated content, eventually
This page is hand-written for now. The plan is for the backend to emit its function table as JSON and for a bot PR to keep `reference/generated/` current (see [CONTRIBUTING](https://github.com/runmu-sh/docs/blob/main/CONTRIBUTING.md)).
:::

## Context variables

| Name | In an alias | In a trigger |
|---|---|---|
| `command` | The input line | `nil` |
| `line` | `nil` | The game's line, ANSI stripped |
| `matches` | `matches[1]` the full match, `matches[2..n]` the captures | Same |
| `multimatches` | `{}` (reserved) | `{}` (reserved) |
| `gmcp` | The latest GMCP value per package (`gmcp.Char.Vitals.hp`); MSDP under `gmcp.msdp.<VAR>` | Same |

## Functions

| Function | Does |
|---|---|
| `send(cmd)` | Send a command to the game (a line ending is added) |
| `echo(text)` | Print text to the session |
| `debugc(text)`, `printDebug(text)` | Print with a cyan `[DEBUG]` prefix |
| `printError(text)` | Print with a red `[ERROR]` prefix |
| `display(...)` | Pretty-print any Lua values |
| `enableAlias(name)`, `disableAlias(name)`, `killAlias(name)` | Toggle or delete an alias (saved) |
| `enableTrigger(name)`, `disableTrigger(name)`, `killTrigger(name)` | Toggle or delete a trigger (saved) |
| `exists(name, "alias" \| "trigger")` | Whether an alias or trigger with that name exists |
| `ext.emit(name, data)` | Send a data message to extensions ([details](/automation/ext-emit)) |
