# task-15: PWA (Progressive Web App)

## Status: pending

## Goal
Make TatraSplit installable on mobile as a PWA — home screen icon, fullscreen standalone mode, offline shell.

## Implementation

### 1. Install plugin
```bash
cd frontend
npm install -D vite-plugin-pwa
```

### 2. Update `frontend/vite.config.js`
Add `VitePWA` plugin:
```js
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'icons/*.png'],
      manifest: {
        name: 'TatraSplit',
        short_name: 'TatraSplit',
        description: 'Shared payments by Tatra banka',
        theme_color: '#0f172a',
        background_color: '#0f172a',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^http:\/\/localhost:8000\/api\/v1\/.*/i,
            handler: 'NetworkFirst',
            options: { cacheName: 'api-cache', networkTimeoutSeconds: 5 },
          },
        ],
      },
    }),
  ],
})
```

### 3. Create icons
Place in `frontend/public/icons/`:
- `icon-192.png` — 192×192px
- `icon-512.png` — 512×512px

Use TatraMark SVG (`components/layout/TatraMark.jsx`) as source, export at both sizes. Background: `#0f172a`, icon: white.

### 4. Add `frontend/public/favicon.ico`
Convert 512px icon to `.ico` if not already present.

### 5. Update `frontend/index.html`
Add meta tags:
```html
<meta name="theme-color" content="#0f172a" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
<meta name="apple-mobile-web-app-title" content="TatraSplit" />
<link rel="apple-touch-icon" href="/icons/icon-192.png" />
```

## Files changed
- `frontend/vite.config.js` — add VitePWA plugin
- `frontend/index.html` — add PWA meta tags
- `frontend/public/icons/icon-192.png` (new)
- `frontend/public/icons/icon-512.png` (new)
- `package.json` — new dev dependency

## Verification
1. `npm run build && npm run preview`
2. Open Chrome DevTools → Application → Manifest — check all fields populated
3. Application → Service Workers — check registered and active
4. Lighthouse → PWA audit — should pass installability
5. On Android Chrome: "Add to Home Screen" prompt appears
6. On iOS Safari: Share → Add to Home Screen works
7. Installed app opens fullscreen (no browser chrome)
