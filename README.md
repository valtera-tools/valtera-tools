# Valtera Tools

Simple, open-source financial tools for Australians — built with Vite and Tailwind CSS v4.

- Live demos: run locally with the quickstart below
- Apps included: Compound & Inflation Visualiser, Franking Credit Calculator
- Privacy-friendly: fully offline, deterministic math, no tracking

## Stack
- Vite (multi-page app)
- Tailwind CSS v4 (compiled CSS)
- PostCSS + @tailwindcss/postcss
- Chart.js (for charts in the visualiser)

## Project structure
```
valtera-tools/
  src/
    index.html                 # Home page
    styles.css                 # Tailwind v4 entry (@import "tailwindcss")
    public/
      styles.css               # Compiled CSS served at /styles.css
    compound_visualiser/
      index.html
      app.js
    franking_credit/
      index.html
      app.js
  tailwind.config.js
  postcss.config.js
  vite.config.js
  package.json
```

## Quickstart (Windows / PowerShell)
```powershell
# 1) Install
npm install

# 2) Build CSS once (optional; dev will work without manual build)
npm run tw:build

# 3) Start dev server
npm run dev
# Open the Local URL printed in the terminal (e.g., http://localhost:5173)

# Optional: Tailwind watch (only if you edit src/styles.css or tailwind.config.js)
npm run tw:watch
```

## How styling works
- Source CSS: `src/styles.css` with a single line:
  ```css
  @import "tailwindcss";
  ```
- Compiled CSS: `src/public/styles.css` (served by Vite at `/styles.css`).
- Every HTML page links the compiled sheet:
  ```html
  <link rel="stylesheet" href="/styles.css">
  ```
- Do not use the Tailwind CDN script.

## Scripts
```json
{
  "dev": "vite",
  "tw:build": "npx @tailwindcss/cli -i ./src/styles.css -o ./src/public/styles.css --minify",
  "tw:watch": "npx @tailwindcss/cli -i ./src/styles.css -o ./src/public/styles.css --watch",
  "build": "npm run tw:build && vite build",
  "preview": "vite preview",
  "dev:compound": "vite --open /compound_visualiser/index.html",
  "dev:franking": "vite --open /franking_credit/index.html"
}
```

## Deployment (Vercel)
- Root directory: repository root
- Build command: `npm run build`
- Output directory: `dist`

## Documentation
- Canon: `docs/canon/valtera-tools_frontend-architecture.md`
- Setup & Troubleshooting: `docs/general/tailwind-v4-setup-and-troubleshooting.md`

## Contributing
Issues and PRs are welcome. Keep tools deterministic and educational; avoid backend dependencies.

## License
MIT © Valtera Tools
