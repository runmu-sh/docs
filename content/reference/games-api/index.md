---
title: Games API
description: Every endpoint of the games directory at games.runmu.sh, with its method, auth, parameters and response.
---

# Games API

The games directory on runmu.sh runs on this API. The base URL is `https://games.runmu.sh`.

## Conventions

- **JSON** field names are snake_case.
- **Auth** is `Authorization: Bearer <token>` with the account JWT from the sign-in server. On a public route a bad token counts as signed out.
- **Errors** have the body `{ "error": "<a sentence for a person>" }`. A 409 can add keys, listed under [ErrorBody](#errorbody).

| Status | Means |
|---|---|
| 400 | Bad input |
| 401 | No token, or a bad one, on a signed-in route |
| 403 | Not allowed |
| 404 | Unknown. A hidden game is 404 to the public |
| 409 | Conflict |
| 410 | Gone |
| 413 | Body too large |
| 429 | Rate limited |

The **Auth** column uses these values:

| Auth | Meaning |
|---|---|
| none | No token needed |
| bearer | Any signed-in account |
| team | Signed in, and on the game's team as `owner` or `editor` |
| owner | Signed in, and an owner of the game |
| webmin | Signed in, and a webmin |

A webmin passes every team and owner check.

## Meta

| Endpoint | Auth | Returns |
|---|---|---|
| `GET /` | none | `{ service, api, docs }` |
| `GET /healthz` | none | `ok` as `text/plain` |
| `GET /img/{file}` | none | A stored icon, banner or screenshot by file name. Immutable. 404 when unknown |

## Games

| Endpoint | Auth | Parameters | Returns |
|---|---|---|---|
| `GET /v1/games` | none | query: listed after this table | `ListPage`. 400 for a bad sort, dir, status, adult or cursor |
| `GET /v1/facets` | none | query: `status` (`up` default, `down`, `all`), `adult` (`0` default, `1`) | `Facets`. 400 for a bad status or adult |
| `GET /v1/games/{slug}` | none | `slug`: the current slug or a former one | `GameView`. 404 unknown or hidden, 410 removed |
| `GET /v1/games/{slug}/stats` | none | query: `range` (`30d` default, hourly points; `365d`, daily points) | `Stats`. 400, 404, 410 |
| `GET /v1/games/{slug}/badge.svg` | none | | An SVG badge with this month's rank and votes, cached 5 minutes. Viewing it never votes |
| `GET /v1/games/{slug}/og` | none | | A small HTML page with Open Graph and Twitter tags for link previews, and a link to the game page |
| `POST /v1/games/{slug}/report` | bearer | `{ reason, detail? }` | 201 `{ id }`. 429 |

The query parameters of `GET /v1/games`:

| Parameter | Meaning |
|---|---|
| `sort` | `votes` (default), `players`, `avg`, `name`, `genre`, `codebase` or `status` |
| `dir` | `asc` or `desc`. The default is ascending for `name` and descending for the rest |
| `q` | Free text over the name, tagline, description, tags and host. Misspellings are tolerated |
| `genre` | A genre or subgenre |
| `codebase` | A codebase family id from the facets, or a codebase name |
| `status` | `up` (default: up and unknown), `down` or `all` |
| `tag` | One tag |
| `adult` | `0` (default: adult listings hidden) or `1` |
| `cursor` | `next_cursor` of the previous page |
| `limit` | 1–100, default 50 |

The facets count genres, codebases and tags over the listings the default list shows. Codebases count by family, so "PennMUSH 1.8.8p0" counts as PennMUSH.

An old slug answers `GET /v1/games/{slug}` with 200 and sets `redirect` to the current slug. A hidden game is visible to its team and to webmins.

For a report, `reason` is `wrong-info`, `dead`, `impersonation`, `spam`, `adult`, `abuse` or `other`, and `detail` is up to 2000 characters.

## Votes

| Endpoint | Auth | Body | Returns |
|---|---|---|---|
| `GET /v1/games/{slug}/vote` | none | | `VoteStatus`, the vote page's data. It never casts a vote |
| `POST /v1/games/{slug}/vote` | bearer | optional `{ return }` | `Voted` |

One account can vote for a game once every 24 hours, and the account must be at least a day old. `return` is the `?return=` of the vote link. It must be on the game's website to come back in `Voted.return`.

| Status | When |
|---|---|
| 403 | The backend does not know the account |
| 409 | `{ reason: "voted", next_vote_at, votes }` or `{ reason: "new-account", next_vote_at }` |
| 429 | Rate limited |

## Me

| Endpoint | Auth | Returns |
|---|---|---|
| `GET /v1/me` | bearer | `{ user_id, webmin, account_created_at }`. `account_created_at` is `null` when the backend has no row for the account yet |
| `GET /v1/me/games` | bearer | `MyGames`: the games you own or edit, in any state but deleted |

## Manage

| Endpoint | Auth | Body | Returns |
|---|---|---|---|
| `POST /v1/games` | bearer | `Fields` with `name`, `host` and `port` | 201 `GameView`. 409 `{ error, slug, claimable }` when the address is already listed. 429 |
| `PATCH /v1/games/{slug}` | team | `Fields`, only what changes | `GameView`. A rename changes the slug. The old one keeps working. 409, 410, 429 |
| `DELETE /v1/games/{slug}` | owner | | `{ deleted, slug, restorable_until }`. The slug stays reserved, and a webmin can restore the game within 30 days. 410 when already deleted |
| `POST /v1/games/{slug}/images` | team | multipart: `file`, `kind`, `caption` | 201 `ImageAdded`. 413, 429 |
| `PATCH /v1/games/{slug}/images/{id}` | team | `{ caption?, position? }` | `{ ok: true }` |
| `DELETE /v1/games/{slug}/images/{id}` | team | | `{ ok: true }`. Removing an icon or banner clears it from the game |
| `GET /v1/games/{slug}/revisions` | team | | `{ revisions }`, newest first, at most 200 |
| `POST /v1/games/{slug}/revisions/{id}/revert` | team | | `GameView`. The listing becomes what it was after that revision, as a new revision |
| `POST /v1/preview` | bearer | `{ markdown, kind? }`: `kind` is `description` or `info` (default) | `{ html, toc }`: sanitised HTML and its headings. `toc` is empty for a description |

A new game goes live at once. The directory probes the address once, and MSSP fills the fields the form left empty.

For an image, `file` is PNG, JPEG, WebP or GIF, at most 4 MB. `kind` is `icon` (square, at least 64 px), `banner` (at most 1600×400) or `screenshot` (the default). An icon or banner replaces the current one. A game has at most 8 screenshots. `caption` is up to 200 characters.

### Fields

The body of submit and edit. An edit sends only what changes, and `null` clears an optional field. Unknown keys are refused.

| Field | Type | Meaning |
|---|---|---|
| `name` | string | 2–80 characters |
| `host` | string | A public host name or IP |
| `port` | integer | 1–65535 |
| `tls_port` | integer or null | The TLS port |
| `tagline` | string | Up to 140 characters |
| `genre`, `subgenre` | string | Up to 40 characters each |
| `codebase` | string | Up to 60 characters |
| `tags` | string[] | Lowercase `a-z0-9-`, up to 32 characters each |
| `adult` | boolean | |
| `description_md` | string | Markdown, up to 64 KB |
| `info_md` | string | Markdown for the information page, up to 256 KB |
| `links` | object | `{ website?, discord?, wiki? }`. Other keys are refused |
| `website` | string or null | Shorthand for `links.website` |
| `note` | string | A note for the revision, such as "fixed the port". Edits only |

## Team

| Endpoint | Auth | Body | Returns |
|---|---|---|---|
| `POST /v1/games/{slug}/claim` | bearer | | `Claim`. 409 when the game is claimed already or you manage it. 429 |
| `POST /v1/games/{slug}/claim/check` | bearer | | `ClaimCheck`. On success you become the owner. 400 when no claim was started or the game has no address, 409 when claimed already |
| `GET /v1/games/{slug}/editors` | team | | `{ editors }`, owners first |
| `PATCH /v1/games/{slug}/editors/{user}` | team | `{ role?, label? }` | `{ ok: true }`. 409 when it would leave no owner |
| `DELETE /v1/games/{slug}/editors/{user}` | team | | `{ ok: true }`. 409 for the last owner |
| `GET /v1/games/{slug}/invites` | owner | | `{ invites }`, newest first, at most 100 |
| `POST /v1/games/{slug}/invites` | owner | `{ label?, role? }` | 201 `InviteCreated` |
| `DELETE /v1/games/{slug}/invites/{id}` | owner | | `{ ok: true }`. 404 when no pending invite has that id |
| `GET /v1/invites/{token}` | none | | `InvitePreview`. 404 not a valid link, 410 revoked, used or expired |
| `POST /v1/invites/{token}/accept` | bearer | | `{ slug, role }`. 410 revoked, used, expired, or the game was deleted |

A claim gives you a code to place in one of four spots. `Claim.methods` holds the exact text for each:

| Method | Text |
|---|---|
| `mssp` | An MSSP variable line, `RUNMU-CLAIM <code>` |
| `banner` | The connect screen, `RUNMU-CLAIM <code>` |
| `dns_txt` | A TXT record on the host, `runmu-claim=<code>` |
| `meta` | A meta tag on the website, `<meta name="runmu-claim" content="<code>">` |

`Claim` is `{ code, methods, expires_in_days }`. A code is valid for 14 days. `ClaimCheck` is `{ claimed: false, error }` or `{ claimed: true, method, slug }`, with `method` one of `mssp`, `banner`, `dns` or `website`. A code that is not found is a 200 with `claimed: false`.

On a team, an owner removes anyone and anyone can leave. An owner changes roles. Anyone changes their own `label` (up to 80 characters, private to the team). An invite link is single use and valid for 7 days. `role` is `editor` (default) or `owner`. Accepting never demotes an existing owner.

## Admin

These routes need a webmin.

| Endpoint | Body | Returns |
|---|---|---|
| `GET /v1/admin/games` | query: `q` (name, host or slug), `state` (`published`, `hidden`, `deleted`; default all), `claimed` (`0`, `1`; default both), `offset`, `limit` (1–500, default 100) | `AdminGames`, newest change first |
| `POST /v1/admin/games/{slug}/hide` | optional `{ reason }` (up to 300 characters, shown to the team) | `{ slug, state }`. The game leaves the list and its page but staff can still edit it. 409 when not published |
| `DELETE /v1/admin/games/{slug}/hide` | | `{ slug, state }`. 409 when not hidden |
| `POST /v1/admin/games/{slug}/restore` | | `{ slug, state }`. Undoes a delete within 30 days. 409 when not deleted or the address is listed again, 410 after 30 days |
| `DELETE /v1/admin/games/{slug}` | `{ confirm }`: the current slug typed again | `{ purged }`. Removes the listing and everything attached. The audit log keeps its entries. 400 when `confirm` does not match |
| `PUT /v1/admin/games/{slug}/owners` | `{ owners, remove_old? }`: 1–20 user ids | `{ team: [{ user_id, role }] }`. The listing becomes claimed. Current owners stay as editors unless `remove_old` is true |
| `POST /v1/admin/merge` | `{ from, into }` | `GameView` of the game that stays |
| `GET /v1/admin/audit` | query: `game`, `actor`, `action` (a prefix such as `admin.` or `vote.cast`), `before`, `limit` (1–500, default 100) | `{ entries, next_before }`, newest first |
| `GET /v1/admin/reports` | query: `state` (`open` default, `resolved`, `all`) | `{ reports }`, newest first, at most 500 |
| `POST /v1/admin/reports/{id}/resolve` | `{ resolution, note? }` | `{ ok, state }`. 404 when no open report has that id |
| `GET /v1/admin/sources` | | `{ sources, crawler }` |
| `PATCH /v1/admin/sources/{id}` | `{ paused?, permission?, clear_alert? }` | `{ ok: true }` |
| `POST /v1/admin/sources/{id}/run` | optional `{ force }` | `{ requested, started }` |
| `GET /v1/admin/sources/matches` | query: `state` (`open` default, `resolved`, `all`) | `{ matches }`, newest first, at most 500 |
| `POST /v1/admin/sources/matches/{id}` | `{ action }`: `merge` or `keep` | `{ status, created }`. 404 when no pending match has that id |
| `GET /v1/admin/votes/flags` | query: `state` (`open` default, `resolved`, `all`) | `{ flags }`, newest first, at most 500 |
| `POST /v1/admin/votes/flags/{id}/resolve` | | `{ ok: true }` |
| `POST /v1/admin/votes/void` | `Void` | `{ changed, votes_month, votes_total }` |

Details:

- **Merge** folds a duplicate into another listing. Votes, revisions, reports, source links and old slugs move to `into`. The team of `from` joins it as editors, or as owners where they owned `from` and `into` had no owner. The slug of `from` becomes an alias of `into`, and `from` is removed. Counters are recomputed. A voter who voted for both in the same 24 hours keeps both votes.
- **Audit** `game` takes a current or former slug or a game id. `actor` is a user id. Pass `next_before` as `before` for the next page.
- **Resolve a report**: `resolution` is `dismiss`, `edit` (fixed by hand), `hide` or `delete`. `hide` and `delete` act on the game. `note` is up to 500 characters.
- **Sources** are the listing sites the crawler imports from. A run is refused when it drops below half the previous count, unless you send `{ "force": true }`. `permission` notes who allowed the import (up to 300 characters).
- **Matches**: `merge` says the entry is that game. `keep` says it is a different one, and creates an unclaimed listing for it when it has an address.
- **Vote flags**: `network` flags many accounts from one network, and `rate` flags voting far above the game's norm.
- **Void** takes `game` (the slug), `reason` (required, up to 300 characters), and either `ids` or the filters `net_hash`, `user_id`, `since` and `until`. `restore: true` un-voids. The game's counters and closed months are recomputed.

## Schemas

### ErrorBody

| Field | Type | Meaning |
|---|---|---|
| `error` | string | A sentence for a person |
| `slug`, `claimable` | string, boolean | On a 409 when the address is already listed |
| `reason` | string | On a 409 from voting: `voted` or `new-account` |
| `next_vote_at` | date-time | On a 409 from voting |
| `votes` | integer | On a 409 from voting |

### ListPage and ListRow

`ListPage` is `{ games, next_cursor, sort, dir, month, votes_reset_at }`. `next_cursor` is `null` on the last page. `month` is the vote month counted, `YYYY-MM`. `votes_reset_at` is when this month's votes reset.

`ListRow`:

| Field | Type | Meaning |
|---|---|---|
| `id` | uuid | |
| `slug`, `name`, `tagline` | string | |
| `icon` | string or null | |
| `host` | string or null | |
| `port`, `tls_port` | integer or null | |
| `genre`, `subgenre`, `codebase` | string | |
| `tags` | string[] | |
| `adult` | boolean | |
| `status` | string | `up`, `down` or `unknown` (never reached) |
| `players_now` | integer or null | |
| `players_via` | string or null | `null` for the directory's own MSSP count, or the id of the source the number comes from |
| `players_avg30` | number | |
| `votes_month` | integer | |
| `unclaimed` | boolean | |
| `source` | object or null | `{ id, name }` of the site an unclaimed listing was imported from |
| `play`, `telnet` | string or null | |
| `page` | string | |
| `rank` | integer | The position in the list, continuing across pages |

`MyGames` rows leave out `rank` and add `role`, `state` and `state_reason`. `AdminGames` is `{ games, total, offset, limit }`. Its rows leave out `rank` and add `state`, `state_reason`, `deleted_at`, `updated_at` and `created_at`. `state` is `published`, `hidden` or `deleted`.

### Facets

`{ total, genres, codebases, tags }`. `genres` and `tags` are `[{ name, count }]`. `codebases` is `[{ id, name, count }]`, with `id` the family id to pass as `codebase`.

### GameView

The game page. Submit, edit, revert, restore and merge answer with it too.

| Field | Type | Meaning |
|---|---|---|
| `redirect` | string or null | The current slug, when you asked for an old one |
| `id`, `slug`, `name`, `tagline` | | |
| `icon`, `banner` | string or null | |
| `host`, `port`, `tls_port` | | |
| `links` | object | `{ website?, discord?, wiki? }` |
| `genre`, `subgenre`, `codebase`, `tags`, `adult` | | |
| `description_md`, `description_html` | string | |
| `info_md`, `info_html` | string | The information page |
| `info_toc` | array | Its headings, `[{ level, id, text }]`, level 1 to 6 |
| `screenshots` | array | `[{ id, url, caption, width, height }]` |
| `status` | string | `up`, `down` or `unknown` |
| `players_now`, `players_via`, `players_avg30`, `players_peak30` | | |
| `votes_month`, `votes_total` | integer | |
| `rank` | integer or null | This month's position by votes. `null` when not listed |
| `rank_all_time` | integer or null | |
| `last_seen`, `last_checked` | date-time or null | |
| `listed_since`, `updated_at` | date-time | |
| `state` | string | `published`, `hidden` or `deleted` |
| `state_reason` | string or null | For the team and webmins. `null` for everyone else |
| `unclaimed` | boolean | |
| `source` | object or null | `{ id, name }` |
| `mssp` | object or null | `{ at, fields }`, with `fields` the MSSP variables as sent, `{ KEY: [values] }` |
| `play`, `telnet` | string or null | |
| `page`, `vote_page`, `badge` | string | |
| `viewer` | object or null | For a signed-in caller: `{ role, webmin, next_vote_at }`. `next_vote_at` is `null` when you may vote now |

### Stats

`{ range, points, uptime, samples, last_seen, last_checked, players_now, players_avg30, players_peak30, mssp }`. `uptime` is the percent of probes that found the game up, to one decimal, or `null` without probes. Each point is `{ at, samples, up, avg, max }`: the hour (30d) or day (365d), the probes in it, the probes that found the game up, and the average and peak players.

### Votes

`VoteStatus`: `{ redirect, slug, name, icon, rank, votes_month, page, viewer }`. `viewer` is `null` when signed out, or:

| Field | Meaning |
|---|---|
| `can_vote` | Whether you may vote now |
| `reason` | `new-account`, `voted`, or `null` when you can |
| `next_vote_at` | When the 24-hour window ends. `null` when you have not voted lately |
| `can_vote_from` | When a new account becomes old enough. `null` once it is |

`Voted`: `{ votes, votes_total, next_vote_at, return }`. `votes` is this month's count after the vote. `return` is the return URL when it is on the game's website, otherwise `null`.

### Team

- `Editor`: `{ user_id, role, label, added_by, at, you }`. `you` marks the caller.
- `Invite`: `{ id, role, label, created_by, created_at, expires_at, used_by, used_at, state }`, `state` being `pending`, `used`, `revoked` or `expired`.
- `InviteCreated`: `{ id, token, url, role, label, expires_at }`. The token appears only here. `url` is the link to send.
- `InvitePreview`: `{ game: { slug, name, icon }, role, expires_at }`. The label is private.

### Images and revisions

- `ImageAdded`: `{ id, kind, url, caption, width, height }`.
- `Revision`: `{ id, actor, actor_label, you, at, diff, note }`. `diff` is `{ field: [before, after] }`. `actor` is `null` for the service's own writes.

### Admin

- `AuditEntry`: `{ id, at, actor, action, game_id, slug, before, after, ip_hash }`. `before` and `after` depend on the action.
- `Report`: `{ id, game, reporter, reason, detail, created_at, resolved_at, resolved_by, resolution, note }`, with `game` as `{ id, slug, name }`.
- `Source`: `{ id, name, home, permission, paused, run_requested, last_run_at, last_status, last_count, alert, entries, linked, pending_matches, next_run_at, compiled_in }`. `alert` is a warning when a run dropped below half the previous count.
- `Match`: `{ id, entry, game, score, reason, status, created_at }`. `entry` is `{ source, external_id, name, host, port, url }`, `game` is `{ id, slug, name, host_key }`, `score` is 0 to 1, and `status` is `pending`, `merged` or `kept`.
- `VoteFlag`: `{ id, game, kind, net_hash, day, detail, at, resolved_at }`. `detail` is `{ accounts, window_hours }` for `network` and `{ last_24h, daily_norm }` for `rate`. `net_hash` is empty for `rate`.

## Next

- [Marketplace API](/reference/marketplace-api/).
- [Wire protocol](/reference/protocol/).
- [Reference overview](/reference/).
