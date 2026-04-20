// ─────────────────────────────────────────────────────────────────────────────
// react-native-chuck-interceptor — Public API
// ─────────────────────────────────────────────────────────────────────────────

// Provider (wrap your app with this)
export { ChuckerProvider } from './ChuckerProvider';
export type { ChuckerProviderProps } from './ChuckerProvider';

// Interceptor (for axios or manual use)
export { ChuckerInterceptor } from './interceptor';

// Context hook (access from anywhere inside ChuckerProvider)
export { useChuckerContext } from './context';

// Types
export type {
  ChuckerRequest,
  ChuckerSettings,
  ChuckerConfig,
  ChuckerContextValue,
  ChuckerTheme,
  HttpMethod,
  NetworkRequestStatus,
} from './types';

// Utilities (exposed for custom UI / extensions)
export {
  statusColor,
  methodColor,
  formatBytes,
  formatDuration,
  formatTime,
  isJson,
  filterRequests,
} from './utils';
