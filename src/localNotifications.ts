// ─────────────────────────────────────────────────────────────────────────────
// react-native-chuck-interceptor — Local Notifications (optional)
// Uses @notifee/react-native when available. No-ops otherwise.
// ─────────────────────────────────────────────────────────────────────────────

import type { ChuckerRequest } from './types';

// Some consuming apps don't include Node typings; keep `require()` typed locally.
declare const require: (moduleName: string) => unknown;

type Unsubscribe = () => void;

type NotifeeModule = {
  default: {
    requestPermission: () => Promise<unknown>;
    getNotificationSettings: () => Promise<{ authorizationStatus?: number }>;
    createChannel: (c: { id: string; name: string; importance?: number }) => Promise<string>;
    displayNotification: (n: Record<string, unknown>) => Promise<string>;
    onForegroundEvent: (
      listener: (event: { type: number; detail: { notification?: { data?: Record<string, string> } } }) => void,
    ) => Unsubscribe;
    getInitialNotification: () => Promise<{ notification?: { data?: Record<string, string> } } | null>;
  };
  EventType?: { PRESS?: number };
  AuthorizationStatus?: { AUTHORIZED?: number; PROVISIONAL?: number };
  AndroidImportance?: { DEFAULT?: number };
};

function loadNotifee(): NotifeeModule | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require('@notifee/react-native') as NotifeeModule;
  } catch {
    return null;
  }
}

function isAuthorized(settings: { authorizationStatus?: number } | null, mod: NotifeeModule): boolean {
  const status = settings?.authorizationStatus;
  const AUTH = mod.AuthorizationStatus?.AUTHORIZED;
  const PROV = mod.AuthorizationStatus?.PROVISIONAL;
  return status === AUTH || status === PROV;
}

const CHANNEL_ID = 'chucker_requests';

const cache = new Map<string, ChuckerRequest>();
let channelReady: Promise<string> | null = null;

async function ensureChannel(mod: NotifeeModule): Promise<string> {
  if (channelReady) return channelReady;
  channelReady = mod.default.createChannel({
    id: CHANNEL_ID,
    name: 'Network requests',
    importance: mod.AndroidImportance?.DEFAULT,
  });
  return channelReady;
}

function buildTitle(r: ChuckerRequest): string {
  const status =
    r.status === 'pending'
      ? 'Pending…'
      : r.status === 'failed'
      ? 'Failed'
      : r.responseCode !== null
      ? String(r.responseCode)
      : 'Complete';
  return `${r.method} · ${status}`;
}

function buildBody(r: ChuckerRequest): string {
  const url = r.host + r.path;
  return url.length > 140 ? `${url.slice(0, 137)}…` : url;
}

export const ChuckerLocalNotifications = {
  /**
   * Call once on app start (e.g. inside ChuckerProvider) to request permission.
   * If already granted/denied, iOS will not re-prompt.
   */
  async requestPermissionOnAppStart(): Promise<void> {
    const mod = loadNotifee();
    if (!mod) return;
    try {
      await mod.default.requestPermission();
    } catch {
      // ignore
    }
  },

  /**
   * Subscribe to notification presses. On press, calls `onOpenChucker`.
   * Also handles cold-start via initial notification.
   */
  subscribeToPresses(onOpenChucker: () => void): Unsubscribe {
    const mod = loadNotifee();
    if (!mod) return () => {};

    // Cold start
    mod.default
      .getInitialNotification()
      .then((initial) => {
        const data = initial?.notification?.data;
        if (data?.chucker === '1') onOpenChucker();
      })
      .catch(() => {});

    const PRESS = mod.EventType?.PRESS;
    return mod.default.onForegroundEvent((event) => {
      if (PRESS !== undefined && event.type !== PRESS) return;
      const data = event.detail?.notification?.data;
      if (data?.chucker === '1') onOpenChucker();
    });
  },

  /**
   * Show/update a local notification for a request.
   * IMPORTANT: This will ONLY display if permission is already granted.
   * It will NOT prompt for permission.
   */
  async upsertRequestNotification(request: ChuckerRequest): Promise<void> {
    const mod = loadNotifee();
    if (!mod) return;

    let settings: { authorizationStatus?: number } | null = null;
    try {
      settings = await mod.default.getNotificationSettings();
    } catch {
      settings = null;
    }

    if (!isAuthorized(settings, mod)) return;

    const channelId = await ensureChannel(mod);
    cache.set(request.id, request);

    try {
      await mod.default.displayNotification({
        id: request.id,
        title: buildTitle(request),
        body: buildBody(request),
        data: { chucker: '1', requestId: request.id },
        android: {
          channelId,
          pressAction: { id: 'open_chucker' },
          smallIcon: 'ic_launcher',
        },
        ios: {
          foregroundPresentationOptions: {
            alert: true,
            badge: false,
            sound: false,
          },
        },
      });
    } catch {
      // ignore
    }
  },
};

