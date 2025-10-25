# Repository Guidelines

## Project Structure & Module Organization
The Astro app lives under `src/`. Route components belong in `src/pages` (file-based routing), shared UI in `src/components`, and reusable wrappers in `src/layouts`. Content collections reside in `src/content` alongside schemas, with supporting data files in `src/data`. Store site-wide images, fonts, and design tokens in `src/assets`. Publish-only files (favicons, robots.txt, redirects) stay in `public/`, and production builds are emitted to `dist/`—never commit that directory.

## Build, Test, and Development Commands
- `npm run dev`: start Astro with live reload at http://localhost:4321.
- `npm run build`: generate the optimized static output in `dist/`.
- `npm run preview`: serve the most recent build to verify production behavior.
- `npm run astro check`: run Astro’s type, frontmatter, and content collection validation; treat failures as blockers.

## Coding Style & Naming Conventions
Use Astro + TypeScript defaults with 2-space indentation. Name components and layouts in PascalCase (e.g., `HeroBanner.astro`) and keep route files kebab-case (`about-me.astro`). Prefer Tailwind utility classes, falling back to DaisyUI variants when consistent with the design system; define shared tokens in `tailwind.config.mjs`. Run `npx astro format` before committing to keep templates and Markdown tidy.

## UI Troubleshooting Resources
For DaisyUI styling questions, consult the focused tips in https://daisyui.com/llms.txt. The guide covers component tokens, state class patterns, and layout recipes—reference it before writing custom CSS and link to the snippet you applied in PR notes when relevant.

## Testing Guidelines
Automated tests are not yet configured. Until a formal suite lands, rely on `npm run build` and `npm run preview` for smoke coverage and note manual verification steps in PRs. When adding logic-heavy features, introduce @astrojs/test-based integration tests under `src/tests`, mirroring the component directory, with files named `*.test.{ts,astro}`.

## Commit & Pull Request Guidelines
Write small, scoped commits using the imperative mood (`Fix header overflow`), optionally adding scopes in parentheses for tooling updates (`chore(tailwind): sync colors`). Before opening a PR, ensure the commands above succeed and the UI matches expectations. PR descriptions should summarize the change, link relevant issues or content updates, and include before/after screenshots or GIFs for visual adjustments. Tag reviewers only after validation passes.
