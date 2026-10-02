---
title: Sign-in and devices
description: Sign in on a second device, recover a forgotten password, know which settings follow your account, back your settings up to a file, and sign out.
---

# Sign-in and devices

One account works in every browser and in the desktop app. Your worlds, triggers and most settings come with it. To create the account, see [Connect to your first world](/guide/first-world).

## Sign in on another device

1. Open [play.runmu.sh](https://play.runmu.sh) or the desktop app on the new device.
2. Enter your email and password and press **Sign in**.

Your worlds and their running sessions are there.

After a reload, μClient shows **Unlock** and asks for your password again to unlock your keys on this device. **Sign out** there goes back to the sign-in form.

In a browser, play.runmu.sh and runmu.sh share one sign-in. Sign in on one and the other opens signed in (it may ask for your password to unlock). Sign out of one and you are signed out of both.

::: tip
The desktop app keeps its own sign-in. Signing in or out on runmu.sh does not change it.
:::

## Your password and recovery phrase

Your keys come from the 24-word **Recovery phrase** you saw at sign-up, and they are made on your device. Your game output, logs, scripts and settings are encrypted with them before the server stores them. Your password locks the keys. The server checks a proof of your password and never receives the password or the keys.

Each world has its own key. While a session is open, the backend holds that world's key in memory so it can run your triggers and aliases. It forgets the key when the session closes.

## Recover a forgotten password

1. On the sign-in form, choose **Forgot password**.
2. Enter your email, the 24 words of your recovery phrase, and a new password twice.
3. Press **Reset password**.

Without the password and the phrase, nobody can open your data again, μClient included.

## What syncs

**Follows your account to every device:**

- colour theme, custom colours, font, text size, line height ([Themes](/guide/themes))
- the Terminal's options: timestamps, echo, line width, output categories
- input options, command history, macros, key bindings
- mention words and channel alerts
- your installed extensions
- each world's connection settings

Triggers and aliases live on the server and run there, so they are the same everywhere.

**Stays on this device:**

- panel layouts, saved layouts, **Lock layout**, each panel's font and opacity ([Panels and layouts](/guide/panels))
- screen effects, **Reduce motion**, **Screen reader mode**, **Speak new output**
- volume, mute, keyboard sounds, room music
- **Desktop notifications** and **Open web pages**
- **Alert on every device**

## Sounds and alerts on several devices

With one session open on several devices or tabs, sounds, toasts and notifications that the game causes play on one of them: the one you are looking at. When you look at none, each device's first tab plays them. To hear a device even while you play on another, turn on **Settings → Alerts → Alert on every device** on that device. It is off by default.

## Back up your settings

**Settings → Backup** writes your settings to a JSON file and reads them back.

1. Under **World**, pick **All worlds** or one world. One world exports its own overrides plus your settings for all worlds.
2. Press **Export config**. The file downloads as `muclient-config.json`, with the world's id added when you export one world.

To restore, press **Import config** and choose the file. μClient reports `imported N settings`, or `not a μClient config file`. Imported values replace the ones you have. The file holds settings only. Layouts, triggers, aliases and logs are not in it.

::: warning
The exported file is not encrypted. Anyone who has it can read your settings, including mention words and command history.
:::

## Sign out

**Settings → Account** shows the email you are signed in with. **Sign out** removes your sign-in and keys from this device and disconnects it. In a browser it signs you out of runmu.sh too.

## Next

- [Worlds and sessions](/guide/worlds-and-sessions): pick up a session on this device.
- [Themes](/guide/themes): the settings you see on every device.
- [Logs](/guide/logs): read what you played on another device.
