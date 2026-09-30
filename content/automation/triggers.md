---
title: Triggers
description: Run Lua in the backend when the game sends a line that matches, with several patterns, AND mode, highlight colours, sounds, folders and startup scripts.
---

# Triggers

A trigger is a list of patterns and a Lua script. When a line from the game matches, the script runs in the backend with the line in `line` and the captures in `matches`. [Your first trigger](/automation/first-trigger) walks through one from start to end.

## 1. Open the Script editor

Open **☰ → Views → Script editor**, or press Ctrl+K and pick **Open script editor**. It shows the triggers of the current **world**.

## 2. Add a trigger

Press **＋ Trigger**, or Ctrl+N while the editor is open. Type its name in the field at the top, then fill in **Patterns** and **Script**. Pick names you can type: `enableTrigger`, `disableTrigger`, `killTrigger` and `exists` find a trigger by its name.

## 3. Save it

Press **Save** or Ctrl+S. The trigger runs from then on in every session of the world, including while your browser is closed. The strip under the script checks the Lua syntax as you type. A trigger saved with a syntax error is switched off and shows **⚠** in the tree.

## Patterns

Each row has a type and a text. **+ pattern** adds a row, ↑ and ↓ reorder, × removes. A new row starts as **substring**.

| Type | Matches when the line | `matches` |
|---|---|---|
| **substring** | contains the text | `{ text }` |
| **regex** | matches the regular expression anywhere | the whole match, then each capture |
| **exact** | is exactly the text | `{ line }` |
| **begins** | starts with the text | `{ text }` |
| **ends** | ends with the text | `{ text }` |
| **prompt** | never (see the warning) | |

All types are case-sensitive. A regex the editor cannot read shows its error under the row. Lookahead, lookbehind and backreferences (`(?=…)`, `\1`) are not supported: the editor may accept such a pattern, but it never matches.

Each line is matched on its own, with colours removed. Empty lines are skipped. Every enabled trigger is tried on every line, so one line can fire several triggers.

```text
regex   ^(\w+) tells you '(.+)'$
```

```lua
echo("from " .. matches[2] .. ": " .. matches[3])
```

## Pattern options

These rows sit under the pattern list.

- **Match all (AND)**: off, the trigger fires when any pattern matches, and `matches` comes from the first one that did. On, every pattern must match the same line, and `matches` holds the results of all patterns one after another.
- **Fire length**: a number from 0 to 50, saved with the trigger.
- **Highlight**: a colour for the whole line when the trigger fires. **×** clears it. When several fired triggers have a colour, the first one wins, and a highlight from **Settings → Triggers** paints over it.
- **Sound**: a file name or a URL, played when the trigger fires. A bare name is looked up at the game's media address if the game sent one. Sounds follow mute and the master volume, never play for lines replayed on reconnect, and play at most once every 250 ms per session.

::: warning Not working yet
**Fire length** has no effect. A trigger always sees one line. The **prompt** pattern type never matches.
:::

## Switch triggers on and off

- Click the lamp in front of a row, or select it and press Space. This saves at once.
- Or flip **Enabled** in the detail pane and press **Save**.
- From Lua, `disableTrigger("name")` and `enableTrigger("name")` save the change too.

A trigger in a switched-off folder does not fire. Its row is shown in italics, and hovering it shows **disabled by its folder**. Folders are how you build modes: switch the folder off with its lamp and every trigger inside stops.

From a script, switch the triggers themselves:

```lua
-- an alias on ^afk$
disableTrigger("attack")
disableTrigger("flee")
echo("combat triggers off")
```

`disableTrigger` on a folder saves the folder as off, but the triggers inside keep firing in running sessions until the world's triggers next load (when you save a trigger, or the session restarts).

## Folders and order

**＋ Folder** adds a folder. Drag rows to reorder them, or drop one on the middle of a folder to move it inside. In the tree, ↑ and ↓ move the selection, → and ← open and close folders. Triggers and aliases keep separate trees, so a trigger cannot sit in an alias folder.

## Delete a trigger

Select it, press **×** in the toolbar and confirm. Deleting a folder deletes everything inside it. `killTrigger("name")` deletes one from Lua.

## Shared state and startup scripts

One Lua state runs per session, so a global set in one script is there for the next:

```lua
kills = (kills or 0) + 1
echo("kills this session: " .. kills)
```

To set things up before the first line arrives, press **＋ Script**. A script has no pattern. It runs when the session starts, and again in every running session of the world each time you add, save or delete a script. Disabled scripts and scripts with a syntax error are skipped. Scripts always sit at the top level of the tree. A failing startup script prints `[ERROR] startup script '<name>': …` in the session.

## When a script fails

::: warning Errors are not shown
A run-time error stops that trigger's script. The line still shows and other triggers still run. The error is not printed in the session, and the **Debug log** in the **Session** panel (**☰ → Views → Session**) does not list it.
:::

Guard risky code with `pcall`:

```lua
local ok, err = pcall(function()
  send("get " .. matches[2])
end)
if not ok then printError(err) end
```

::: tip Quick rules or Lua?
**Settings → Triggers** has quick rules (highlights, gags, aliases, actions) that run in the client with no Lua. Use them to colour and hide lines. Its **Open Script editor ›** link brings you here when you need logic.
:::

## Next

- [GMCP and MSDP data](/automation/gmcp): react to the game's data as well as its text.
- [Aliases](/automation/aliases): scripts for the lines you type.
- [Every Lua function](/reference/lua/).
