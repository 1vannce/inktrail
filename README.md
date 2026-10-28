# InkTrail

A Manga and Manhwa reading tracker built with React Native, Expo SDK 58, JavaScript, Expo Router, and TanStack Query. Search the public Kitsu catalog, open a title, save it to your library, track chapter progress and reading status, and organize titles into custom lists.

All saved entries and lists are read and written through an external REST API using Fetch. There is no local backend to run. Configure an account-owned MockAPI project with `entries` and `lists` resources for persistent tracker storage. The old public Beeceptor demo is being retired ahead of its expected November 10, 2026 expiry. [API setup and migration checklist](docs/API_SETUP.md).

## Run the delivered project

Use Node.js **22.13+ (22.x), 24.3+ (24.x), or 26+** and npm. This project uses Expo SDK 58 with React Native 0.88 and React 19.3.0. Exact installed versions are recorded in `package-lock.json`.

Before installing or updating dependencies, stop this project's running Expo server with Ctrl+C. On Windows, a running server can lock native files and cause `npm ci` to fail after partially removing `node_modules`.

From the original current directory, enter the new, independent app folder:

```powershell
cd inktrail
npm ci
npm start
```

Open the development URL with a compatible Expo Go client, or use an Android emulator. Keep your phone and development computer on the same network. Platform shortcuts:

```powershell
npm run android
npm run web
```

After updating dependencies, stop the previous Expo server and run `npx expo start --clear`, then scan the new QR code with an Expo Go client that supports SDK 58. If Metro reports a missing `react-native/asset-registry` module, run `npx expo install --check`: Expo and React Native must use compatible SDK versions. Use `npx expo install --fix` to align them rather than upgrading only `expo`.

On macOS with an iOS simulator installed:

```sh
npm run ios
```

The project uses the Expo managed workflow. Native `android/` and `ios/` project directories are not needed to run it. Catalog browsing works immediately with an internet connection. Configure a tracker through the Connection screen or the environment setting below. The historical Beeceptor URL is ignored as a build default; existing saved connections remain available for migration.

## Deploy the web app to Vercel

Import this GitHub repository into Vercel, keep the root directory at the repository root, and select **Other** as the framework preset. The included `vercel.json` sets `npm ci` as the install command, `npm run export:web` as the build command, and `dist` as the output directory. Its rewrite lets Expo Router handle direct links and page refreshes, including `/library`, `/connection`, and `/title/123`.

Use a supported Node.js version listed above. To connect the deployed app to a tracker by default, add `EXPO_PUBLIC_TRACKER_API_URL` in the Vercel project's environment variables before deploying. This is a public HTTPS API base URL, without `/entries` or `/lists`. Without it, readers can configure their endpoint from the app's Connection screen. Changes to this environment variable require a new deployment because Expo embeds it during the build. The local `.env` is excluded from Git and CLI uploads.

Alternatively, deploy from this directory with Vercel CLI:

```powershell
npx vercel login
npx vercel --prod
```

## Move off the public demo before November 10

The original anonymous Beeceptor endpoint was created on October 11, 2026. Its documented 30-day unclaimed retention puts expected cleanup around **November 10, 2026**; its current claim status and exact deletion time have not been verified. [Provider retention policy](https://beeceptor.com/pricing/).

Migration preparation leaves existing `.env` files and credentials unchanged. Supply your actual MockAPI **HTTPS project base URL**, including its configured prefix but excluding `/entries` and `/lists`. The blank setting in `.env.example` is the configuration placeholder. Follow the [backup and cutover steps](docs/API_SETUP.md#migrate-the-existing-library) before changing connections: switching URLs does not copy records.

## Connect your own tracker

1. Follow [API_SETUP.md](docs/API_SETUP.md) to create the two top-level resources, `entries` and `lists`, in your MockAPI project.
2. Open the app's **Connection** screen and paste your provider's HTTPS base URL.
3. Connect. The app checks GET `/entries` and GET `/lists` before saving the URL preference.
4. Search for a title, open its details, save it, and inspect the new record in your API dashboard.

Alternatively, on a fresh copy without `.env`, configure the URL before starting Expo:

```powershell
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
```

Edit `.env` using the exact base URL from your provider:

```dotenv
EXPO_PUBLIC_TRACKER_API_URL=https://YOUR_PROJECT.mockapi.io/api/v1
```

Replace the entire example with the exact dashboard URL; the app rejects the literal placeholder. Then stop the running Expo process and run `npx expo start --clear` to refresh Metro's transformed environment values. For Vercel, update the same public variable and redeploy. The in-app saved connection takes precedence over this environment value, including an explicit disconnect. On each existing device/browser, select **Use configured default URL** (when available), then **Test & connect**, or paste the new URL manually. Both collections must pass validation before the saved preference changes.

Only the endpoint preference is persisted on the device. Entries and lists come from the API, with temporary in-memory caching for the current session. The app never substitutes local saved records when the API is unavailable.

## Project structure

```text
inktrail/
|-- app/
|   |-- _layout.jsx                 # Providers and root stack
|   |-- (tabs)/
|   |   |-- _layout.jsx             # Discover and Library tabs
|   |   |-- index.jsx               # Home/Search route
|   |   `-- library.jsx             # User Tracker Library route
|   |-- title/[id].jsx              # Title Details route
|   `-- connection.jsx              # External API connection route
|-- src/
|   |-- api/
|   |   |-- http.js                 # Fetch, JSON/errors, timeouts, retry policy
|   |   |-- catalog.js              # Kitsu queries and response mapping
|   |   `-- tracker.js              # Entry/list REST operations and validation
|   |-- components/ui.jsx          # Shared UI primitives
|   |-- hooks/
|   |   |-- useCatalog.js           # Catalog pagination and title queries
|   |   `-- useTracker.js           # Remote library/list queries and mutations
|   |-- providers/
|   |   |-- AppProviders.jsx        # Query cache and safe-area context
|   |   `-- ConnectionProvider.jsx  # Endpoint preference and connection state
|   |-- screens/
|   |   |-- HomeScreen.jsx
|   |   |-- TitleDetailsScreen.jsx
|   |   |-- LibraryScreen.jsx
|   |   `-- ConnectionScreen.jsx
|   |-- config.js                  # Endpoint normalization and storage key
|   |-- theme.js                   # Shared visual tokens
|   `-- types.js                   # Reading status labels and values
|-- tests/api.test.js              # API contract and validation tests
|-- docs/API_SETUP.md              # Provider setup, schema, requests, walkthrough
|-- .env.example
|-- app.json
|-- package.json
`-- package-lock.json
```

## Implementation walkthrough

### 1. Define the models and API boundary

Start with [src/types.js](src/types.js) for the reading status labels and values. A normalized catalog title contains its catalog metadata; a tracker entry adds the provider's record ID, status, chapter progress, and optional list membership; a reading list is a named collection. The API modules validate these objects at runtime.

The tracker uses these reading statuses:

| Stored value | Display label |
| --- | --- |
| `reading` | Reading |
| `planned` | Want to read |
| `completed` | Completed |
| `on_hold` | On hold |
| `dropped` | Dropped |

Chapter progress must be a nonnegative whole number. If a total is known, progress cannot exceed it. Unknown totals stay `null`, so ongoing titles can continue to gain chapters. A custom list is independent of reading status; a title has at most one custom list.

[src/api/http.js](src/api/http.js) centralizes Fetch. It checks HTTP status, parses JSON, supports abort signals, limits request time, and returns readable errors. GET requests may retry once for temporary failures. Writes are never retried automatically because an interrupted response can hide a successful server write.

[src/api/catalog.js](src/api/catalog.js) reads Kitsu JSON:API data from `https://kitsu.app/api/edge`, sending `Accept: application/vnd.api+json`. Search uses `/manga` with `filter[text]`, `filter[subtype]`, offset pagination, and `include=categories`; details use `/manga/:id?include=categories`. The All filter merges manga and manhwa requests with separate cursors, promoting exact title matches before prefix and contained matches. Requests are spaced about 1.05 seconds apart as a courtesy, without assuming a provider rate-limit guarantee. IDs in routes and saved entries are numeric Kitsu manga IDs. [Kitsu API reference](https://kitsu.docs.apiary.io/).

[src/api/tracker.js](src/api/tracker.js) handles all persistent data operations against the connected base URL. Create uses POST, reads use GET, edits use PUT with the full record, and removal uses DELETE. Both `/entries` and `/lists` have complete CRUD support. Exact payloads and endpoint examples are in [the API guide](docs/API_SETUP.md#rest-contract).

### 2. Add providers and query hooks

[AppProviders.jsx](src/providers/AppProviders.jsx) owns one QueryClient and the safe-area provider. [ConnectionProvider.jsx](src/providers/ConnectionProvider.jsx) loads the endpoint preference and exposes connection state. No secret credentials are bundled into the app.

[useCatalog.js](src/hooks/useCatalog.js) exposes `useCatalog` for paginated results and `useTitle` for a selected title. [useTracker.js](src/hooks/useTracker.js) exposes `useEntries`, `useLists`, and `useTrackerMutations`. Screens read server state from these hooks rather than copying it into a second global store. Local React state is reserved for search inputs, filters, and form drafts.

Settled mutations invalidate the affected remote queries, including failures that may have partially committed remotely. Pending actions are disabled, and failures remain visible instead of displaying false success. Endpoint-specific query keys keep one connection's data separate from another's.

### 3. Build Home / Search

Route: [app/(tabs)/index.jsx](app/%28tabs%29/index.jsx). Complete component: [HomeScreen.jsx](src/screens/HomeScreen.jsx).

1. Keep the search text, All/Manga/Manhwa filter, and selected genre in component state. The Genres button shows or hides the genre navigation; All genres removes only the genre restriction, while Clear filters resets search, format, and genre.
2. Debounce input before passing it to `useCatalog`. Genre buttons use Kitsu's `filter[categories]` with category slugs. Search, format, and genre share a query key so changing any filter starts at the first page; subsequent pages retain all active filters.
3. Display popular catalog titles before a search and matching results afterward.
4. Render covers and metadata in a responsive catalog grid. Expose loading, empty-result, pagination, and retry states.
5. Navigate to `/title/{id}` when a title is selected. Keep IDs in the route and retrieve current details through the catalog API.

### 4. Build Title Details

Route: [app/title/[id].jsx](app/title/%5Bid%5D.jsx). Complete component: [TitleDetailsScreen.jsx](src/screens/TitleDetailsScreen.jsx).

1. Read and validate the route's title ID, then request details with `useTitle`.
2. Show its cover, format, score, chapter count when known, genres, and synopsis. Author information is optional; the current Kitsu adapter leaves it empty when not supplied.
3. Check `useEntries` for an existing entry matching the catalog ID.
4. Save a new entry through POST `/entries`, or edit the existing entry's chapters, reading status, and custom list through PUT `/entries/:id`.
5. Offer a link to the library, where saved titles can be removed. If the tracker is not configured, direct the reader to Connection.

The external tracker stores a small title snapshot so library cards remain useful without requesting full catalog details for every saved entry.

### 5. Build User Tracker Library

Route: [app/(tabs)/library.jsx](app/%28tabs%29/library.jsx). Complete component: [LibraryScreen.jsx](src/screens/LibraryScreen.jsx).

1. Fetch entries and custom lists with `useEntries` and `useLists`.
2. Derive visible entries from the selected status, custom list, and local search/filter state.
3. Display progress, offer quick chapter updates and an edit dialog, and confirm title removal before DELETE `/entries/:id`. Open details for catalog information and the full editor.
4. Create and rename custom lists through POST/PUT `/lists`.
5. Delete a custom list by first clearing its entries' `listId`, then deleting the list. Saved titles remain in the library.
6. Provide refresh, loading, empty-library, and API-error states so an unavailable service is distinguishable from an empty library.

List deletion spans multiple REST calls. It is not atomic on these mock services; partially completed changes can be refreshed and retried. The guide explains this limitation and the API requirements for a production service.

### 6. Connect navigation and shared UI

[app/_layout.jsx](app/_layout.jsx) wraps the stack with providers. The tab layout keeps discovery and library access available, while details and connection have their own stack routes. [theme.js](src/theme.js) and [ui.jsx](src/components/ui.jsx) keep colors, spacing, typography, buttons, inputs, cards, and feedback consistent across screens.

The UI uses a black-and-white palette with neutral grays, locally bundled Geist Sans typography, simple borders, and a responsive cover grid. The type hierarchy and controls take cues from the [Geist design system](https://vercel.com/geist/typography); book covers retain their original artwork. Font files and their SIL Open Font License are in `assets/fonts/`, loaded through the existing `expo-font` dependency. Discover, Library, title details, Connection, and the editing dialogs share the same controls. Safe areas, scrollable content, visible pending/error states, and descriptive action labels remain in place. The catalog and library are separate screens so a slow catalog response does not prevent access to the tracker controls.

## Checks

Run these from `inktrail`:

```powershell
npm test
npx expo install --check
npx expo-doctor
npx expo export --platform all
```

Verification recorded for the original TypeScript version on October 11, 2026: TypeScript passes, all 14 API tests pass, Expo dependency validation passes, and Expo Doctor passes all 21 checks. Production exports succeed for Android, iOS, and web. A phone-sized browser check verified live catalog search, title details, saving a title, chapter updates, and confirmed removal with no runtime console errors. A separate real Beeceptor check verified entry and list CRUD, including preserving titles when deleting a list; all temporary verification records were removed.

The automated API tests use controlled Fetch responses and do not touch the public endpoint. Android/iOS bundles were compiled; interaction on a physical native device or simulator was not verified here. Follow [the manual verification sequence](docs/API_SETUP.md#manual-verification) for device testing or a replacement provider.

## Recreate the dependency setup

The delivered project is ready to use with `npm ci`. For a separate fresh implementation, create an Expo JavaScript project with [create-expo-app](https://docs.expo.dev/more/create-expo/), then target SDK 58 and install compatible managed libraries:

```powershell
npx create-expo-app@latest inktrail-fresh --template blank
cd inktrail-fresh
npm install expo@~58.0.20
npx expo install --fix
npx expo install expo-router expo-constants expo-font expo-linking expo-status-bar react-native-safe-area-context react-native-screens react-native-gesture-handler react-native-reanimated react-native-worklets @react-native-async-storage/async-storage @expo/vector-icons react-dom react-native-web
npm install @tanstack/react-query@^5
```

Copy this project's `app/`, `src/`, `tests/`, `app.json`, and `.env.example` into that new project. Set `package.json`'s `main` to `expo-router/entry`, set `type` to `module`, and copy its scripts from this project. The blank template's `App.js` and `index.js` are no longer entry points and can be removed. Run the checks above. For identical dependency versions, use this project's `package.json` and lockfile together, followed by `npm ci`.

## Demo scope

The free tracker endpoint is a shared public demo library, not an authenticated user account. Keep it dedicated to this project and use non-sensitive test data. The app guards form inputs and ordinary duplicate saves, but a real multi-user service must enforce authentication, ownership, uniqueness, concurrent updates, and list transactions on its external API. The included Beeceptor endpoint is a public demonstration; no private account or paid service was created.
