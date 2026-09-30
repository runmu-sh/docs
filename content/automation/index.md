---
title: What Lua is for
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

It cannot draw anything. Panels, buttons, settings and everything else you see in the client are [extensions](/extensions/), written in TypeScript. The two meet at `ext.emit`: Lua notices something in the game text and says so; an extension shows it.

::: tip Which one do I want?
If the words "when the game says X, send Y" describe it, it is a trigger. If it needs a window, a list or a button, it is an extension, and it can still get its data from a trigger.
:::

## Where scripts live

| Kind | Runs when | Has |
|---|---|---|
| **Alias** | You type a line that matches its pattern | `command`, `matches` |
| **Trigger** | The game sends a line that matches its pattern | `line`, `matches` |
| **Macro** | You press its key | nothing but the `gmcp` table |
| `lua …` | You type it | the `gmcp` table |

Patterns are regular expressions; `matches[1]` is the whole match and `matches[2]` onwards are the captures, the way Mudlet does it.

Next: [Your first trigger →](/automation/first-trigger)
