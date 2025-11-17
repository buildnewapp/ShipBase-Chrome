# Repository Guidelines

## Project Structure & Module Organization
- Monorepo with two Chrome extension variants:
  - `chrome-plasmo/` — Plasmo-based extension (React + Tailwind). Sources in `src/`, assets in `assets/`.
  - `chrome-wxt/` — WXT-based extension (React + Tailwind). Entry points in `entrypoints/`, shared code in `lib/`, static files in `public/` and `assets/`.
- IDE configs in `.idea/`. No root-level build tooling; each app manages its own `package.json` and `node_modules`.

## Build, Test, and Development Commands
- Plasmo app (`chrome-plasmo`):
  - `pnpm install` — install deps.
  - `pnpm dev` — start extension dev server.
  - `pnpm build` — production build to `build/`.
  - `pnpm package` — package ZIP for store upload.
- WXT app (`chrome-wxt`):
  - `pnpm install` — install deps (runs `wxt prepare`).
  - `pnpm dev` or `pnpm dev:firefox` — run in Chrome/Firefox.
  - `pnpm build` — production build to `.output/`.
  - `pnpm zip` — create distributable archive(s).

## Coding Style & Naming Conventions
- Language: TypeScript, React 18/19, TailwindCSS.
- Formatting: Prettier; 2-space indent; keep imports sorted (Plasmo uses `.prettierrc.mjs`).
- Filenames: components `PascalCase.tsx`; utilities `kebab-case.ts`; locale files under `i18n`/`assets/locales`.
- Keep Chrome permissions minimal; edit `manifest` (Plasmo) or `wxt.config.ts` (WXT) thoughtfully.

## Testing Guidelines
- No test runner is configured. If adding tests, prefer Vitest + React Testing Library.
- Name tests `*.test.ts` or `*.test.tsx` colocated with source.
- Aim for coverage of critical logic in `lib/` and UI interactions in `features/` or `entrypoints/`.

## Commit & Pull Request Guidelines
- Use clear, imperative commit messages. Conventional Commits are encouraged (e.g., `feat: add sidepanel select UI`).
- PRs should include:
  - Purpose and scope; link related issues.
  - Screenshots/GIFs of popup/sidepanel changes.
  - Build notes: which app(s) affected (`chrome-plasmo`, `chrome-wxt`).
  - Checklist: `pnpm build` passes; permission changes documented.

## Security & Configuration Tips
- Review `host_permissions` and `permissions` before merging.
- Avoid long‑lived secrets in code; use environment or runtime configuration where possible.
- Test in both browsers when changing APIs or storage.

