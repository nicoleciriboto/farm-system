# Ngombe Farm Manager

Livestock & farm management app (cattle, goats, sheep) built with **Expo SDK 57 / React Native 0.86**.
It runs on a physical phone through **Expo Go** and builds installable apps with **EAS Build**.

## Project layout

```
index.ts / App.tsx      Expo entry point → src/App.tsx
src/App.tsx             Screen switcher, Android back button, splash, safe areas
src/store.tsx           App state, navigation back-stack, AsyncStorage persistence
src/data.ts             Sample farm data (anchored to "today" = 2026-10-12)
src/screens/            Home, Livestock, Add Animal, Animal Profile, Health, Operations, Reports, Settings
src/components/         Native UI kit (Button, Card, Input, Select, Modal…), header, tab bar, alerts
assets/                 App icon, Android adaptive icon, splash icon, favicon
legacy-web/             Archived Vite/Tailwind web prototype (not used by the app; safe to delete)
```

## 1. Run on your phone with Expo Go

1. Install **Expo Go** from the App Store / Google Play (it must support SDK 57 — update it if prompted).
2. Install dependencies and start the dev server:

   ```bash
   npm install
   ```

   ```bash
   npx expo start
   ```

3. Scan the QR code — **Android:** with the Expo Go app; **iOS:** with the Camera app.

Phone and computer must be on the same Wi-Fi. If the phone can't connect (corporate/guest Wi-Fi,
Windows Firewall), allow Node.js through the firewall when prompted, or use a tunnel:

```bash
npx expo start --tunnel
```

## 2. Build an installable app with EAS

One-time setup:

```bash
npm install -g eas-cli
```

```bash
eas login
```

```bash
eas init
```

`eas init` creates the project on expo.dev and writes its `projectId` into `app.json`.
EAS Build works best from a git repository, so commit the project first (`git init`, `git add -A`, `git commit`).

**Android test build (APK you can install directly on the phone):**

```bash
npm run build:preview:android
```

When it finishes, open the link/QR code from the build page on the phone and install the APK.

**iOS test build:** requires a paid Apple Developer account. Register your iPhone first, then build:

```bash
eas device:create
```

```bash
npm run build:preview:ios
```

**Store builds:** `npm run build:production` (then `eas submit`).

Bundle identifiers are `com.ngombe.farmmanager` (iOS and Android) — change them in `app.json`
before your first store build if you want a different ID.

## Useful scripts

| Script | What it does |
| --- | --- |
| `npm start` | Start the Expo dev server (Expo Go) |
| `npm run start:tunnel` | Same, through a tunnel for restrictive networks |
| `npm run web` | Run in a browser via react-native-web |
| `npm run typecheck` | TypeScript check |
| `npm run doctor` | `expo-doctor` dependency/config checks |

## Notes

- Data is saved on the device (AsyncStorage) and survives restarts. **Settings → Reset Prototype Sample Data** restores the sample set.
- "Cloud sync" is simulated — there is no backend yet.
- Sample data, task statuses and the health calendar are anchored to 12 Oct 2026 (`today` in `src/data.ts`).
