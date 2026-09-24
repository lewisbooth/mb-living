# MB Living

Static website for [mbliving.co.uk](https://mbliving.co.uk). Pug templates,
Stylus styles and browser modules are built by Vite into `dist/`. Node.js
24.19.0 is pinned in `.node-version` and dependencies are pinned in the npm
lockfile.

```sh
npm ci
npm run build
npm run preview
```

`npm run dev` starts a local development server. `npm run verify` builds twice
from scratch, checks identical output hashes, rejects stale build files and
checks all pages' asset references and fingerprinted static asset bytes. The
`dist/` directory is generated and ignored by Git.

| Source | Output |
| --- | --- |
| `src/pug/index.pug`, `contact.pug`, `404.pug` | Flat HTML pages |
| `src/css/style.styl` and partials | Bundled stylesheet |
| `src/js/` | Bundled site and homepage scripts |
| `src/static/` | Images, fonts, icons, and vendored scripts fingerprinted under `/immutable/`; favicon and sitemap retained at their conventional paths |

The build rewrites every HTML and CSS reference to its fingerprinted asset.
Vite's bundled JS and the final rewritten CSS are fingerprinted under
`/assets/`. Cloudflare's `_headers` gives these two paths a one-year browser
lifetime with `immutable`; HTML, sitemap, and the fallback `/favicon.ico`
retain normal revalidation. Once a visitor has loaded the site, an updated HTML
page can reuse unchanged assets without requesting them again. Opening a new
page still requests its HTML document. There are no runtime data requests.

Edit the Pug templates rather than the generated `src/*.html` entry pages.
The home page and `/contact` remain the two website routes; Cloudflare serves
`contact.html` at the slashless route and `404.html` for unknown paths. The
contact page uses telephone and email links; it has no backend form.

## Cloudflare static assets

The repository's `wrangler.jsonc` deploys `dist/` as Worker Static Assets.
Cloudflare Builds runs `npm run build` before deployment, including in a clean
checkout. Wrangler itself does not run the build again.
Connect the existing repository to a Cloudflare Worker using:

| Workers Builds setting | Value |
| --- | --- |
| Repository | `lewisbooth/mb-living` |
| Production branch | `main` |
| Root directory | Repository root |
| Build command | `npm run build` |
| Deploy command | `npx wrangler deploy` |
| Node version | `24.19.0` from `.node-version` |

After `npm ci`, `npm run deploy` builds and deploys manually. The Workers Static
Assets deployment has no Worker script, bindings, or Worker-first routes. Its
URL can be checked before moving any production DNS. This repository does not
configure a custom domain or change `mbliving.co.uk` DNS.

### Branch previews

In the Worker dashboard, enable **Preview Builds** under **Settings > Builds >
Branch control** and use `npx wrangler preview` as the Preview command. Set
the Builds build command to `npm run build` for previews as well. The empty
`previews` block in `wrangler.jsonc` is required even for this static site,
which has no separate secrets or data bindings. The `preview_urls` setting
enables its `workers.dev` preview host.

Work on a dedicated branch, push commits, then open a pull request into `main`.
Each push updates that branch's stable Preview URL; each deployment also has
an immutable URL for reviewing that exact build. Merging into `main` triggers
the production deployment. Preview builds do not change production DNS or
promote the branch to the production Worker.
