# Deploy, install and M1 checklist

## Cloudflare Pages

1. Push the repo to GitHub.
2. Cloudflare dashboard › Workers & Pages › Create › Pages › Connect to Git, pick the repo.
3. Production branch `main`. Build command `npm run build`. Output directory `dist`. Node 22 or newer (set `NODE_VERSION` if needed).
4. Every other branch gets its own `*.pages.dev` preview URL (separate site, empty storage).
5. Single-page routing: the service worker serves `index.html` for navigations. For first loads of deep links add `public/_redirects` with `/* /index.html 200` if Cloudflare returns 404.

## Install on iPhone

1. Open the `main` URL in Safari.
2. Share › Add to Home Screen › Add.
3. From then on open the app only from the Home Screen icon (it has its own storage, apart from Safari).
4. Updates: when a new version is ready, a "Új verzió – frissítés" banner appears at the top; tap it.

## Local checks

```
npm run build && npm run preview   # dist/manifest.webmanifest and dist/sw.js are emitted
```

Regenerate icons after changing `public/logo.svg`: `npx pwa-assets-generator`.

## Manual checklist M1 (on a real iPhone, over HTTPS preview URL)

- [ ] Add to Home Screen shows the Tónus icon and name "Tónus".
- [ ] Opens standalone (no Safari bars), status bar readable, content clear of notch and home bar.
- [ ] No page bounce on overscroll; no zoom when tapping buttons.
- [ ] Switch tabs Ma / Program / Napló; bottom nav sits above the home bar.
- [ ] Airplane mode, kill and reopen the app: it still loads, fonts render (ő, ű).
- [ ] After deploying a new build, the update banner appears and tapping it reloads the new version.
