---
title: Connect to your first world
description: Create a μClient account, add a game as a world, connect to it and send your first command.
---

# Connect to your first world

You need an email address and the host and port of a game. The game's website lists them, often as something like `mud.example.org 4000`.

## 1. Create an account

Open [play.runmu.sh](https://play.runmu.sh) and choose **Create an account** under the sign-in form. Enter your email, a password of at least 8 characters, and the password again, then press **Create account**.

μClient shows a **Recovery phrase** of 24 words. Write them down, or use **Copy** or **Download** to keep a copy offline. If you lose your password, the phrase is the only way back into your worlds, and μClient cannot recover it for you. Tick **I have written down my recovery phrase and stored it safely** and press **Continue**.

The same account signs you in on runmu.sh and in the desktop app. [Sign-in and devices](/guide/account) covers other devices and password recovery.

## 2. Pick a theme

The first time you sign in, the client asks you to choose a colour theme. Pick one and press **Use this theme**, or **Keep Haemal** for the default. A short tour of the client follows. **Skip** leaves it. To change the theme later, see [Themes](/guide/themes).

## 3. Add the world

You land on **Home**, the list of your worlds. Press the dashed **add world** card. The same form opens from **☰ → Add world…**.

Fill in:

- **Name**: what the world is called in your tabs and menus.
- **Host**: the game's address, such as `mud.example.org`.
- **Port**: the game's port, `4000` until you change it.

Leave the rest as it is and press **Add & connect**.

## 4. Watch it connect

A tab opens at the top with the world's name and a session named after it, such as `Underspire-1`. The lamp on the tab blinks while it connects and holds steady once it is connected. The game's welcome text appears in the output.

If the game drops the connection, a **Disconnected** dialog offers **Reconnect** and **Close session**. To fix a wrong host or port, right-click the tab and choose **Edit world…**.

## 5. Send a command

Click the command bar (it reads `enter command`), type a command and press Enter:

```text
look
```

The text goes to the game and its answer appears in the output. ↑ and ↓ walk back through what you have typed.

Your session keeps running in μClient's backend when you close the browser tab. Open [play.runmu.sh](https://play.runmu.sh) again and it is where you left it.

## Next

- [Worlds and sessions](/guide/worlds-and-sessions): more characters, more games, switching between them.
- [Panels and layouts](/guide/panels): the windows around the output.
- [Your first trigger](/automation/first-trigger): react to what the game prints.
