# Morphiq motion library

A static component library with a Morphiq interface, 137 interactive Motion Garden previews, full-screen views, a searchable Cook Book, collections, and local favorites. Publicly available source snippets are included where captured. The compiled demo assets are stored locally; this is not the upstream editable React/TypeScript source repository.

## Run locally

`npm run dev` serves the site at http://localhost:5173. No dependency install or build is needed. `npm run check` verifies page coverage, preview wrappers, source inventories, demo asset hashes, fonts, JavaScript syntax, and navigation/control behavior. `npm run build` regenerates the Morphiq page shells and metadata from the captured catalog.

`dist/` is the complete static website. Routes use flat `.html` output for clean URLs. `server.mjs` supplies the local server. `dist/morphiq/app.js` handles navigation, search, favorites, source snippets, and preview controls. `dist/previews/` contains the captured demo pages with a local control bridge. `recreation-manifest.json` records the public route and asset inventory.

## Deploy to Vercel

Import the repository in Vercel and set the project **Root Directory** to the folder containing this `package.json` and `vercel.json`. The included `vercel.json` runs `npm run build`, publishes `dist/`, and maps the generated `.html` pages to clean URLs. No environment variables or dependency installation are required.

This is a static site: favorites are stored in the visitor's browser, and account, payment, and other remote services are not included.

## Scope and limitations

- Public interactive previews and their controls use the original compiled frontend assets, including WebGL/canvas effects.
- Original attribution and source links are retained. Original ownership of public assets remains with Motion Garden and its dependencies.
- Account services, payments, remote analytics, and gated Pro source downloads are not implemented. This recreation does not unlock paid source.
- The original `/templates/*` website-template routes returned HTTP 404 at capture time. Unavailable routes show a local unavailable-page message. The nine hero components in the main catalog are included.
- The reference also has unavailable `/shades/*` artwork and some sample-audio URLs; those are not fabricated. Some demos may inherit the reference's missing-asset behavior.
- A browser connection was unavailable during verification. Structural, asset-integrity, HTTP, and isolated application behavior checks pass; visual layout and live WebGL interactions still need browser QA.

## Refresh the public frontend

`npm run recreate` captures public routes and linked assets. `node scripts/recreate.mjs --extend` adds full-screen views. These capture commands overwrite the page shells, so use them only when deliberately refreshing the reference. The existing Morphiq catalog, source snippets, preview wrappers, and demo hash baseline must also be reviewed when refreshing; `npm run build` reuses them when present. Run `npm run check` after refreshing. Network access is required only for refreshing. Some demo imagery still uses the original public Unsplash image service.

Reference: https://motion-garden.vercel.app/
