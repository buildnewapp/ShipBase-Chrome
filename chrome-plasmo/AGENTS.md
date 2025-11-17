# Repository Guidelines

## Project Structure & Module Organization
- `src/` — extension source (TypeScript + React):
  - `popup.tsx` — popup UI (i18n + auth state)
  - `background.ts` — MV3 service worker (client auth, polling, storage)
  - `content.tsx` — content overlay sample
  - `features/` — reusable UI pieces (e.g., `count-button.tsx`)
  - `style.css` — Tailwind entry and base styles
- `assets/` — static assets
- `build/` — build output (generated)
- Config: `package.json`, `tsconfig.json`, `tailwind.config.js`, `postcss.config.js`

## Build, Test, and Development Commands
- `pnpm dev` (or `npm run dev`) — run Plasmo dev server for the extension.
- `pnpm build` — production build.
- `pnpm package` — zip the build for store upload.
- Load the extension: Chrome → Manage Extensions → Developer mode → Load unpacked → select the build output.

## Coding Style & Naming Conventions
- Language: TypeScript, React 18, Tailwind 3.
- Formatting: Prettier enforced (`.prettierrc.mjs`); 2‑space indent.
- Imports: sorted via `@ianvs/prettier-plugin-sort-imports`.
- Aliases: use `~` for `src/` (e.g., `import "~style.css"`).
- Files: kebab‑case for components in `features/` (e.g., `count-button.tsx`); reserved entry names like `popup.tsx`, `background.ts` follow Plasmo conventions.
- Tailwind: prefer utility classes; in content UIs, Plasmo prefixes like `plasmo-` may appear.

## Testing Guidelines
- No framework is configured yet. If adding tests, prefer Vitest + React Testing Library.
- Suggested naming: `**/*.test.tsx?` adjacent to code.
- Keep tests deterministic; mock network calls to `freesoragenerator.com`.

## Commit & Pull Request Guidelines
- Commits: small, focused, imperative subject (e.g., "add popup i18n selector").
- PRs: include a concise description, screenshots/GIFs for UI changes, and steps to validate.
- Link related issues. Note any permission/manifest changes explicitly.

## Security & Configuration Tips
- Network/permissions live in `package.json > manifest` (`host_permissions`, `permissions`).
- Background handles client auth and stores `language`, `auth`, `user` in `chrome.storage.local`.
- Avoid storing secrets; tokens are user‑scoped and should be read via the background only.

## Architecture Overview
- Popup reads state from `chrome.storage.local` and sends messages (`START_CLIENT_AUTH`, `LOGOUT`).
- Background opens the sign‑in tab, polls every ~3s via `chrome.alarms`, saves token and user, then notifies UIs.

所有回答请使用中文。