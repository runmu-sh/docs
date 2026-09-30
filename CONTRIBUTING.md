# Contributing

Thanks for improving the μClient docs. Everything is a pull request against `main`.

## Small fixes

Click **Suggest an edit** at the bottom of the page. GitHub forks the repo, opens the file, and turns
your change into a pull request. CI builds the site and runs the checks; a maintainer reviews and
merges. Nothing else is needed.

## New pages and larger changes

1. `npm ci && npm run dev` (Node 22), open <http://localhost:5173/docs/>.
2. Add the page under `content/<section>/` with frontmatter (`title:` at least) and put it into the
   section's sidebar in `.vitepress/config.ts`. The README's "Writing" section has the conventions.
3. `npm run typecheck && npm test && npm run build && npm run check` must pass.
4. Open the PR with a sentence on who the page is for and what they can do after reading it.

## Voice

- Lead with what the reader does, not what the software has. "Add a trigger" before "The trigger
  system supports…".
- One idea per page; link to the neighbours instead of repeating them.
- Every code sample runs as written. If a sample needs a setup step, the step is on the same page.
- Name things the way the client's UI names them (**Automation → Triggers**), in bold.
- Facts about the SDK, the Lua functions and the APIs come from the generated reference: link to it
  rather than restating a signature that may change.

## What CI rejects

Inline styles or scripts, `data:` URLs, links to pages that do not exist, a page without a title,
colour literals outside the brand tokens, and a first load over the size budget. `npm run check`
prints the reason; the README's "How it holds the CSP" explains why.

## Licence

By contributing you agree that documentation you write is published under CC BY 4.0 and code under
MIT (see [LICENSE](LICENSE)).
