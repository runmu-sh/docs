---
title: Deprecations
description: Deprecated parts of the @muclient/sdk extension API, and deprecated marketplace listings.
---

# Deprecations

## SDK

No member of `@muclient/sdk` is deprecated. Versions 1.0 to 1.6 each add members and remove none. The [changelog](/reference/changelog) lists what each version added.

μClient accepts extensions that declare API major version 1 (`"api": "^1.3"` in the manifest). It refuses other major versions with "this μClient provides 1.x".

## Marketplace listings

An extension's owners can mark its listing deprecated with a reason. To deprecate, send `deprecated` in [`PATCH /v1/extensions/{name}`](/reference/marketplace-api/#manage). To undo it, send `null`. μClient then shows "Deprecated: " and the reason on the listing and in **Extensions → Discover**. A deprecated listing can still be installed.

## npm versions

When you install from npm with a range (`npm:@scope/name@^1.4`), the backend picks the highest version that satisfies the range and is not deprecated on npm. It picks a deprecated version only when no other version matches.

## Next

- [Changelog](/reference/changelog).
- [@muclient/sdk](/reference/sdk/).
- [Marketplace API](/reference/marketplace-api/).
