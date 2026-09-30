---
title: Worlds and sessions
description: Add, edit, duplicate and delete worlds, open several sessions in one world, and move between them.
---

# Worlds and sessions

A **world** is a game you have saved, with a name, a host and a port. A **session** is one connection to it, usually one character, with its own tab. A world can have many sessions.

## Find your worlds

- **Home** shows a card per world with its state, sessions, unread lines and mentions. Open it from **☰ → Home** or with Ctrl+Alt+H. Type on Home to filter the cards.
- **☰** lists your worlds under **Worlds**. Alt+Shift+↑ and ↓ reorder them, and the order is saved to your account.
- **Ctrl+J** opens the switcher. Type part of a world's or session's name, then press Enter to open it or Ctrl+Enter to start a new session there. Tab jumps to the matching sessions. The last row, **Add world “…”**, opens the form with that name.

Ctrl+Alt+1 to 9 open the first nine worlds in your order. Ctrl+Alt+↑ and ↓ step through worlds, Ctrl+Tab and Ctrl+Shift+Tab through the sessions of the world on screen.

## Add or edit a world

Add a world from the dashed **add world** card on Home or **☰ → Add world…**. Edit one with **Edit** on its Home card, or **Edit world…** in its world menu (right-click its tab or its row in **☰**).

| Field | |
|---|---|
| **Name** | Shown on tabs, menus and cards. Required. |
| **Icon colour** | Tints the world's initials. |
| **Icon** | **Image…** picks a PNG, JPEG, WebP or GIF up to 5 MB and lets you crop it. |
| **Host** | The game's address. Required. |
| **Port** | 1 to 65535, `4000` by default. |
| **SOCKS5 proxy** | Connect through a proxy: **Proxy host**, **Proxy port**, and **Proxy user** and **Proxy password** if needed. |

A new world has **Add & connect**, which saves it and opens a session. Editing shows **Save**, and **Delete** on the left.

::: tip
**Play in μClient** on a game's page at [runmu.sh/games/](https://runmu.sh/games/) asks **Add …?** and saves the world without connecting. If you already have that host and port, it asks **Open …?** instead.
:::

## Open more sessions

Two sessions let two characters play the same game side by side. Start one with:

- **＋ New session** at the end of the tab bar, or **☰ → New session**,
- a middle-click on any tab of that world,
- **＋ Session** on the world's Home card.

New sessions are named after the world: `Underspire-1`, `Underspire-2`. Double-click a tab, or press F2 on it, to rename it. The name follows you to your other devices.

::: tip
In the desktop app, Ctrl+T opens a new session. Browsers keep Ctrl+T for their own tabs, so the web client has no key for it.
:::

## Reconnect and disconnect

The lamp on each tab blinks while its session connects, holds steady once connected, and turns the alert colour when the connection is gone. A background session that loses its connection shows a message. Click it to go there.

In the world menu, **Reconnect all** reconnects every disconnected session of that world. **Disconnect all** disconnects every session and keeps the tabs.

The × on a tab closes that session, after asking if it is still connected.

## Duplicate or delete a world

**Duplicate** in the world menu saves a copy with the same host, port, icon and settings, named `<name> copy`. **Delete world…** asks you to type the world's name, then deletes it and closes its sessions.

## Next

- [Panels and layouts](/guide/panels): arrange what each session shows.
- [Logs](/guide/logs): read back what happened in a session.
- [Sign-in and devices](/guide/account): sign in on another device and find the same worlds there.
