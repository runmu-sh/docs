---
title: Aliases
description: Turn a short command you type into a Lua script that runs in the backend, and organise, switch off and delete aliases in the Script editor.
---

# Aliases

An alias is a regular expression and a Lua script. When a line you type matches the expression, the script runs and the line itself is not sent. The script decides what goes to the game.

## 1. Open the Script editor

Open **☰ → Views → Script editor**, or press Ctrl+K and pick **Open script editor**. The editor shows the aliases of the current **world**, and the world's name is in its toolbar.

## 2. Add an alias

Press **＋ Alias**. A new alias appears in the tree on the left, inside the selected folder or next to the selected item. On the right, type its name in the field at the top, then fill in the pattern and the script:

```text
^k (\w+)$
```

```lua
send("kill " .. matches[2])
echo("attacking " .. matches[2])
```

Typing `k rat` now sends `kill rat`. `matches[1]` is the whole match and `matches[2]` onwards are the captures. `command` holds the whole line you typed.

## 3. Save it

Press **Save** or Ctrl+S. While there are unsaved changes the button shows **•** and the panel title reads **Script editor •**. The alias works at once in every running session of the world, and keeps working in the backend while your browser is closed.

As you type, the strip under the script checks the Lua syntax and shows **✓ script ok**, or **⚠** and the error. An alias saved with a syntax error is switched off and shows **⚠** in the tree until you fix it.

## How matching works

- An alias has one pattern, and it is always a regular expression.
- The pattern can match anywhere in the line. Anchor it with `^` and `$` so `k` does not also catch `kick`.
- Only the first alias that matches runs. Nothing is sent for that line unless the script calls `send`.
- Lines sent with `send` go straight to the game and skip your aliases, so an alias cannot call itself.
- Lookahead, lookbehind and backreferences (`(?=…)`, `\1`) are not supported. The editor may accept such a pattern, but the alias never runs.
- Aliases run only while the session is connected. A line starting with `lua ` never reaches them (see [Macros](/automation/macros#run-lua-from-the-command-line)).

::: tip Two kinds of alias
**Settings → Triggers → Aliases** holds quick aliases: a name and a command with `$1`, `$2` and `$*`, expanded in the client with no Lua. Your line is split on the command separator (`;` by default) first, then quick aliases expand each piece, then the Lua aliases in the Script editor see what is left.
:::

## Switch an alias on and off

- Click the lamp in front of its name in the tree, or select the row and press Space. This saves at once.
- Or flip **Enabled** in the detail pane and press **Save**.
- From Lua, `disableAlias("name")` and `enableAlias("name")`. The change is saved, and the tree shows it the next time it loads.

An alias inside a switched-off folder does not run either. Its row is shown in italics, and hovering it shows **disabled by its folder**.

## Folders and order

Drag a row to move it. Drop it on the upper or lower part of a row to place it before or after, or on the middle of a folder to put it inside. In the tree, ↑ and ↓ move the selection, → and ← open and close folders.

Aliases and triggers live in separate trees, so an alias cannot go into a folder of triggers. **＋ Folder** with nothing selected makes a trigger folder. To make a folder for aliases, add an alias, leave its pattern and script empty, and save it. Then drag other aliases into it.

## Delete an alias

Select it, press **×** in the toolbar and confirm. Deleting a folder deletes everything inside it. From Lua, `killAlias("name")` deletes an alias for good.

## When the script fails

::: warning Errors are not shown
A Lua error at run time stops the script, and the line you typed is not sent. The error is not printed in the session, and the **Debug log** of the **Session** panel does not list it.
:::

Guard code that can fail with `pcall` and print the error yourself:

```lua
local ok, err = pcall(function()
  send("kill " .. matches[2])
end)
if not ok then printError(err) end
```

## Next

- [Triggers](/automation/triggers): the same for lines the game sends.
- [Macros](/automation/macros): run a command or Lua from a key.
- [Every Lua function](/reference/lua/).
