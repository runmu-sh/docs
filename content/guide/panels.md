---
title: Panels and layouts
description: Open panels from the Views menu, dock them where you want, save and lock layouts, and pop a panel out into its own window.
---

# Panels and layouts

Everything in a session sits in a panel: the Terminal, Channels, the Scene, Logs, the Script editor and any panel an extension adds. μClient remembers how you arrange them, per world.

## Open a panel

Open **☰** (top left) and go to **Views**. The submenu lists every panel, with a dot after the ones open in this session. Pick one to open it, or to bring it to the front. The entries are greyed out until a session is open.

On the keyboard, → or Enter opens **Views**, ↑ and ↓ move, ← or Esc goes back. The command palette (Ctrl+K) has an entry for every panel, such as **Open logs**.

**Views** also lists the **GMCP** inspector (**Open GMCP inspector** in the palette). It shows every GMCP and MCP message the game and your extensions exchange, for debugging. It records only while it is open.

Some panels open themselves the first time their data arrives, such as Channels when the game sends its first channel message over GMCP. If you close one, it stays closed in that world on this device.

## Dock panels

- **Move**: drag a tab by its title. Drop it in the middle of another panel to join it as a tab, or on an edge to split that side.
- **Resize**: drag the gap between two panels.
- **Close**: right-click the tab and choose **Close**.

A world starts with the Terminal on the left, the Scene top right and Channels bottom right. In a window narrower than 720 px the panels open as tabs in one group.

::: tip
With **Screen reader mode** on (**Settings → Access**), every panel sits in one group of tabs. μClient does not save that arrangement. Turn the mode off and your layout comes back.
:::

## Font and opacity per panel

Right-click a panel's tab for **Font** (10 to 24 px) and **Opacity** (30 to 100 %) sliders. **Settings → Panels** has the same pair for each panel open in the current session. They apply to that panel in the current world, on this device.

## Save a layout

μClient saves each world's layout as you change it. To keep a layout you can load in any world:

1. **☰ → Views → Save layout**.
2. Type a name (up to 40 characters) and press **Save**. Reusing a name replaces that layout.

Saved layouts appear by name in **Views**. Pick one to load it into the current session. The **×** next to a name deletes it.

**Views → Reset layout** asks for confirmation, then puts the current world back to the default layout.

## Lock the layout

**☰ → Lock layout** is a switch, also in **Views** as **Lock layout** or **Unlock layout**. While locked, you cannot drag tabs or resize panels, and μClient stops saving layout changes. Unlocking saves the layout as it is. The lock applies to every world on this device.

Layouts, the lock, and panel font and opacity stay on this device. See [what syncs](/guide/account#what-syncs).

## Pop a panel out

Right-click a tab and choose **Pop out ⇱**, or press **Pop out** next to a panel in **Settings → Panels**. The panel moves into its own window, in your theme.

If the browser blocks it, μClient shows **Popup blocked**. Allow pop-ups for play.runmu.sh and try again. After a reload, a popped-out panel comes back floating inside the main window.

::: tip
In the desktop app a pop-out is a separate app window. If that window cannot open, the panel floats inside the main window.
:::

## Next

- [Logs](/guide/logs): the Logs panel and saving what you read.
- [Themes](/guide/themes): colours and fonts for every panel.
- [Worlds and sessions](/guide/worlds-and-sessions): each session keeps its own set of panels.
