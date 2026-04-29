# React Native Chuck Interceptor

An **in-app network inspector for React Native**. It captures `fetch`, `XMLHttpRequest`, and Axios traffic so you can review **requests, responses, headers, JSON, and FormData** inside your app—without any native setup.

## Table of contents

- [Why this library?](#why-this-library)
- [Features](#features)
- [Requirements](#requirements)
- [Installation](#installation)
- [Quick start](#quick-start)
- [Configuration](#configuration)
- [Axios integration (recommended)](#axios-integration-recommended)
- [Open the inspector programmatically](#open-the-inspector-programmatically)
- [Context API](#context-api)
- [Types](#types)
- [Platform notes](#platform-notes)
- [License](#license)

## Why this library?

- **Debug API calls faster**: see exactly what your app sent and received (including multipart `FormData` uploads).
- **Zero native setup**: a pure JS/TS library that works on **iOS + Android**.
- **Safe defaults**: enabled only in `__DEV__` unless you explicitly opt in for release builds.

## Features

- **Automatic interception** of `fetch` and `XMLHttpRequest` (covers Axios, Apollo, Relay, etc.)
- **In-app inspector UI** (list + request detail + response detail + headers)
- **FormData support** (multipart fields + file metadata)
- **Search and filters** (URL, method, status)
- **Share** a captured request/response from the device
- **Optional persistence** via AsyncStorage (gracefully falls back to in-memory)
- **Optional local notifications** when `@notifee/react-native` is installed and permissions are granted

## Requirements

- **React Native**: \(\ge\) 0.71
- **React**: \(\ge\) 17
- **iOS**: \(\ge\) 13
- **Android**: API \(\ge\) 21

> **No native modules**: no `pod install` changes, no Android application edits, and no linking steps.

## Installation

### npm (recommended)

```bash
npm install @iuzairaslam/react-native-chuck-interceptor
# or
yarn add @iuzairaslam/react-native-chuck-interceptor
```

### GitHub Packages (optional)

Use this only if you consume the package from **GitHub Packages**.

```bash
npm login --scope=@iuzairaslam --auth-type=legacy --registry=https://npm.pkg.github.com
npm install @iuzairaslam/react-native-chuck-interceptor
```

## Quick start

Wrap your app with `ChuckerProvider`:

```tsx
// App.tsx
import { ChuckerProvider } from '@iuzairaslam/react-native-chuck-interceptor';

export default function App() {
  return (
    <ChuckerProvider>
      <YourApp />
    </ChuckerProvider>
  );
}
```

That’s it—requests made through `fetch` or XHR (and most Axios setups) will be captured automatically.

### Local example

A standard runnable React Native app lives in `example-app/`.

Run it with:

```bash
cd example-app
npm install
npx pod-install # iOS only
npm run android
# or
npm run ios
```

### Optional: persistent storage

To persist requests across app restarts, install AsyncStorage:

```bash
npm install @react-native-async-storage/async-storage
npx pod-install # iOS only
```

## Configuration

```tsx
<ChuckerProvider
  config={{
    showOnlyInDebug: true, // default: true
    showNotification: true, // default: true (requires @notifee/react-native)
    requestNotificationPermissionOnStart: true, // default: true
    maxRequests: 200, // default: 200
    hostFilter: [], // default: capture all
    theme: 'auto', // 'light' | 'dark' | 'auto'
    primaryColor: '#D97757',
    shouldCapture: ({ url, method }) => !url.includes('/health') && method !== 'OPTIONS',
  }}
>
  <YourApp />
</ChuckerProvider>
```

### Enable in release builds

```tsx
<ChuckerProvider config={{ showOnlyInDebug: false }}>
  <YourApp />
</ChuckerProvider>
```

### Host filtering

```tsx
<ChuckerProvider config={{ hostFilter: ['api.myapp.com', 'staging.myapp.com'] }}>
  <YourApp />
</ChuckerProvider>
```

## Axios integration (recommended)

Chucker already captures Axios requests because Axios ultimately uses `fetch` or XHR. If you want **more accurate timings**, you can also attach the dedicated Axios interceptors:

```tsx
import axios from 'axios';
import { ChuckerInterceptor } from '@iuzairaslam/react-native-chuck-interceptor';

const api = axios.create({ baseURL: 'https://api.example.com' });
const chucker = ChuckerInterceptor.axiosInterceptors();

api.interceptors.request.use(chucker.request.onFulfilled);
api.interceptors.response.use(chucker.response.onFulfilled, chucker.response.onRejected);
```

> If you use Axios interceptors *and* your Axios adapter still uses XHR/fetch internally, a request could appear twice. This library tags Axios requests internally so the global fetch/XHR patches can skip duplicates.

## Open the inspector programmatically

```tsx
import { useChuckerContext } from '@iuzairaslam/react-native-chuck-interceptor';

function DebugButton() {
  const { openChucker } = useChuckerContext();
  return <Button title="Open Network Inspector" onPress={openChucker} />;
}
```

## Context API

```tsx
const {
  requests,
  settings,
  isVisible,
  openChucker,
  closeChucker,
  clearRequests,
  updateSettings,
} = useChuckerContext();
```

## Types

```ts
interface ChuckerRequest {
  id: string;
  method: string;
  url: string;
  host: string;
  path: string;
  queryString: string;
  protocol: string;
  requestHeaders: Record<string, string>;
  requestBody: string | null;
  requestBodySize: number;
  responseCode: number | null;
  responseMessage: string | null;
  responseHeaders: Record<string, string>;
  responseBody: string | null;
  responseBodySize: number;
  responseContentType: string | null;
  startedAt: number;
  completedAt: number | null;
  duration: number | null;
  status: 'pending' | 'complete' | 'failed';
  error: string | null;
}
```

## Platform notes

- Works on **iOS** and **Android**
- Optional persistence requires `@react-native-async-storage/async-storage`
- Optional notifications require `@notifee/react-native`

## License

MIT. See `LICENSE`.
