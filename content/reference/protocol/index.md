---
title: Wire protocol
description: How the μClient web and desktop clients talk to the backend, covering the WebSocket transport, auth, envelopes, events, RPC methods and the REST routes.
---

# Wire protocol

The μClient clients talk to the backend over one WebSocket for everything real-time, plus a few REST routes for sign-in, uploads and extension files. Game text, input, GMCP and `ext.emit` data travel encrypted with the **world** key. The backend holds that key only while a **session** runs.

## Transport

| | |
|---|---|
| Endpoint | `wss://api.runmu.sh/ws` |
| Auth | `?token=<account JWT>` on the URL. Without a valid token the upgrade fails with 401 |
| Frames | Text frames, one JSON object each |
| Keepalive | The server pings every 30 seconds |

```ts
const ws = new WebSocket(`wss://api.runmu.sh/ws?token=${encodeURIComponent(token)}`);
```

## Auth

The account token is a JWT signed with EdDSA (Ed25519). Its header carries a `kid`. HS256 tokens are refused.

| Claim | Value |
|---|---|
| `iss` | `runmu.sh` |
| `sub` | The account id |
| `aud` | `["api", "market", "games"]` |
| `iat`, `exp` | Issued at, and three days later |

Services verify it against `GET /.well-known/jwks.json`: a JWKS of `OKP` keys (`crv` `Ed25519`, `alg` `EdDSA`), the current key first. It is served with `Cache-Control: public, max-age=300` and CORS `*`, and answers 503 until the security service responds.

The REST routes that need a caller take `Authorization: Bearer <token>`. They answer 401 with "Missing bearer token" or "Invalid token".

## Envelopes

Every frame is an event or an RPC call.

::: code-group

```json [Event]
{ "t": "input", "d": { "sid": "…", "nonce": "…", "ciphertext": "…" } }
```

```json [RPC request]
{ "m": "worlds.list", "a": [{}], "i": "req_1" }
```

```json [RPC success]
{ "i": "req_1", "r": [] }
```

```json [RPC error]
{ "i": "req_1", "e": "World not found" }
```

:::

| Key | Meaning |
|---|---|
| `t` | Event type |
| `d` | Event data |
| `m` | RPC method |
| `a` | RPC arguments. Only `a[0]` is read, an object of named parameters |
| `i` | Request id, echoed in the reply |
| `r` | RPC result |
| `e` | RPC error, a string |

A frame with `m` and `i` is an RPC call. Otherwise a frame with `t` is an event. RPC parameters are camelCase.

The error string takes these forms:

| Cause | `e` |
|---|---|
| Not found, bad request | The message itself |
| Not allowed | `Unauthorized` |
| Server fault | `Internal error: …` |
| World key needed | `KEY_REQUIRED: …` |
| Unknown method | `Unknown method: <m>` |

## Encryption

A session's world key never travels in the clear.

1. The client calls `session.open` with an X25519 public key. The server answers with its own.
2. Both sides derive a shared key with ECDH and HKDF-SHA256 (info `muportal-session-key`).
3. The client sends the world key, encrypted with that shared key, in `session.keyExchange`.
4. From then on, `input`, `output`, `input.echo`, `gmcp`, `ext.emit` and history lines are sealed with XChaCha20-Poly1305 under the world key, each with a fresh 24-byte nonce.

Encrypted fields are base64. `nonce` and `ciphertext` are separate fields on events. A history line's `text` holds nonce and ciphertext together.

## Events from the client

| `t` | `d` | Meaning |
|---|---|---|
| `input` | `{ sid, nonce, ciphertext, localEcho? }` | A line of input. The plaintext is the text as typed. With `localEcho: true` the server broadcasts it back as `input.echo` |
| `session.history` | `{ sid }` | Ask for the recent history. The answer is `history.dump` |
| `latency.ping` | `{ satellite_id? }` | Without `satellite_id` the server answers `latency.pong` at once. With one it pings that satellite and answers `latency.satellite` |
| `client.telemetry` | `{ event, ts, client_type, … }` | Debug telemetry. The server logs it and sends no answer |

## Events from the server

### Session data

| `t` | `d` | Meaning |
|---|---|---|
| `output` | `{ sid, nonce, ciphertext, ts, line_index, triggers? }` | A line from the game, or from Lua. `ts` is in seconds. `triggers` is `[{ line, ids }]`, the ids of the triggers that fired, present only when any did |
| `input.echo` | `{ sid, nonce, ciphertext }` | Input another device sent with `localEcho` |
| `gmcp` | `{ sid, nonce, ciphertext, ts }` | A GMCP message. The plaintext is `{ package, data }`. MSDP variables arrive as package `MSDP.<VAR>`. `ts` is in milliseconds |
| `ext.emit` | `{ sid, nonce, ciphertext, ts }` | A Lua [`ext.emit`](/automation/ext-emit). The plaintext is `{ name, data }` |
| `history.dump` | `{ sid, lines, gmcp }` | The last 100 lines of the current connection, `[{ line_index, ts, text }]`, and the latest `gmcp` value per package, `[{ nonce, ciphertext, ts }]` |
| `mcp.edit` | `{ sid, name, upload, code }` | A MOO `#$# edit` block from the game: the editor title, the command that uploads it, and the code. Sent unencrypted, to one client only |

`output` and `input.echo` decrypt to UTF-8 text. So does each history line's `text`. The backend keeps at most 128 GMCP packages per session for `history.dump`. `ext.emit` messages are never stored or replayed.

### Connection state

| `t` | `d` | Meaning |
|---|---|---|
| `client.init` | `{ connection_id, worlds, sessions }` | Sent once when the socket opens |
| `client.update` | `{ sessions }` | The session list changed |
| `session.connected` | `{ sid, connection_info }` | The game connection is up |
| `session.connection_failed` | `{ sid, reason }` | A connect or reconnect failed |
| `session.disconnect` | `{ sid }` | The game connection closed |
| `session.read_state` | `{ sid, last_read_line_index }` | Another device marked the session read |
| `latency.pong` | `{}` | The answer to `latency.ping` |
| `latency.satellite` | `{ satellite_id, latency_ms }` | A satellite's round trip |

In `client.init`, `worlds` holds [world objects](#worlds). Each entry of `sessions`, there and in `client.update`, is:

| Field | Meaning |
|---|---|
| `sid` | The session id |
| `world_id` | Its world |
| `name` | Its name, `<world name>-N` for a new session |
| `connection_state` | `idle`, `connecting`, `connected` or `disconnecting` |
| `connected` | Whether the game connection is up |
| `connection_info` | `{ type, name, hostname? }`, `type` being `satellite`, `cloud` or `proxy` |
| `last_read_line_index`, `current_line_index` | For unread counts |
| `unread_mentions` | Mentions since the last read |

### Broadcasts

When one device changes something, every client of the account gets an event.

| `t` | `d` |
|---|---|
| `worlds.created`, `worlds.updated` | `{ world }` |
| `worlds.deleted` | `{ worldId }` |
| `aliases.created`, `aliases.updated` | `{ worldId, alias }` |
| `aliases.deleted` | `{ worldId, aliasId }` |
| `triggers.created`, `triggers.updated` | `{ worldId, trigger }` |
| `triggers.deleted` | `{ worldId, triggerId }` |
| `scripts.created`, `scripts.updated` | `{ worldId, script }` |
| `scripts.deleted` | `{ worldId, scriptId }` |
| `satellites.created` | `{ satellite }` |
| `satellites.renamed` | `{ satelliteId, name }` |
| `satellites.deleted` | `{ satelliteId }` |
| `settings.updated` | `{ settings }` |

## RPC methods

Parameters are the fields of `a[0]`. A `?` marks an optional one.

### Sessions

| Method | Parameters | Result |
|---|---|---|
| `session.open` | `worldId`, `clientPublicKey` | `{ sid, serverPublicKey, phase: "ecdh_started" }` |
| `session.keyExchange` | `sid`, `worldId`, `encryptedWorldKey`, `connectionPreferences?`, `nopKeepaliveEnabled?` | `{ sid, phase: "connected" }`, or `{ sid, phase: "key_restored", success: true }` for a session the backend already runs |
| `session.join` | `sid` | `{ joined, currentLineIndex, connectionState }` |
| `session.close` | `sid` | `null` |
| `session.reconnect` | `sid`, `clientPublicKey?`, `connectionPreferences?`, `nopKeepaliveEnabled?` | `{ initiated: true, connectionState: "connecting" }`, or `{ needsKeyExchange: true, serverPublicKey }` when the backend lost the key |
| `session.disconnect` | `sid` | `null` |
| `session.cancelConnect` | `sid` | `{ cancelled: true }`. Fails with "Cannot cancel: session is …, not connecting" otherwise |
| `session.markRead` | `sid`, `lineIndex` | `null` |
| `session.rename`, `sessions.rename` | `sid`, `name` | `{ sid, name }` |
| `session.stats` | `sid` | `{ bytesIn, bytesOut, telnet }` |
| `session.sendGmcp` | `sid`, `package`, `data?` | `{ sent: true }` |

`connectionPreferences` is a list tried in order. Each entry is `{ type: "satellite", satellite_id }`, `{ type: "any_satellite" }` or `{ type: "cloud" }`. The outcome of `session.reconnect` arrives later as `session.connected` or `session.connection_failed`.

`session.sendGmcp` takes a `package` of 1–128 characters of `A-Z a-z 0-9 . _ -` and `data` of at most 64 KB. It fails with `GMCP_NOT_NEGOTIATED` when the game has not agreed to GMCP, `GMCP_RATE_LIMITED` past 50 messages a second, or "Session not connected".

### Worlds

| Method | Parameters | Result |
|---|---|---|
| `worlds.list` | | World[] |
| `worlds.create` | `name`, `host`, `port`, `settingsEncrypted?` | World |
| `worlds.update` | `worldId`, `name?`, `host?`, `port?`, `settingsEncrypted?`, `iconColor?`, `iconUrl?` | World |
| `worlds.delete` | `worldId` | `null` |

A world object has `id`, `userId`, `name`, `host`, `port`, `settingsEncrypted`, `iconColor`, `iconUrl`, `createdAt` and `updatedAt`.

### Aliases

| Method | Parameters | Result |
|---|---|---|
| `aliases.list` | `worldId` | Alias[] |
| `aliases.create` | `worldId`, `parentId?`, `name`, `patternEncrypted?`, `scriptEncrypted?`, `enabled?`, `sortOrder?` | Alias |
| `aliases.update` | `aliasId` and any create field | Alias |
| `aliases.delete` | `aliasId` | `null` |
| `aliases.validate` | `script` | `{ valid, error }` |

An alias object has `id`, `worldId`, `parentId`, `name`, `patternEncrypted`, `scriptEncrypted`, `enabled`, `sortOrder`, `hasScriptError`, `createdAt` and `updatedAt`.

### Triggers

| Method | Parameters | Result |
|---|---|---|
| `triggers.list` | `worldId` | Trigger[] |
| `triggers.create` | `worldId`, `parentId?`, `name`, `patternsEncrypted?`, `scriptEncrypted?`, `optionsEncrypted?`, `enabled?`, `sortOrder?`, `fireLength?`, `isMultiMatch?` | Trigger |
| `triggers.update` | `triggerId` and any create field | Trigger |
| `triggers.delete` | `triggerId` | `null` |

A trigger object has the alias fields with `patternsEncrypted` in place of `patternEncrypted`, plus `optionsEncrypted`, `fireLength` and `isMultiMatch`.

`patternsEncrypted` decrypts to `[{ pattern, type }]`, where `type` is `regex`, `substring`, `exact`, `begin`, `end`, `color` or `prompt`. `optionsEncrypted` decrypts to `{ highlight, sound }`. On update, an absent field keeps its value and `null` clears it.

### Startup scripts

| Method | Parameters | Result |
|---|---|---|
| `scripts.list` | `worldId` | Script[], in run order |
| `scripts.create` | `worldId`, `name`, `scriptEncrypted?`, `enabled?`, `sortOrder?` | Script |
| `scripts.update` | `scriptId`, `name?`, `scriptEncrypted?`, `enabled?`, `sortOrder?` | Script |
| `scripts.delete` | `scriptId` | `null` |
| `scripts.validate` | `entityType` (`trigger`, `alias` or `script`), `entityId`, `script` (plain Lua) | `{ valid, error }`. The result is stored in the entity's `hasScriptError` |

A script object has `id`, `worldId`, `name`, `scriptEncrypted`, `enabled`, `sortOrder`, `hasScriptError`, `createdAt` and `updatedAt`. Every enabled script without a syntax error runs in `sortOrder` when a session starts, and again in each running session of the world after a script changes. A runtime error prints `[ERROR] startup script '<name>': …` and the other scripts still run.

### User

| Method | Parameters | Result |
|---|---|---|
| `user.getPreferences` | | `{ preferences }` |
| `user.updatePreferences` | Any preference keys | `{ preferences }`. A partial update. `theme_chosen` must name a known theme |
| `user.getSettings` | | `{ settings }` |
| `user.updateSettings` | Any setting keys | `{ settings }`. Merged. A key set to `null` is deleted |

### Satellites

| Method | Parameters | Result |
|---|---|---|
| `satellites.list` | | `[{ id, name, online, lastSeen, createdAt }]` |
| `satellites.create` | `name` | `{ satellite, token }` |
| `satellites.register` | `name`, `deviceId?` | `{ satelliteId, token }` |
| `satellites.rename` | `satelliteId`, `name` | `null` |
| `satellites.delete` | `satelliteId` | `null` |

### Logs

| Method | Parameters | Result |
|---|---|---|
| `logs.list` | `worldId` | `[{ connectionId, sessionId, startedAt, endedAt, disconnectReason, sizeBytes }]` |
| `logs.get_content` | `worldId`, `sessionId`, `connectionId`, `limit?` (default 100), `before?` | `[{ line_index, ts, text }]`, `text` encrypted like history lines |

### Extensions

The backend fetches extension packages for the client, which cannot fetch git archives, npm tarballs or hosts without CORS itself.

| Method | Parameters | Result |
|---|---|---|
| `extensions.resolve` | `source` | Package info. Fetches and validates, stores nothing |
| `extensions.install` | `source`, `sha256?` | Package info plus `base: "/ext/<sha256>/"`. With `sha256`, the fetched package hash or entry hash must match, or it fails with `sha256 mismatch: …` and stores nothing. Installing the same content again is idempotent |
| `extensions.update` | `source`, `sha256` | `{ current, latest, changed }`. `latest` is package info. Stores nothing |
| `extensions.remove` | `sha256` | `{ removed, deleted }`. `removed` is true when this account held a reference. `deleted` is true when no account uses the package any more and the stored copy was deleted |
| `extensions.list` | | Package info with `installedAt` and `base`, for each package this account references |
| `extensions.index` | `url` | A registry index document, as JSON |

`source` takes these forms:

| Form | Fetched from |
|---|---|
| `npm:@scope/name@range` | The npm registry: the highest version that satisfies the range (default `latest`, a dist-tag works), preferring versions that are not deprecated. The sha512 integrity is checked |
| `git+https://github.com/owner/repo#ref` | GitHub's tarball of the tag, branch or commit (default `HEAD`). The repository must contain the built entry |
| `git+https://gitlab.com/group/repo#ref` | GitLab's archive |
| `git+https://codeberg.org/owner/repo#ref` | The Gitea archive. Also `gitea.com`, `gitea.*`, `forgejo.*`, and tried for other hosts |
| `git+https://github.com/owner/repo#release:<tag>/<asset>.tgz` | A GitHub release asset |
| `https://…/name-1.0.0.tgz` | An npm-pack tarball |
| `https://…/folder/` | `package.json`, the entry, the icon and the WebAssembly files |

A package is at most 20 MB and 2000 files, and each call has 30 seconds. Private, loopback, link-local and CGNAT addresses are refused. `extensions.index` needs an `https` URL without credentials, and reads at most 2 MB within 15 seconds, following up to 5 redirects.

Package info:

```json
{
  "id": "automapper", "name": "@someone/ext-automapper", "displayName": "Automapper",
  "version": "1.4.0", "description": "Maps rooms from GMCP Room.Info",
  "capabilities": ["read-output"], "entry": "dist/index.js", "api": "^1.0",
  "contributes": {},
  "sha256": "…", "entrySha256": "…",
  "sourceKind": "npm", "source": "npm:@someone/ext-automapper@^1.4", "files": 12, "size": 48210,
  "publisherKey": null, "signature": null, "entryBlake2b": "…"
}
```

`sha256` is the package hash and its key under `/ext/`. `publisherKey` is the manifest's minisign key, and `signature` the text of `<entry>.minisig` when the package ships one. `entryBlake2b` is what that signature signs. μClient checks the signature. The backend only reports it.

## REST routes

The backend also serves these over HTTPS on the same host.

| Route | Auth | Body | Result |
|---|---|---|---|
| `POST /auth/srp/register` | none | `{ email, salt, verifier, wrapped_master_key }` | `{ user_id }` |
| `POST /auth/srp/challenge` | none | `{ email, client_public }` | `{ salt, server_public, challenge_id, wrapped_master_key }` |
| `POST /auth/srp/verify` | none | `{ challenge_id, client_proof }` | `{ server_proof, token }` |
| `POST /auth/recovery/verify-phrase` | none | `{ email, client_public, new_wrapped_master_key }` | `{ salt, server_public, challenge_id }` |
| `POST /auth/recovery/complete` | none | `{ challenge_id, client_proof }` | `{ server_proof, token }` |
| `PATCH /auth/keys/rewrap` | bearer | `{ wrapped_master_key }` | 200 |
| `POST /auth/refresh` | bearer | | `{ token }` |
| `GET /auth/user-info` | bearer | | `{ user_id }` |
| `GET /auth/session` | cookie | | `{ user_id, email, token, wrapped_master_key, webmin }`, or 401 |
| `POST /auth/session` | bearer | | 204, and sets the session cookie |
| `DELETE /auth/session` | none | | 204, and clears the cookie |
| `POST /auth/session/handoff` | bearer | `{ blob }`, at most 1024 characters | `{ id, expires_in: 120 }` |
| `POST /auth/session/handoff/claim` | bearer | `{ id }`, 32 hex characters | `{ blob }`. Single use. 410 "Hand-off expired or already used", 403 for another account's hand-off |
| `GET /.well-known/jwks.json` | none | | The signing keys ([Auth](#auth)) |
| `POST /worlds/:id/icon` | bearer | multipart `icon`, an image | `{ icon_url }` |
| `GET /ext/:sha/*path` | none | | A file from a stored extension package |

Sign-in uses SRP, so the password never reaches the server. The session cookie is `mu_session`: `HttpOnly`, `Secure`, `SameSite=Lax`, `Path=/auth`, and valid for 30 days from last use.

`GET /ext/<sha>/<path>` serves immutable files with their content type, `X-Content-Type-Options: nosniff` and a cross-origin resource policy. `sha` is 64 lowercase hex characters. Any other shape, or an unsafe path, is a 404 that is not cached.

## Next

- [Lua functions](/reference/lua/): what `ext.emit` and the output lines come from.
- [@muclient/sdk](/reference/sdk/): the extension API built on these events.
- [Reference overview](/reference/).
