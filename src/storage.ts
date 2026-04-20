// ─────────────────────────────────────────────────────────────────────────────
// react-native-chuck-interceptor — Storage Layer
// Wraps @react-native-async-storage/async-storage
// ─────────────────────────────────────────────────────────────────────────────

import { ChuckerRequest, ChuckerSettings } from './types';

const REQUESTS_KEY = '@chucker/requests';
const SETTINGS_KEY = '@chucker/settings';

// Lazy-load AsyncStorage so the package doesn't crash if it's not installed
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _AsyncStorage: any = null;

async function getStorage() {
  if (_AsyncStorage) return _AsyncStorage;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    _AsyncStorage = require('@react-native-async-storage/async-storage').default;
  } catch {
    console.warn(
      '[react-native-chuck-interceptor] @react-native-async-storage/async-storage is not installed. ' +
      'Requests will not be persisted across app restarts. ' +
      'Run: npm install @react-native-async-storage/async-storage',
    );
    _AsyncStorage = null;
  }
  return _AsyncStorage;
}

export const ChuckerStorage = {
  async loadRequests(): Promise<ChuckerRequest[]> {
    try {
      const storage = await getStorage();
      if (!storage) return [];
      const raw = await storage.getItem(REQUESTS_KEY);
      if (!raw) return [];
      return JSON.parse(raw) as ChuckerRequest[];
    } catch {
      return [];
    }
  },

  async saveRequests(requests: ChuckerRequest[]): Promise<void> {
    try {
      const storage = await getStorage();
      if (!storage) return;
      await storage.setItem(REQUESTS_KEY, JSON.stringify(requests));
    } catch {
      // silently ignore storage errors
    }
  },

  async clearRequests(): Promise<void> {
    try {
      const storage = await getStorage();
      if (!storage) return;
      await storage.removeItem(REQUESTS_KEY);
    } catch {}
  },

  async loadSettings(): Promise<Partial<ChuckerSettings>> {
    try {
      const storage = await getStorage();
      if (!storage) return {};
      const raw = await storage.getItem(SETTINGS_KEY);
      if (!raw) return {};
      return JSON.parse(raw) as Partial<ChuckerSettings>;
    } catch {
      return {};
    }
  },

  async saveSettings(settings: ChuckerSettings): Promise<void> {
    try {
      const storage = await getStorage();
      if (!storage) return;
      await storage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch {}
  },
};
