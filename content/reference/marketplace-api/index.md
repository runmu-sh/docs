---
title: Marketplace API
description: Every endpoint of the extension marketplace at market.runmu.sh, with its method, auth, parameters and response.
---

# Marketplace API

The marketplace at [runmu.sh/marketplace](https://runmu.sh/marketplace/) runs on this API. The base URL is `https://market.runmu.sh`.

## Conventions

- **JSON** field names are camelCase.
- **Auth** is `Authorization: Bearer <token>`. The token is either an account token from the sign-in server (a session) or a marketplace API token made with `POST /v1/me/tokens`. On a public route a bad token counts as signed out.
- **Errors** all have the same body:

```json
{ "error": { "code": "not_found", "message": "no extension \"my-ext\"" } }
```

| Status | `code` |
|---|---|
| 400 | `bad_request` |
| 401 | `unauthorized` |
| 403 | `forbidden` |
| 404 | `not_found` |
| 409 | `conflict` |
| 410 | `gone` (a listing its owner deleted) |
| 413 | `too_large` |
| 429 | `rate_limited` |
| 503 | `unavailable` |
| 500 | `internal` |

`message` is a sentence for a person.

The **Auth** column uses these values:

| Auth | Meaning |
|---|---|
| none | No token needed |
| optional | A signed-in caller gets more |
| bearer | A session or an API token |
| session | An account token. API tokens get 403 |
| admin | A session, and the account may moderate |

An admin using a session can also use the owner routes on any listing. Each table lists the error statuses that say something specific about the route.

## Meta

| Endpoint | Auth | Returns |
|---|---|---|
| `GET /` | none | `Root`: `{ service, api, index, docs }`. `api` is the API prefix and `index` the registry index URL |
| `GET /healthz` | none | `ok` as `text/plain` |

## Registry

These routes serve packages to μClient. Each is immutable once published.

| Endpoint | Auth | Parameters | Returns |
|---|---|---|---|
| `GET /index.json` | none | | The registry index, format 1: every live listing with its versions that are not yanked |
| `GET /dl/{name}/{file}` | none | `file`: `<name>-<version>.tgz` | The version's tarball (`application/gzip`). Each request counts one download. 404 when unknown |
| `GET /files/{sha}/{path}` | none | `sha`: the package sha256; `path`: a file inside it | The file, sandboxed by CSP. 404 when unknown |
| `GET /img/{file}` | none | | An uploaded icon or screenshot. 404 when unknown |

The index has this shape:

```json
{
  "format": 1,
  "name": "…",
  "updated": "…",
  "extensions": {
    "<name>": {
      "displayName": "…", "description": "…", "tags": [], "capabilities": [],
      "latest": "1.2.0", "homepage": "…",
      "author": { "name": "…", "url": "…" }, "license": "…", "publisherKey": "…", "deprecated": "…",
      "versions": {
        "1.2.0": { "source": "…", "api": "^1.3", "sha256": "…", "released": "…", "changelog": "…" }
      }
    }
  }
}
```

`author`, `license`, `publisherKey`, `deprecated` and a version's `changelog` are optional. `author` names the first owner and links to their publisher page.

## Browse

| Endpoint | Auth | Parameters | Returns |
|---|---|---|---|
| `GET /v1/extensions` | none | query: `q`, `tag`, `category`, `owner` (a publisher handle), `gmcp`, `mcp`, `sort`, `page` (from 1), `per` (1–100, default 24) | `SearchPage` |
| `GET /v1/extensions/{name}` | optional | `name`: the package name | `ExtDetail`. 404 unknown, 410 deleted |
| `GET /v1/extensions/{name}/versions` | optional | | `Versions`. 404, 410 |
| `GET /v1/extensions/{name}/versions/{version}` | optional | | `VersionDetail`. 404, 410 |
| `GET /v1/extensions/{name}/stats` | none | | `Stats`. 404, 410 |
| `GET /v1/publishers/{handle}` | none | | `PublisherPage`. 404 |
| `GET /v1/tags` | none | | `Facet[]`: tags in use, most common first, at most 200 |
| `GET /v1/categories` | none | | `Facet[]`: categories in use, most common first |

`q` matches the name, display name, description, tags, categories and owners. `gmcp` (a package the game sends, such as `Client.Tickets`) matches listings whose latest version declares it, or a parent of it, in `contributes.gmcp` with at least one inbound message or no message table. `mcp` (a package the server offered, such as `dns-com-vmoo-userlist`) matches listings whose latest version declares it in `contributes.mcp`. μClient asks these for **This game sends** in **Extensions → Discover**. `sort` is one of `relevance` (with `q`), `downloads`, `rating`, `updated`, `new`, `name` or `subscribers`.

## Publish

| Endpoint | Auth | Body | Returns |
|---|---|---|---|
| `POST /v1/publish` | bearer | The npm-pack tarball, as `application/gzip` | 201 `Published` |

| Status | When |
|---|---|
| 400 | Not a valid package, or the signature is wrong |
| 403 | Someone else's listing, or a suspended publisher |
| 409 | The version exists, or the name belonged to a deleted listing |
| 413, 429 | Too large, or too many requests |

```sh
npm pack
curl -X POST https://market.runmu.sh/v1/publish \
  -H "Authorization: Bearer $MARKET_TOKEN" \
  -H "Content-Type: application/gzip" \
  --data-binary @my-ext-1.0.0.tgz
```

## Manage

Owners manage their listings with these routes.

| Endpoint | Auth | Parameters and body | Returns |
|---|---|---|---|
| `PATCH /v1/extensions/{name}` | bearer | `Edit` | `ExtSummary`. 400, 403, 404, 410. Changing `publisherKey` needs a session |
| `DELETE /v1/extensions/{name}` | session | | 204. The versions stop being served and the listing leaves the index. The name stays reserved |
| `POST /v1/extensions/{name}/images` | bearer | multipart: `file` (PNG, JPEG, WebP or GIF), `kind` (`screenshot` default, or `icon`), `caption` (up to 200 characters) | 201 `ImageAdded`. 400 not an image or more than 10 screenshots, 413, 429 |
| `PATCH /v1/extensions/{name}/images/{id}` | bearer | `ImageEdit` | 204 |
| `DELETE /v1/extensions/{name}/images/{id}` | bearer | | 204. Removing the icon clears it from the listing |
| `PUT /v1/extensions/{name}/owners/{handle}` | session | | `Owner[]`, the owners afterwards. 404 no such listing or publisher |
| `DELETE /v1/extensions/{name}/owners/{handle}` | session | | `Owner[]`. 400 when it is the last owner |
| `POST /v1/extensions/{name}/versions/{version}/yank` | bearer | optional `{ reason }` (up to 300 characters) | `Yanked`. The version leaves the index and search. Existing pins keep downloading it |
| `DELETE /v1/extensions/{name}/versions/{version}/yank` | bearer | | `Yanked`. Undoes the yank |
| `DELETE /v1/extensions/{name}/versions/{version}` | session | | 204. Allowed within 72 hours of publishing, or once yanked (409 otherwise). The version number is never reused |

`Edit` changes only the fields you send. A nullable field sent as `null` is cleared.

| Field | Type | Meaning |
|---|---|---|
| `displayName` | string or null | 1–80 characters |
| `description` | string or null | Up to 500 characters |
| `tags` | string[] | Up to 12, each up to 32 characters without spaces |
| `categories` | string[] | Up to 3 from the fixed category list |
| `homepage`, `repository`, `issues` | string or null | Links |
| `deprecated` | string or null | A reason shown on the listing. `null` un-deprecates |
| `publisherKey` | string or null | Set, replace or remove the listing's minisign key. Later versions must be signed with it |

## GitHub

A listing can import its versions from a GitHub repository.

| Endpoint | Auth | Parameters and body | Returns |
|---|---|---|---|
| `POST /v1/github/link` | bearer | `LinkBody` | 201 `Linked` |
| `GET /v1/extensions/{name}/github` | bearer | | `GithubStatus`. 404 when not linked |
| `PATCH /v1/extensions/{name}/github` | bearer | `{ mode?, tagPrefix?, dir? }` | `GithubLink` |
| `DELETE /v1/extensions/{name}/github` | bearer | | 204. Imports stop. Imported versions stay |
| `POST /v1/extensions/{name}/github/secret` | bearer | | `GithubLink` with a new webhook secret. The old one stops working |
| `POST /v1/extensions/{name}/github/sync` | bearer | optional `{ retry }` | `Synced`. 409 when a sync is already running, 429 |
| `POST /v1/github/webhook/{name}` | signature | headers `X-Hub-Signature-256`, `X-GitHub-Event`; the GitHub event payload | 200 `WebhookAck` (nothing to do) or 202 (a sync is scheduled). 401 when the signature does not match |

`LinkBody`:

| Field | Meaning |
|---|---|
| `repo` | Required. `owner/repo` or a github.com URL |
| `mode` | `tags` (every version tag) or `releases` (published GitHub releases only) |
| `tagPrefix` | The prefix of version tags |
| `dir` | The package folder in a monorepo |

`POST /v1/github/link` creates the listing when the package name is new, then imports what is there. It answers 403 when the repository is not yours or the listing is someone else's. It answers 409 when it is already linked, the name was deleted, or the repository publishes another listing. It answers 502 when GitHub did not answer.

Changing `dir` with `PATCH` checks the folder as a new link does. A `PATCH` forgets skipped tags, and so does `{ "retry": true }` on sync, so the next sync looks at them again.

GitHub calls the webhook on push and release. The body is signed with the listing's secret as an HMAC-SHA256 in `X-Hub-Signature-256`.

## Social

| Endpoint | Auth | Parameters and body | Returns |
|---|---|---|---|
| `GET /v1/extensions/{name}/reviews` | none | query: `page`, `per` (1–100, default 24), `sort` (`newest` default, `highest`, `lowest`) | `Reviews` |
| `PUT /v1/extensions/{name}/review` | session | `{ rating, body? }`: rating 1–5, body up to 4000 characters | `ReviewSaved`. 400 without a publisher profile. 403 for owners, suspended accounts and API tokens |
| `DELETE /v1/extensions/{name}/review` | session | | 204, also when there was none |
| `POST /v1/extensions/{name}/reviews/{handle}/reply` | session | `{ body }`: up to 2000 characters. An empty body removes the reply | 204. Owners only |
| `POST /v1/extensions/{name}/report` | bearer | `ReportBody` | 201 `{ id, received }`. 429 |
| `PUT /v1/extensions/{name}/subscription` | session | optional `{ version }` to pin one | `Subscribed`. 400 when nothing is installable or the pinned version is not |
| `DELETE /v1/extensions/{name}/subscription` | session | | 204 |

`ReportBody` has `reason` (`malware`, `impersonation`, `spam`, `broken`, `copyright`, `abuse` or `other`), `body` (up to 4000 characters), and `review`, a reviewer's handle to report that review in place of the listing.

A subscription adds the extension to your library. The next time μClient starts signed in to that account, it offers the install with its usual trust prompt. Nothing installs on its own.

## Me

| Endpoint | Auth | Body | Returns |
|---|---|---|---|
| `GET /v1/me` | bearer | | `Me` |
| `GET /v1/me/extensions` | bearer | | `MyExtension[]`: listings you own, hidden ones and ones with nothing installable included |
| `GET /v1/me/library` | bearer | | `LibraryEntry[]` |
| `POST /v1/me/library/{name}/delivered` | bearer | | 204. μClient installed the entry or the player dismissed it, so it stops being offered. 404 when not in your library |
| `PUT /v1/me/publisher` | session | `{ handle, displayName, url? }` | `PublisherView`. 409 when the handle is taken |
| `GET /v1/me/tokens` | session | | `Token[]` |
| `POST /v1/me/tokens` | session | `{ name }`: 1–60 characters | 201 `TokenCreated`. At most 20 tokens |
| `DELETE /v1/me/tokens/{id}` | session | | 204 |

A publisher `handle` is 2–32 characters of `a-z 0-9 -`, starts with a letter, and cannot change once set. `displayName` is 1–60 characters. `url` is an https URL up to 300 characters.

::: tip
`TokenCreated.token` is shown once. Store it when you create it, for example as a CI secret.
:::

## Admin

| Endpoint | Auth | Body | Returns |
|---|---|---|---|
| `GET /v1/admin/reports` | admin | | `Report[]`: open reports, oldest first, at most 200 |
| `POST /v1/admin/reports/{id}/resolve` | admin | `{ resolution }`: `dismissed`, `hidden-listing`, `hidden-review` or `other` | 204. `hidden-listing` and `hidden-review` also hide the listing or review. 404 when no open report has that id |
| `POST /v1/admin/extensions/{name}/hide` | admin | | 204. Takes the listing down |
| `DELETE /v1/admin/extensions/{name}/hide` | admin | | 204. Puts it back |
| `POST /v1/admin/publishers/{handle}/verify` | admin | | 204. Marks the publisher verified |

## Schemas

### ExtSummary

The shape used in lists and search results.

| Field | Type | Meaning |
|---|---|---|
| `name` | string | The package name, the id everywhere |
| `displayName`, `description` | string | |
| `latest` | string or null | The version a bare name installs. `null` when nothing is installable |
| `tags`, `categories` | string[] | |
| `icon` | string or null | An absolute image URL |
| `deprecated` | string or null | The deprecation notice |
| `downloads` | integer | |
| `subscribers` | integer | |
| `rating` | number or null | The average rating to one decimal. `null` with no reviews |
| `ratingCount` | integer | |
| `owners` | `OwnerRef[]` | |
| `updated`, `created` | date-time | |
| `page` | string | The listing page on the site |
| `install` | `Install` | |

`Install` has `spec` (`name` or `name@version`), `deepLink` (`muclient://install/<spec>`, for the desktop app) and `web` (the web client with `?install=<spec>`). Both links end in μClient's trust prompt.

`OwnerRef` is `{ handle, displayName, verified }`. `Owner` is `{ handle, displayName }`.

### ExtDetail

`ExtSummary` plus:

| Field | Type | Meaning |
|---|---|---|
| `homepage`, `repository`, `issues`, `license` | string or null | |
| `capabilities` | string[] | |
| `publisherKey` | string or null | The minisign key later versions must be signed with |
| `hidden` | boolean | Taken down by a moderator. Only owners and admins see such a listing |
| `github` | `GithubLink` or null | `null` for a listing published by upload |
| `screenshots` | `Screenshot[]` | `{ id, url, caption }` |
| `versions` | `VersionSummary[]` | Newest first |
| `current` | `VersionDetail` or null | The version a bare name installs, with its README |
| `weeklyDownloads` | integer | |
| `ratingHistogram` | integer[5] | Reviews per star. Index 0 is one star |
| `viewer` | `Viewer` or null | For a signed-in caller: `{ owner, admin, subscribed, review }`, where `review` is your `{ rating, body }` or `null` |

### MyExtension, LibraryEntry, Published

- `MyExtension`: `ExtSummary` plus `hidden`.
- `LibraryEntry`: `ExtSummary` plus `pinned` (a version, or `null` for latest), `added` (date-time) and `pending` (μClient has not taken the entry yet). `install` points at the pinned version.
- `Published`: `ExtSummary` plus `published`, a `PublishedVersion`: `{ version, sha256, entrySha256, signed, files, tarball, created, note }`. `created` is true when this publish created the listing. `note` is a remark about the import or `null`.

### VersionSummary and VersionDetail

| Field | Type | Meaning |
|---|---|---|
| `version` | string | |
| `published` | date-time | |
| `api` | string | The client API range the package declares |
| `size` | integer | Tarball bytes |
| `files` | integer | Files in the package |
| `sha256` | string | The tarball's sha256, also its address under `/files/` |
| `entrySha256` | string | |
| `signed` | boolean | |
| `yanked` | boolean | |
| `yankReason` | string or null | |
| `downloads` | integer | |
| `source` | `VersionSource` | Where it came from |
| `tarball` | string | |
| `install` | `Install` | |

`VersionDetail` adds `readme` and `changelog` (sanitised HTML), `changelogMarkdown`, `manifest` and `filesBase` (`/files/<sha>/`).

`manifest` is the package's `muclient` manifest as stored: `{ id, name, displayName, version, description, capabilities, entry, api, contributes, publisherKey }`.

`VersionSource` has `kind` (`upload` or `github`). A GitHub import adds `repo`, `tag`, `commit`, `dir`, `url`, `release` and `asset`.

`Versions` is `{ name, latest, versions }`, newest first. `Yanked` is `{ name, version, yanked, latest }`, where `latest` is what a bare name installs afterwards.

### Stats

`{ downloads, subscribers, daily, versions }`. `daily` is `[{ day, count }]` for the last 90 days with downloads, oldest first. `versions` is `[{ version, downloads }]`, newest first.

### SearchPage and Facet

`SearchPage` is `{ total, page, per, items }` with `items` of `ExtSummary`. `Facet` is `{ name, count }`, the number of live listings with that tag or category.

### Reviews

`Reviews` is `{ total, rating, items }`. Each `Review` is:

| Field | Type | Meaning |
|---|---|---|
| `author` | `OwnerRef` | |
| `rating` | integer | 1–5 |
| `body` | string | |
| `version` | string or null | The listing's latest version when the review was written |
| `reply` | object or null | The owner's reply, `{ body, at }` |
| `created`, `updated` | date-time | |

`ReviewSaved` is `{ rating, body, version }`.

### GithubLink and GithubStatus

| Field | Type | Meaning |
|---|---|---|
| `repo` | string | `owner/repo` |
| `url` | string | The repository on github.com |
| `dir` | string | The package folder. Empty at the root |
| `mode` | string | `tags` or `releases` |
| `tagPrefix` | string | |
| `lastSync`, `lastOk` | date-time or null | The last sync, and the last one without error |
| `linked`, `nextSync`, `lastWebhook` | date-time or null | Owners only |
| `lastError` | string or null | Owners only |
| `webhook` | object or null | `{ url, secret, contentType, events }`, only on `GET …/github` and the link, edit and secret answers |

The first seven fields are public. `GithubStatus` adds `events` (the sync log, newest first, at most 30: `{ kind, tag, message, at }`) and `skipped` (at most 50: `{ tag, commit, reason, at }`).

`Linked` is `{ name, created, latest, github, sync }`. `Synced` is `{ latest, sync }`. A `sync` is `{ imported, skipped, error, more }`: the versions imported, the tags passed over with a `reason`, a GitHub or storage error or `null`, and whether more candidates wait for the next run.

`WebhookAck` is `{ ok, sync, event }`.

### Me and publishers

`Me`:

| Field | Type | Meaning |
|---|---|---|
| `id` | uuid | The account id, shared with the sign-in server |
| `admin` | boolean | May moderate |
| `webmin` | boolean | The account is a webmin on the sign-in server |
| `viaToken` | boolean | The call came with an API token |
| `publisher` | `PublisherView` or null | |

`PublisherView` is `{ handle, displayName, url, verified, page, since }`. `PublisherPage` adds `extensions`, their live listings, most downloaded first.

### Tokens

`Token` is `{ id, name, prefix, created, lastUsed }`, with `prefix` the token's first ten characters. `TokenCreated` is `{ id, name, prefix, token }`.

### Images and reports

- `ImageAdded`: `{ id, kind, url, caption }`, `kind` being `screenshot` or `icon`.
- `ImageEdit`: `{ caption?, position? }`, the sort order among the listing's images.
- `Report`: `{ id, extension, review, reason, body, created, hidden }`. `review` is the reviewer's handle when a review was reported. `hidden` says whether the listing is already hidden.
- `Subscribed`: `{ name, subscribed, version }`, `version` being the pin or `null`.

## Next

- [Publish to the marketplace](/extensions/publish).
- [Games API](/reference/games-api/).
- [Deprecations](/reference/deprecations).
