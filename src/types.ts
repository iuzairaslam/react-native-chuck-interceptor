// ─────────────────────────────────────────────────────────────────────────────
// react-native-chuck-interceptor — Core Types
// ─────────────────────────────────────────────────────────────────────────────

export type HttpMethod =
  | 'GET'
  | 'POST'
  | 'PUT'
  | 'PATCH'
  | 'DELETE'
  | 'HEAD'
  | 'OPTIONS'
  | 'CONNECT'
  | 'TRACE'
  | string;

export type NetworkRequestStatus = 'pending' | 'complete' | 'failed';

export interface ChuckerRequestHeaders {
  [key: string]: string;
}

export interface ChuckerResponseHeaders {
  [key: string]: string;
}

export interface ChuckerRequest {
  /** Unique identifier for this request */
  id: string;

  /** HTTP method (GET, POST, etc.) */
  method: HttpMethod;

  /** Full URL */
  url: string;

  /** Parsed hostname */
  host: string;

  /** Parsed path */
  path: string;

  /** Query string (if any) */
  queryString: string;

  /** Request headers */
  requestHeaders: ChuckerRequestHeaders;

  /** Request body (stringified) */
  requestBody: string | null;

  /** Response status code */
  responseCode: number | null;

  /** Response status text */
  responseMessage: string | null;

  /** Response headers */
  responseHeaders: ChuckerResponseHeaders;

  /** Response body (stringified) */
  responseBody: string | null;

  /** Size of request body in bytes */
  requestBodySize: number;

  /** Size of response body in bytes */
  responseBodySize: number;

  /** Timestamp when request was started (ms since epoch) */
  startedAt: number;

  /** Timestamp when response was received */
  completedAt: number | null;

  /** Duration in milliseconds */
  duration: number | null;

  /** Current status of this entry */
  status: NetworkRequestStatus;

  /** Whether request errored out */
  error: string | null;

  /** Content type of the response */
  responseContentType: string | null;

  /** Protocol (http / https) */
  protocol: string;
}

export interface ChuckerSettings {
  /** Only show Chucker in __DEV__ mode (default: true) */
  showOnlyInDebug: boolean;

  /** Max number of requests to keep in memory/storage */
  maxRequests: number;

  /** Show floating notification on each request */
  showNotification: boolean;

  /** Notification auto-dismiss duration in ms */
  notificationDuration: number;

  /** Filter requests by host (empty = show all) */
  hostFilter: string[];
}

export type ChuckerTheme = 'light' | 'dark' | 'auto';

export interface ChuckerConfig {
  /** Show only in __DEV__ mode. Default: true */
  showOnlyInDebug?: boolean;

  /** Max requests stored. Default: 200 */
  maxRequests?: number;

  /** Show floating notification per request. Default: true */
  showNotification?: boolean;

  /** Auto-dismiss notification ms. Default: 3000 */
  notificationDuration?: number;

  /**
   * Ask notification permission on app start. Default: true.
   * This is only used for local notifications (requires @notifee/react-native).
   */
  requestNotificationPermissionOnStart?: boolean;

  /** Only capture requests whose URL contains one of these strings */
  hostFilter?: string[];

  /** UI color scheme. Default: 'auto' */
  theme?: ChuckerTheme;
}

export interface ChuckerContextValue {
  requests: ChuckerRequest[];
  settings: ChuckerSettings;
  isVisible: boolean;
  openChucker: () => void;
  closeChucker: () => void;
  clearRequests: () => void;
  updateSettings: (s: Partial<ChuckerSettings>) => void;
}
