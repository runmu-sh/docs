---
title: Search
description: Find a line in the Terminal's scrollback or in a recorded log, with plain text or a regular expression.
---

# Search

Both the Terminal and the log reader in the Logs panel have a search strip. It highlights every matching line and steps through them.

## 1. Open it

In the Terminal, press **Ctrl+F** or the **Search** button in the toolbar. Ctrl+F works while you are typing in the command line too. Press it again with the strip open to select what you typed and search again.

In the Logs panel, the strip is already open when a log loads. The **Search** button hides and shows it.

## 2. Type what you are looking for

Plain text matches anywhere in a line, ignoring case:

```text
tells you
```

Wrap it in slashes for a JavaScript regular expression, with flags after the last slash:

```text
/^\[(ooc|newbie)\]/i
```

Without flags a regular expression is case-sensitive. While you are still typing (`/^\[oo`), μClient already searches with what you have, ignoring case. If the expression does not compile, the counter says **not a valid regex**.

The counter shows the current match and the total, such as `3/17`, or **no match**.

## 3. Step through the matches

| | Terminal | Logs panel |
|---|---|---|
| Starts at | the newest match | the first match |
| Next match | ↓, Shift+Enter, **Next** | ↓, Enter, **Next** |
| Previous match | ↑, Enter, **Prev** | ↑, Shift+Enter, **Prev** |
| Esc | closes the strip | clears the text, then closes |

In the Terminal, Enter goes back in time, towards older lines, because you start at the newest line. Lines that arrive while the strip is open are searched as they come in and join the count.

**Close** hides the strip and puts focus back on the output.

## What is searched

Search covers the lines the view shows.

- Lines hidden by a category chip (Speech, Combat and the rest) are skipped. Click **all** to search everything.
- In the Terminal, lines before a **Clear** (Ctrl+L) are skipped.
- The Terminal keeps at least the most recent 5,000 lines of a session. For older lines, open the session's log in the [Logs panel](/guide/logs) and search there.

The **search logs** box at the top of the Logs panel is a different tool. It narrows the list of logs by world, session or date.

## Change the key

**Settings → Keys** lists every command with its key. Click the key next to **Search log** and press a new one. Esc cancels, Backspace clears it.

## Next

- [Logs](/guide/logs): read and save recorded sessions.
- [Your first trigger](/automation/first-trigger): react to a line automatically once you know what it looks like.
