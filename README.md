# runmu.sh/docs

The μClient documentation at <https://runmu.sh/docs/>: the **Guide** for players, **Automation** for
Lua aliases, triggers and macros, **Extensions** for developers, and the **Reference** (Lua functions,
`@muclient/sdk`, the games and marketplace APIs, the wire protocol).

It is a [VitePress](https://vitepress.dev) site wearing the runmu.sh shell from
[`@muclient/brand`](https://www.npmjs.com/package/@muclient/brand), served by nginx under the same
strict Content-Security-Policy as the rest of runmu.sh. Content is Markdown under `content/`; changes
arrive as pull requests ("Suggest an edit" on every page opens one). Documentation is CC BY 4.0, the
code MIT ([LICENSE](LICENSE)).

## Writing

```sh
npm ci
npm run dev          # http://localhost:5173/docs/ with hot reload
```

- One page per `.md` under `content/<section>/`. Every page starts with frontmatter that has a
  `title:`; add `audience:` (`guide` | `automation` | `extensions` | `reference`) when it is not the
  section's own. New pages go into the section's sidebar in `.vitepress/config.ts`.
- Link within the docs with root paths (`/automation/triggers`), never `../`, never `.md`.
- Code fences take a language (`lua`, `ts`, `sh`, `json`). Use `::: tip` / `::: warning` for asides
  and `<Since v="1.4" />` next to anything that appeared in a particular SDK version.
- `content/reference/generated/` is written by the export workflow in `runmu-sh/client`; edit the
  source (JSDoc in the SDK, the Lua function table, the OpenAPI files) rather than the copy here.
- Paths in `stable-paths.txt` are linked from the client and the marketplace: move a page, leave a
  redirect page at the old path.

Before opening a PR (CI runs the same):

```sh
npm run typecheck && npm test && npm run build && npm run check
```

`check` fails on anything the CSP would block (inline script or style, `style=` attributes, `data:`
URLs), a link to a file that does not exist, a missing title, a colour literal outside the brand
tokens, and a first load over the size budget.

## Seeing it as production serves it

`npm run dev` injects inline `<style>` tags the CSP forbids, so it does not prove a page works on
runmu.sh. This does (needs Docker):

```sh
npm run build && PORT=41300 scripts/dev-nginx.sh   # http://localhost:41300/docs/
```

Or the whole image: `docker build -t mu-docs . && docker run --rm -p 8080:80 mu-docs`.

## How it holds the CSP

VitePress's default theme is not CSP-clean out of the box. `.vitepress/csp.ts` makes it so: a Shiki
transformer moves token colours from `style` attributes into `dist/shiki.css`, the one inline probe
script is dropped and replaced by a client-side class, the two empty SSR `style=""` attributes are
stripped, and every `data:` SVG icon in the theme's CSS is written out as a file. `appearance: false`
(the site is dark, like runmu.sh) removes the dark-mode inline script. `scripts/check.mjs` holds all
of that in place.

## Deploy

`.github/workflows/deploy.yml` builds `dist/`, runs the checks and pushes
`ghcr.io/runmu-sh/mu-docs` tagged `latest` and `sha-<commit>` on every merge to `main` (roll back by
redeploying an earlier `sha-` tag). Pulling on the runmu.sh host is a person's step, as for
`mu-landing` and `mu-web`. The package is private by default: either make it public
(github.com/orgs/runmu-sh/packages → mu-docs → Package settings → Change visibility) or pull with a
token that has `read:packages`, like the other images.

The container listens on plain `:80` on the compose network, sets the CSP and cache headers itself,
and only answers `/docs*` (anything else is 404). It is one more service in the production compose,
in the same shape as the others (Watchtower label, `mu_net`, log rotation; no host port, Caddy
reaches it by name). `nginx:stable-alpine` has busybox `wget` for the healthcheck:

```yaml
  docs:
    # runmu.sh/docs. Built by github.com/runmu-sh/docs (deploy.yml pushes :latest on every merge to
    # main); Watchtower picks it up like the others. Serves /docs* only, with its own CSP.
    image: ghcr.io/runmu-sh/mu-docs:latest
    container_name: mu_docs
    networks:
      - mu_net
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "-q", "--spider", "http://127.0.0.1/docs/"]
      interval: 5s
      timeout: 3s
      retries: 5
      start_period: 5s
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
    labels:
      - "com.centurylinklabs.watchtower.enable=true"
```

In the Caddyfile's `runmu.sh` site block, before the landing container's route (`handle` blocks are
exclusive and Caddy sorts them most-specific first; if the landing route is a bare `reverse_proxy`,
wrap it in `handle { … }` so the two do not both match). No `header Content-Security-Policy` here:
the container sends its own and two CSPs intersect.

```caddyfile
    handle /docs* {
        reverse_proxy mu_docs:80
    }
```

Then `docker compose up -d docs`, reload Caddy, and check:
`curl -sI https://runmu.sh/docs/ | grep -i content-security-policy` shows this repo's policy (with
`style-src 'self' https://fonts.googleapis.com` and no `'unsafe-inline'`), `/docs/automation/first-trigger`
loads, and the browser console shows no CSP violation.

## Layout

```
content/            the pages (VitePress srcDir); content/public/ is copied verbatim
.vitepress/
  config.ts         nav, sidebars, search, head, the CSP hooks
  csp.ts            the transformer and build steps that keep dist CSP-clean
  llms.ts           writes a .md twin of every page and /docs/llms.txt
  theme/            Layout.vue (SiteShell + section bar), theme.css (--vp-* → brand tokens), components
scripts/check.mjs   the checks CI runs over the source and dist
nginx.conf          the server, with the CSP
stable-paths.txt    paths the client links to
```
