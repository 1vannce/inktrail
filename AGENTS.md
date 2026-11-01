# AGENTS.md

PanelPaw is a manga/manhwa reading tracker: Expo SDK 58, React Native 0.88, React 19, Expo Router, TanStack Query. It is plain JavaScript (no TypeScript). Catalog data comes from the public Kitsu API; saved entries and lists live in an external MockAPI-style REST service. There is no local backend.

## Commands

Run from this directory (the repository root). Use Node 22.13+, 24.3+ or 26+.

```sh
npm ci                          # install exact locked dependencies
npm start                       # Expo dev server (npm run web / android / ios)
npm test                        # node --test tests/*.test.js
npm run export:web              # production web build into dist/
npx expo install --check        # verify SDK-compatible dependency versions
npx expo-doctor
```

Stop the running Expo server before `npm ci` on Windows; it locks native files. After changing `.env`, restart with `npx expo start --clear`.

## Layout

- `app/` Expo Router routes only (thin wrappers): `(tabs)/index`, `(tabs)/library`, `title/[id]`, `connection`.
- `src/screens/` screen components (Home, TitleDetails, Library, Connection).
- `src/api/` `http.js` (Fetch, timeouts, GET-only retry), `catalog.js` (Kitsu), `tracker.js` (entries/lists CRUD and validation).
- `src/hooks/` TanStack Query hooks: `useCatalog`, `useTitle`, `useEntries`, `useLists`, `useTrackerMutations`.
- `src/providers/` query client and connection (endpoint preference) state.
- `src/components/ui.jsx`, `src/theme.js` shared UI primitives and tokens.
- `src/config.js` endpoint normalization; `src/types.js` reading status values/labels.
- `tests/` Node test runner tests for API contract and config. `docs/API_SETUP.md` is the REST contract and migration guide.

## Conventions

- Server state belongs in TanStack Query hooks, not in a second global store. Local React state is for inputs, filters and drafts.
- All tracker I/O goes through `src/api/tracker.js` and `src/api/http.js`. Never retry writes automatically; only GETs may retry.
- Never silently fall back to local data when the API fails; show the error state.
- Use the theme tokens and `ui.jsx` primitives (black/white/gray palette, Geist Sans) rather than ad hoc styles.
- Reading statuses are `reading`, `planned`, `completed`, `on_hold`, `dropped`. Progress is a nonnegative integer, capped by the total when known (`null` when unknown). A title belongs to at most one custom list.
- Catalog IDs are numeric Kitsu manga IDs. Space Kitsu requests ~1.05 s apart.
- Match the surrounding code's style. Add dependencies only when necessary, and use `npx expo install` so versions match the SDK.

## Secrets and files not to touch

- `.env` is gitignored and may hold a real endpoint. Do not print, commit or edit it. Only `.env.example` (blank placeholder) is tracked. Never put keys, tokens or dashboard URLs in tracked files.
- Do not edit `dist/`, `.expo/`, `node_modules/`, `.npm-cache/`, `output/` (generated or local).
- The anonymous Beeceptor demo endpoint expires around 2026-11-10; do not use it as a default. See `docs/API_SETUP.md` before changing connection logic.

## Verification

- Run `npm test` after changing `src/api/`, `src/config.js` or validation logic, and add tests for new behavior there.
- For UI changes, run the app (`npm run web`) and check the affected screen, including loading, empty and error states.
- Report only the checks you actually ran.

## Commits

Use Conventional Commits: `type(scope): short description` (lowercase, imperative, no trailing period). One coherent change per commit.
