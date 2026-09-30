---
title: Logs
description: Read the recorded logs of every world in the Logs panel, filter and search them, and save a log or the Terminal as HTML, ANSI or text.
---

# Logs

μClient records every session while it is connected to the game. Each connection is one log. The logs are kept on the server, encrypted with your world's key, so you can read them from any device you sign in on.

## 1. Open the Logs panel

Any of these opens it:

- **☰ → Views → Logs**.
- Right-click a world's tab and choose **Logs**.
- On the Home screen, the **Logs** button on a world's card.

The panel lists the logs of all your worlds, with the current world at the top.

## 2. Find a log

The list on the left is grouped by world, then by date. Each entry shows the time the connection started, the session's name and the log's size. Click a world's name to fold or unfold it.

Type in the **search logs** box to filter the list by world name, session name or date (`2026-09-30`). The **↺** button reloads the list, for example after a connection has closed.

## 3. Read it

Click an entry. The log opens on the right at its first line, with the same tools as the Terminal:

- **Category chips** (Speech, Pose, Combat, Comms, Look, System): click one to hide or show those lines. Double-click, or Alt+click, to show only that category. **all** shows everything again.
- **Times** shows the time of each line.
- **Search** opens the search strip, which is open when a log first loads. See [Search](/guide/search).

The header shows the world, the session and when the log started.

## 4. Save it

Press **Save** and pick a format:

| Format | What you get |
|---|---|
| **HTML** | Colours as you see them in your current theme. Opens in a browser. |
| **ANSI** | Colour codes, for a terminal or another MUD client. |
| **TEXT** | Plain text, no colour. |

The file downloads to your browser's download folder, named after the world, session and start time. It holds the lines you can see. Lines hidden by a category chip are left out. With **Times** on, HTML and TEXT include the timestamps.

::: warning
A saved file is plain, unencrypted text on your disk. Keep it somewhere private.
:::

## Save the Terminal instead

The Terminal has the same **Save** button, with the same three formats, for the session you are playing. It saves the recent lines the Terminal holds, filtered by the chips, from the last **Clear** on. The file name is the world, the session and the date and time, such as `Aardwolf Aardwolf-1 2026-09-30-12-39-05.html`.

**Clear** (Ctrl+L) empties the Terminal's view only. The log keeps every line.

For anything older than the Terminal's recent lines, use the Logs panel.

## Next

- [Search](/guide/search): find a line in the Terminal or in a log.
- [Panels and layouts](/guide/panels): dock the Logs panel or pop it out.
- [Sign-in and devices](/guide/account): how your logs are encrypted.
