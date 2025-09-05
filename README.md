# Certificate Generator PWA

A fast, offline-capable React + Vite PWA for creating beautiful course completion certificates. Export certificates to multiple formats (PDF, PNG, JPEG, WEBP, HTML, JSON), embed a QR code with a verification link, and deploy easily to GitHub Pages.

Live (GitHub Pages): https://arunkmr08.github.io/Certificate-Generator/

## Features

- Certificate builder with live preview and customizable styles
- Multiple border styles and accent color picker
- Organization/issuer details and instructor signature support
- Multi-format export: PDF (standard/optimized), PNG, JPEG, WEBP, HTML snapshot, and JSON state
- Size estimates prior to downloading assets
- Embedded QR code verification link (`/verify?cid=<CERT-ID>`) that redirects to a static PDF
- PWA: offline support with a scope-aware service worker
- Production-ready GitHub Pages workflow

## Tech Stack

- React 18 + TypeScript
- Vite 5
- Tailwind CSS
- html2canvas + jsPDF (lazy-loaded for performance)

## Quick Start

Prerequisites: Node.js 18+ and npm.

- Install dependencies: `npm install`
- Start dev server: `npm run dev`
- Build for production: `npm run build`
- Preview production build: `npm run preview`

Optional (linting):
- Install dev tools: `npm i -D eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin eslint-plugin-react eslint-plugin-react-hooks eslint-config-prettier`
- Lint: `npm run lint`
- Auto-fix: `npm run lint:fix`

## Usage

1. Fill in certificate details: issuer/org, recipient, course, dates, instructor details.
2. Optionally upload a logo and signature image.
3. Choose a border style and accent color.
4. Use the Download menu to:
   - Copy the verification link and direct PDF link
   - Download assets in your preferred format

### Certificate ID and Verify Links

- A unique `certificateId` is generated on the client (`CERT-YYYYMMDD-XXXXX`).
- The verify link points to: `BASE_URL/verify?cid=<certificateId>`.
- The verify page (`public/verify/index.html`) redirects the user to:
  `BASE_URL/certs/<certificateId>.pdf`.

Important: Publish or upload the corresponding PDF to `public/certs/<certificateId>.pdf` as part of your release process so the verify link resolves. The app can generate a PDF client-side for the user, but if you want a persistent public verify link, you must host that PDF under `public/certs/` (or make a server endpoint that maps `cid` to a file).

## Configuration

Environment variables (Vite):
- `VITE_VERIFY_BASE_URL` (optional): Set a custom base URL for the verification page (defaults to `window.location.origin + BASE_URL + 'verify'`). Example: `https://example.com/verify`.

Base path:
- The app is configured for GitHub Pages deployment under `/Certificate-Generator/` via `vite.config.ts` (`base: '/Certificate-Generator/'`). If you fork/rename the repo, update this `base` accordingly.

## PWA and Caching

- Service worker location: `public/service-worker.js` (registered in `src/main.tsx`).
- Scope-aware caching uses `self.registration.scope` so assets resolve correctly under subpaths (e.g., GitHub Pages).
- Strategy:
  - Network-first for navigations/HTML to prevent stale blank pages after deploys.
  - Cache-first for other GET requests, with network fallback and cache population.
- Cache busting: Bump the `CACHE_NAME` in `public/service-worker.js` to invalidate the old cache after significant changes.

Note: In development, Vite serves from `/` and `import.meta.env.BASE_URL` is `/`, so the service worker URL remains `/service-worker.js`.

## Deploying to GitHub Pages

This repo includes a GitHub Actions workflow that builds and deploys to GitHub Pages.

- Workflow: `.github/workflows/deploy.yml`
- Triggers: on push to `main` and manual dispatch
- Steps: checkout → Node setup → `npm ci` → `npm run build` → upload `dist/` → deploy to Pages

For forks or other repo names:
- Update `vite.config.ts` `base` to match your repository name, e.g. `'/my-repo/'`.
- Ensure GitHub Pages is enabled in your repo settings (Pages → Source: GitHub Actions).

## Development Notes

- Lazy-loading heavy libs: `html2canvas` and `jspdf` are loaded only when downloading/estimating to reduce initial bundle size.
- Type safety: Strict TypeScript settings with typed refs and unions for border style keys.
- Tailwind CSS is used for styling; the content paths are configured in `tailwind.config.cjs`.

## Troubleshooting

- Blank page after deploy: A previous service worker may be serving stale HTML. Hard-refresh or bump `CACHE_NAME` in `public/service-worker.js` and redeploy.
- Cross-origin images not captured in exports: `html2canvas` requires images to be CORS-enabled. Host your images with proper CORS headers or serve them locally.
- Verify link 404: Ensure the PDF exists at `public/certs/<certificateId>.pdf` in your deployed site. The client-generated PDF is not automatically uploaded.
- Subpath issues: If deploying under a different base path, update `vite.config.ts`. Also verify `index.html` manifest/icon links are served with the correct base in the built output.

## Scripts

- `npm run dev` — Start local dev server
- `npm run build` — Type-check and build production assets
- `npm run preview` — Preview the production build locally
- `npm run lint` — Lint TypeScript/React (after installing dev deps)
- `npm run lint:fix` — Lint with auto-fixes

## Folder Structure (key files)

- `src/components/CertificateBuilder.tsx` — Main certificate UI and export logic
- `src/main.tsx` — App entry and service worker registration
- `public/manifest.json` — PWA manifest
- `public/service-worker.js` — PWA cache logic
- `public/verify/index.html` — Verify page that redirects to `certs/<cid>.pdf`
- `public/certs/` — Place static PDFs for verification links

## License

MIT (or your preferred license). If you have specific licensing requirements, update this section accordingly.

