---
title: Deprecations
description: Deprecated parts of the @muclient/sdk extension API, and deprecated marketplace listings.
---

# Deprecations

## SDK

The SDK keeps 1.x backwards compatible. A deprecated call keeps working in 1.x, warns in the extension's log, and stops working in 2.0.

| Deprecated | Since | Instead |
|---|---|---|
| `mu.commands.run(id)` with a core command id outside `PUBLIC_COMMANDS`, such as `panel.open.<id>` | 1.12 | A public command, or the SDK call (`mu.panels.open`). See [Run a command](/extensions/commands-settings#run-a-command). The log says `commands.run('<id>'): not a public command.` once per id |

Some versions changed behaviour without removing anything. The [changelog](/reference/changelog) marks each one.

μClient accepts extensions whose `api` range is major version 1 and no newer than its own SDK. It refuses a newer range with "It needs μClient extension API …; this μClient has … Update μClient."

## Protocol

| Deprecated | Since | Instead |
|---|---|---|
| `session.sendGmcp` with plaintext `package` and `data` | 1.10 | The sealed form: `nonce` and `ciphertext` of `{ package, data }`. See [the protocol](/reference/protocol/#sessions) |

## Marketplace listings

An extension's owners can mark its listing deprecated with a reason. To deprecate, send `deprecated` in [`PATCH /v1/extensions/{name}`](/reference/marketplace-api/#manage). To undo it, send `null`. μClient then shows "Deprecated: " and the reason on the listing and in **Extensions → Discover**. A deprecated listing can still be installed.

## npm versions

When you install from npm with a range (`npm:@scope/name@^1.4`), the backend picks the highest version that satisfies the range and is not deprecated on npm. It picks a deprecated version only when no other version matches.

## Next

- [Changelog](/reference/changelog).
- [@muclient/sdk](/reference/sdk/).
- [Marketplace API](/reference/marketplace-api/).
