---
title: What Lua is for
description: What Lua does in μClient, where it runs, and when to reach for an alias, a trigger, a macro or an extension.
audience: automation
---

# What Lua is for

Every game session runs one Lua 5.4 state **in the backend**. Aliases, triggers and the `lua <code>` command line all run there, which means your automation keeps working while your browser tab is closed and behaves the same on every device you sign in from.

Lua is for **game automation only**. It can:

- send commands to the game (`send`);
- print to the session (`echo`, `display`, `printError`);
- enable, disable and delete aliases and triggers;
- read the latest GMCP and MSDP data the game sent (`gmcp.Char.Vitals.hp`);
- pass data to extensions with [`ext.emit`](/automation/ext-emit).

It cannot draw anything. Panels, buttons, settings and everything else you see in the client are [extensions](/extensions/), written in TypeScript. The two meet at `ext.emit`. A trigger notices something in the game text and passes it on, and an extension shows it.

::: tip Which one do I want?
If the words "when the game says X, send Y" describe it, it is a trigger. If it needs a window, a list or a button, it is an extension, and it can still get its data from a trigger.
:::

## Where scripts live

| Kind | Runs when | Has |
|---|---|---|
| **Alias** | You type a line that matches its pattern | `command`, `matches` |
| **Trigger** | The game sends a line that matches its pattern | `line`, `matches` |
| **Lua macro** | You press its key or its hotbar button | the `gmcp` table |
| `lua …` | You type it | the `gmcp` table |

Alias patterns are regular expressions. Trigger patterns can also be plain text (contains, begins, ends, exact). `matches[1]` is the whole match and `matches[2]` onwards are the captures, the way Mudlet does it.

## Next

- [Your first trigger](/automation/first-trigger)
- [Aliases](/automation/aliases)
- [Every Lua function](/reference/lua/)
