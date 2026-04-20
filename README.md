# react-native-chuck-interceptor

**Network inspector for React Native** — intercept `fetch`, `XMLHttpRequest`, and Axios to inspect **requests, responses, headers, JSON, and FormData** in a clean in-app dashboard.

Inspired by [Chucker Android](https://github.com/ChuckerTeam/chucker) and [chucker_flutter](https://pub.dev/packages/chucker_flutter).

---

## Why this library?

- **Debug APIs faster**: see what your app actually sent/received (including FormData uploads).
- **Zero native setup**: pure JS/TS package (works on iOS + Android).
- **Production safe by default**: enabled only in `__DEV__` unless you opt in.

## Features

- **Automatic interception** of `fetch` and `XMLHttpRequest` (covers Axios, Apollo, Relay, etc.)
- **In-app dashboard** — list view, detail view, headers, JSON tree
- **FormData support** — view multipart/form-data fields and file metadata
- **Interactive JSON tree** with collapsible nodes
- **Search & filter** requests by URL, method, or status code
- **Share** any request/response via the native share sheet
- **Settings screen** — max requests, host filter, debug-only mode, notification duration
- **Persistent storage** via AsyncStorage (optional — gracefully degrades)
- **Debug-only by default** — zero overhead in production
- **Zero native modules** — pure JS/TS, works on iOS and Android

---

## Screenshots

| Request List | Request Detail | JSON Tree | Settings |
|---|---|---|---|
| Dark themed list with method badges and status codes | Full detail with tabs | Interactive collapsible tree | Toggles and stepper controls |

---

## Requirements

| Requirement | Version |
|---|---|
| React Native | **≥ 0.71** (uses `gap` flexbox — added in RN 0.71) |
| React | ≥ 17.0 |
| iOS | ≥ 13.0 |
| Android | API ≥ 21 |

> **Zero native modules** — no `pod install` changes, no `MainApplication.java` edits, no `npx react-native link`.

---

## Installation

### Option A — npm/yarn (published package)

```bash
npm install react-native-chuck-interceptor
# or
yarn add react-native-chuck-interceptor
```

## Quick Start

Wrap your root component with `<ChuckerProvider>`:

```tsx
// App.tsx
import { ChuckerProvider } from 'react-native-chuck-interceptor';

export default function App() {
  return (
    <ChuckerProvider>
      <YourApp />
    </ChuckerProvider>
  );
}
```

That’s it. Chucker will automatically intercept all `fetch` and `XHR` calls (and therefore most Axios traffic).

### Option B — Local plugin (file: reference)

Use this when you have the package as a local folder on your machine (e.g. a monorepo or local dev copy).

**1. Add the dependency in your app's `package.json`:**

```json
{
  "dependencies": {
    "react-native-chuck-interceptor": "file:../react-native-chuck-interceptor"
  }
}
```

**2. Install:**

```bash
npm install
# or
yarn install
```

**3. Configure Metro** — copy `metro.config.example.js` from the plugin folder into your app as `metro.config.js` (or merge with your existing one):

```js
// metro.config.js  (in your RN app)
const path = require('path');
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

const chuckerRoot = path.resolve(__dirname, '../react-native-chuck-interceptor');

module.exports = mergeConfig(getDefaultConfig(__dirname), {
  watchFolders: [chuckerRoot],
  resolver: {
    nodeModulesPaths: [
      path.resolve(__dirname, 'node_modules'),
      path.resolve(chuckerRoot, 'node_modules'),
    ],
    sourceExts: ['tsx', 'ts', 'jsx', 'js', 'json'],
  },
});
```

> **Why?** Metro needs `watchFolders` to detect changes in the local package, and `nodeModulesPaths` to ensure both your app and the plugin share the same `react` / `react-native` instances (prevents duplicate module errors).

**4. Clear caches and run:**

```bash
# iOS
npx react-native start --reset-cache
npx react-native run-ios

# Android
npx react-native start --reset-cache
npx react-native run-android
```

---

### Optional: Persistent Storage

For requests to persist across app restarts, install AsyncStorage:

```bash
npm install @react-native-async-storage/async-storage
npx pod-install  # iOS only
```

> Without AsyncStorage the plugin works perfectly — requests are just held in memory for the current session.

---

## Quick Start

Wrap your root component with `<ChuckerProvider>`:

```tsx
// App.tsx
import { ChuckerProvider } from 'react-native-chuck-interceptor';

export default function App() {
  return (
    <ChuckerProvider>
      <YourApp />
    </ChuckerProvider>
  );
}
```

That's it. Chucker will automatically intercept all `fetch` and `XHR` calls.

Optionally, Chucker can show **local notifications** for each request (iOS + Android) when `@notifee/react-native` is installed and notification permission is granted. Tapping a notification opens the inspector.

---

## Configuration

```tsx
<ChuckerProvider
  config={{
    showOnlyInDebug:      true,   // Only active in __DEV__ builds (default: true)
    showNotification:     true,   // Show local notification per request (default: true, requires @notifee/react-native)
    requestNotificationPermissionOnStart: true, // Request notification permission on app start (default: true)
    notificationDuration: 3000,  // (legacy) previously used by the in-app toast
    maxRequests:          200,    // Max stored requests (default: 200)
    hostFilter:           [],     // Only capture URLs containing these strings (default: all)
  }}
>
  <YourApp />
</ChuckerProvider>
```

### Show in Release builds

```tsx
<ChuckerProvider config={{ showOnlyInDebug: false }}>
  <YourApp />
</ChuckerProvider>
```

### Host filtering

```tsx
<ChuckerProvider
  config={{
    hostFilter: ['api.myapp.com', 'staging.myapp.com'],
  }}
>
  <YourApp />
</ChuckerProvider>
```

---

## Usage with Axios (recommended)

Chucker patches global `fetch`/`XHR`, so it already captures Axios requests. But for **more accurate timing** (before Axios adapters transform the request), you can use the dedicated axios interceptors:

```tsx
import axios from 'axios';
import { ChuckerInterceptor } from 'react-native-chuck-interceptor';

const api = axios.create({ baseURL: 'https://api.example.com' });

const chucker = ChuckerInterceptor.axiosInterceptors();

api.interceptors.request.use(chucker.request.onFulfilled);
api.interceptors.response.use(
  chucker.response.onFulfilled,
  chucker.response.onRejected,
);
```

---

## Open the Inspector Programmatically

```tsx
import { useChuckerContext } from 'react-native-chuck-interceptor';

function DebugButton() {
  const { openChucker } = useChuckerContext();
  return <Button title="Open Network Inspector" onPress={openChucker} />;
}
```

---

## Context API

Inside any component wrapped by `<ChuckerProvider>`:

```tsx
const {
  requests,        // ChuckerRequest[]  — all captured requests
  settings,        // ChuckerSettings   — current settings
  isVisible,       // boolean           — inspector is open
  openChucker,     // () => void        — open the inspector
  closeChucker,    // () => void        — close the inspector
  clearRequests,   // () => void        — clear all stored requests
  updateSettings,  // (s: Partial<ChuckerSettings>) => void
} = useChuckerContext();
```

---

## ChuckerRequest Type

```ts
interface ChuckerRequest {
  id:                  string;
  method:              string;           // 'GET' | 'POST' | ...
  url:                 string;
  host:                string;
  path:                string;
  queryString:         string;
  protocol:            string;           // 'http' | 'https'
  requestHeaders:      Record<string, string>;
  requestBody:         string | null;
  requestBodySize:     number;           // bytes
  responseCode:        number | null;
  responseMessage:     string | null;
  responseHeaders:     Record<string, string>;
  responseBody:        string | null;
  responseBodySize:    number;
  responseContentType: string | null;
  startedAt:           number;           // Unix ms
  completedAt:         number | null;
  duration:            number | null;    // ms
  status:              'pending' | 'complete' | 'failed';
  error:               string | null;
}
```

---

## Inspector UI

### List Screen
- All requests sorted newest-first
- Method badge (color-coded), status code, duration, timestamp
- Search by URL / method / status
- Filter chips: All · 2xx · 4xx · 5xx · Failed
- Pull-to-clear button

### Detail Screen — 4 Tabs

| Tab | Content |
|-----|---------|
| **Overview** | URL, timing, status, sizes |
| **Request** | Request body — JSON tree or raw |
| **Response** | Response body — JSON tree or raw |
| **Headers** | All request & response headers |

- Tap any JSON body to switch between interactive **Tree** and **Raw** view
- **Share** button exports the full request as plain text

### Settings Screen
- Toggle notifications
- Toggle debug-only mode
- Max requests slider (50 / 100 / 200 / 500)
- Host filter input
- Notification duration (1s / 2s / 3s / 5s)
- Clear all requests

---

## Platform Notes

| Feature | iOS | Android |
|---------|-----|---------|
| Fetch interception | ✅ | ✅ |
| XHR interception | ✅ | ✅ |
| Axios interception | ✅ | ✅ |
| Floating notifications | ✅ | ✅ |
| Full inspector UI | ✅ | ✅ |
| Share sheet | ✅ | ✅ |
| Persistent storage | ✅ (AsyncStorage) | ✅ (AsyncStorage) |

---

## Architecture

```
react-native-chuck-interceptor/
├── src/
│   ├── index.ts              # Public exports
│   ├── types.ts              # TypeScript types
│   ├── utils.ts              # Formatters, parsers, helpers
│   ├── storage.ts            # AsyncStorage wrapper
│   ├── interceptor.ts        # fetch + XHR + axios interceptors
│   ├── context.tsx           # React context + useReducer state
│   ├── ChuckerProvider.tsx   # Root provider + modal navigator
│   ├── components/
│   │   ├── Notification.tsx  # Floating animated toast
│   │   ├── RequestItem.tsx   # List item card
│   │   ├── JsonTreeView.tsx  # Collapsible JSON tree
│   │   └── TabBar.tsx        # Internal tab bar
│   └── screens/
│       ├── ChuckerListScreen.tsx     # Main list + search + filter
│       ├── RequestDetailScreen.tsx   # Detail tabs (overview / request / response / headers)
│       └── SettingsScreen.tsx        # Settings panel
└── package.json
```

---

## License

MIT. See `LICENSE`.

---

## Author

- **Muhammad Uzair Aslam** — [@iuzairaslam](https://github.com/iuzairaslam/)

## SEO keywords

React Native network inspector, React Native HTTP inspector, Axios interceptor, fetch interceptor, XHR interceptor, API debugger, request response viewer, in-app devtools.
