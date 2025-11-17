# Repository Guidelines

## Project Structure & Module Organization
- `entrypoints/` extension UIs and logic (e.g., `popup/` with `index.html`, `main.tsx`, `App.tsx`).
- `components/ui/` shadcn UI components (e.g., `button.tsx`).
- `lib/` utilities (e.g., `utils.ts` exports `cn`).
- `assets/` static assets and Tailwind CSS (`tailwind.css`).
- `public/` extension icons and static files.
- Config: `wxt.config.ts`, `tsconfig.json`, `components.json`. Build output in `.output/`.

## Build, Test, and Development Commands
- `pnpm dev` — Run WXT dev server with HMR in a test browser.
- `pnpm dev:firefox` — Dev server targeting Firefox.
- `pnpm build` — Production build to `.output/`.
- `pnpm zip` — Package build into a distributable zip.
- `pnpm compile` — Type-check with TypeScript only.
- `pnpm postinstall` — Prepares WXT after install (runs automatically).

## Coding Style & Naming Conventions
- Language: TypeScript + React 19, JSX: `react-jsx`.
- Indentation: 2 spaces; prefer named exports.
- Files: Components `PascalCase` (`App.tsx`), utilities `camelCase` (`utils.ts`).
- Paths: Use alias `@/` (see `tsconfig.json` and `wxt.config.ts`).
- Styling: Tailwind CSS v4. Use `cn` from `lib/utils` to merge classes.
- UI: Prefer shadcn patterns and `class-variance-authority` for variants.

## Testing Guidelines
- No unit test framework is configured. Validate changes via:
  - `pnpm compile` for type safety.
  - `pnpm dev` for interactive checks in the extension popup.
- If adding tests, prefer Vitest + React Testing Library; place tests next to sources as `*.test.ts(x)`.

## Commit & Pull Request Guidelines
- Use clear, scoped messages. Recommended Conventional Commits (e.g., `feat: add button variant`).
- PRs must include:
  - Summary, screenshots/GIFs of UI changes (popup), and linked issue.
  - Notes on permissions/manifest changes if applicable.
  - Build check: confirm `pnpm compile` passes and popup runs.

## Security & Configuration Tips
- Keep extension permissions minimal; document changes in PRs.
- Do not commit secrets or API keys. Exclude `.output/`, `node_modules/` (see `.gitignore`).
- Follow README for shadcn + path alias quirks; keep `@/` paths consistent in both `tsconfig.json` and `wxt.config.ts`.

所有回答请使用中文。