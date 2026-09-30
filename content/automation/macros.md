---
title: Macros
description: Put commands and Lua on the hotbar and on keys, and run Lua from the command line with lua <code>.
---

# Macros

A macro is a button on the hotbar, above the command line, with an optional key. Pressing either sends a command to the game or runs a line of Lua in the backend. Macros belong to a **world** and follow your account to other devices. A new world starts with **Look**, **Who**, **Inv** and **Score** on F2 to F5.

## 1. Open the editor

Press **Macros** at the right end of the hotbar. Every macro turns into a row of fields. Press **Done** when you have finished.

**Settings → Macros** has the same list as rows. It has no kind field, so make Lua macros on the hotbar.

## 2. Add a macro

Press **Add** (on the hotbar) or **Add macro** (in Settings) and fill in the new row, left to right:

- icon (shows **◆** when empty): up to two characters, shown before the label;
- **label**: the button text (the command is shown when it is empty);
- **command**: what to send, or the Lua code;
- kind: **command** or **lua**;
- key (**bind** on the hotbar, **key** in Settings): click it and press a combination. Esc cancels, Backspace clears.

Each field saves when you leave it.

## 3. Run it

Click the button or press its key. Keys work only while a session is open. While you type in the command line, keys with Ctrl, Alt or Meta and the F keys still fire. Every macro is also in the command palette (Ctrl+K) under its label.

## Command macros

The command goes through the same steps as a line you type. It is split on the command separator (`;` by default), quick aliases expand it, then Lua aliases see it in the backend.

```text
get all from corpse;put all in pack
```

A command that ends with a space is not sent. It fills the command line and puts the cursor there, so you can type the rest:

```text
tell 
```

## Lua macros

Set the kind to **lua** and put Lua in **command**. It runs in the session's Lua state, where your triggers' globals and the [`gmcp` table](/automation/gmcp) are:

```lua
send("cast heal " .. (gmcp.Char and gmcp.Char.Status and gmcp.Char.Status.name or "me"))
```

The code is sent whole, so a `;` inside it is safe. After it runs, the session prints its value, which is `nil` for a call that returns nothing.

## Reorder and delete

On the hotbar, drag a button onto another to move it, or use ‹ and › in edit mode. In **Settings → Macros**, use ↑ and ↓. **×** deletes a macro.

## Run Lua from the command line

Type `lua` and a space, then Lua:

```text
lua 2 + 2
```

The session shows `4`. The code is evaluated as an expression first, and as a block of statements when that fails, so both of these work:

```text
lua gmcp.Char
```

```text
lua for i = 1, 3 do echo("line " .. i) end
```

The value prints the way `display` prints it, with strings in double quotes and tables as `{ key = value }`. An error prints as `Error: Scripting error:` followed by Lua's message. `lua` works while the session is disconnected too.

::: warning Semicolons
On the command line, `;` splits your entry before the backend sees it. Write `\;` to keep one. A line that starts with `#lua ` is never split, so `#lua a = 1; b = 2` runs whole.
:::

## Next

- [GMCP and MSDP data](/automation/gmcp): what `gmcp` holds.
- [Aliases](/automation/aliases): when a typed word should run Lua.
- [Every Lua function](/reference/lua/).
