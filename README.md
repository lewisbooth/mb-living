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
checks both pages' asset references and all copied static asset bytes. The
`dist/` directory is generated and ignored by Git.

| Source | Output |
| --- | --- |
| `src/pug/index.pug`, `contact.pug`, `404.pug` | Flat HTML pages |
| `src/css/style.styl` and partials | Bundled stylesheet |
| `src/js/` | Bundled site and homepage scripts |
| `src/static/` | Images, fonts, favicons, sitemap, and vendored libraries copied unchanged |

Edit the Pug templates rather than the generated `src/*.html` entry pages.
The home page and `/contact` remain the two website routes; Cloudflare serves
`contact.html` at the slashless route and `404.html` for unknown paths. The
contact page uses telephone and email links; it has no backend form.

## Cloudflare Workers

The repository's `wrangler.jsonc` deploys `dist/` as Worker Static Assets.
Wrangler runs `npm run build` before deployment, including in a clean checkout.
Connect the existing repository to a Cloudflare Worker using:

| Workers Builds setting | Value |
| --- | --- |
| Repository | `lewisbooth/mb-living` |
| Production branch | `main` |
| Root directory | Repository root |
| Build command | Leave blank; Wrangler runs the configured build |
| Deploy command | `npx wrangler deploy` |
| Node version | `24.19.0` from `.node-version` |

After `npm ci`, `npm run deploy` builds and deploys manually. The Worker URL
can be checked before moving any production DNS. This repository does not
configure a custom domain or change `mbliving.co.uk` DNS.
