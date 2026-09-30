---
title: Publish to the marketplace
description: Link a GitHub repository so each version tag or release becomes a marketplace version, sign it with minisign, and manage versions.
---

# Publish to the marketplace

Link your extension's GitHub repository to the [marketplace](https://runmu.sh/marketplace/) once. Every version tag or GitHub release you push after that becomes an installable version.

## 1. Choose a handle

Sign in at [runmu.sh/marketplace](https://runmu.sh/marketplace/) and open **Profile and API tokens** from the account menu. Fill in **Public profile** and choose **Create profile**. The **Handle** (2 to 32 lower-case letters, digits and dashes, starting with a letter and not ending with a dash) cannot be changed later.

## 2. Prepare the package

The marketplace imports what is in the repository and builds nothing. Before you tag:

- Run `npm run build` and commit `dist/`. If you publish from releases with a `.tgz` attached (step 5), `dist/` can stay out of git, because the `.tgz` carries it.
- Check that `package.json` has `exports` naming the built entry, a `version`, and a `muclient` manifest whose `api` is a 1.x range.
- Name your handle in the manifest as `publisher`. This proves the repository is yours.

```json
{
  "muclient": {
    "publisher": "your-handle"
  }
}
```

`publisher` can also be a list of handles. The `package.json` at every imported tag must name an owner of the listing.

The listing takes its text and links from `package.json` (see [The manifest](/extensions/manifest) for the fields). `README.md` becomes the overview and `CHANGELOG.md` the changelog. Without a changelog, the GitHub release notes are used.

## 3. Link the repository

Push that `package.json` to the default branch. The repository must be public. On the marketplace, open **Your extensions** from the account menu. Under **Publish an extension** pick **From GitHub**, enter `you/your-extension` or its URL, and choose **Link and import**.

Under **Options**:

| Field | |
|---|---|
| **Versions from** | **Every version tag** (default) or **Published GitHub releases only** |
| **Tag prefix** | For several packages in one repository: prefix `automapper-` reads `automapper-v1.2.0` |
| **Folder** | The package folder in a monorepo, such as `packages/automapper` |

The first link creates the listing under the manifest's id and makes you its owner.

## 4. Push a tag

```sh
npm version 1.0.0 && git push --follow-tags
```

A version tag is the prefix, an optional `v`, then a semantic version: `v1.0.0`, `1.0.0-beta.1`. The marketplace ignores `latest`, `1.2` and tags with `+build` metadata. When `package.json` names another version, the marketplace uses the tag's number and notes it in the sync log.

The marketplace checks the repository every 30 minutes and imports at most ten versions per run, oldest first. To publish within seconds, add the webhook shown under **Publish the moment you push a tag** on the listing's **Manage** page (GitHub: **Settings → Webhooks → Add webhook**). **Sync now** checks at once, and **Retry skipped tags** looks again at tags that failed. Each skipped tag is listed with its reason.

## 5. Or publish from releases

With **Published GitHub releases only**, drafts wait until you publish them. When a release has a `.tgz` asset (the output of `npm pack`), that file is the package. Otherwise the source at the release's tag is. Pre-releases are imported too.

## Sign it

Signing is optional. Once a listing has a key, every version must be signed with it. Make a key pair once with [minisign](https://jedisct1.github.io/minisign/), then sign each build:

```sh
minisign -G
npm run build
minisign -Sm dist/index.js
```

`minisign -G` writes the public key to `minisign.pub` and the secret key to `~/.minisign/minisign.key`. `minisign -Sm dist/index.js` writes `dist/index.js.minisig`, which ships next to the entry. Commit it with `dist/`, or put it in the release `.tgz`.

Set the public key (the line after the comment in `minisign.pub`) as `muclient.publisherKey` before your first publish, or later under **Publisher key** on the **Manage** page. The marketplace refuses a version whose signature does not verify, or whose `publisherKey` differs from the listing's. What the player sees at install is under [Trust](/extensions/manifest#trust).

## Versions

- A version number is used once. You cannot publish over it, and it stays taken after the version is deleted.
- A tag that moves after its version was imported is skipped: published versions never change.
- A bare install gets the highest version that is not yanked and not a pre-release (a pre-release only when there is nothing else).
- **Yank** on the **Manage** page hides a version from search and the index. People who pinned it keep it.
- You can delete a version within 72 hours of publishing it, or after yanking it.
- A package is at most 20 MB.

## Without GitHub

Under **Publish an extension**, **Upload a .tgz** takes the file `npm pack` writes. From CI, create a token under **API tokens** on **Profile and API tokens**, put it in `MKT_TOKEN`, and send the tarball. For a package named `ext-my-ext` at version 1.0.0:

```sh
npm run build && npm pack
curl -H "Authorization: Bearer $MKT_TOKEN" --data-binary @ext-my-ext-1.0.0.tgz https://market.runmu.sh/v1/publish
```

A token can publish, yank and edit your listings. It cannot delete listings or versions, manage owners or change the publisher key. The same rules apply as for GitHub, and you can upload 30 packages an hour.

## Next

- [The manifest](/extensions/manifest): every field of `muclient`.
- [Marketplace API](/reference/marketplace-api/): the endpoints behind these pages.
- [Hot reload](/extensions/hot-reload): test before you tag.
