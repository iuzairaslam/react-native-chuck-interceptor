// ─────────────────────────────────────────────────────────────────────────────
// react-native-chuck-interceptor — Context & State Management
// ─────────────────────────────────────────────────────────────────────────────

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useReducer,
  useRef,
} from 'react';
import { ChuckerRequest, ChuckerSettings, ChuckerContextValue, ChuckerConfig } from './types';
import { ChuckerStorage } from './storage';
import { ChuckerInterceptor } from './interceptor';
import { ChuckerLocalNotifications } from './localNotifications';

// ─── Default Settings ─────────────────────────────────────────────────────────

const DEFAULT_SETTINGS: ChuckerSettings = {
  showOnlyInDebug:      true,
  maxRequests:          200,
  showNotification:     true,
  notificationDuration: 3000,
  hostFilter:           [],
  theme:                'auto',
  primaryColor:         '#D97757',
};

// ─── State & Reducer ──────────────────────────────────────────────────────────

interface State {
  requests:  ChuckerRequest[];
  settings:  ChuckerSettings;
  isVisible: boolean;
}

type Action =
  | { type: 'ADD_REQUEST';    payload: ChuckerRequest }
  | { type: 'UPDATE_REQUEST'; id: string; update: Partial<ChuckerRequest> }
  | { type: 'SET_REQUESTS';   payload: ChuckerRequest[] }
  | { type: 'CLEAR_REQUESTS' }
  | { type: 'SET_VISIBLE';    visible: boolean }
  | { type: 'UPDATE_SETTINGS'; settings: Partial<ChuckerSettings> };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'ADD_REQUEST': {
      const newRequests = [action.payload, ...state.requests].slice(
        0,
        state.settings.maxRequests,
      );
      return { ...state, requests: newRequests };
    }
    case 'UPDATE_REQUEST': {
      const requests = state.requests.map((r) =>
        r.id === action.id ? { ...r, ...action.update } : r,
      );
      return { ...state, requests };
    }
    case 'SET_REQUESTS':
      return { ...state, requests: action.payload };
    case 'CLEAR_REQUESTS':
      return { ...state, requests: [] };
    case 'SET_VISIBLE':
      return { ...state, isVisible: action.visible };
    case 'UPDATE_SETTINGS':
      return {
        ...state,
        settings: { ...state.settings, ...action.settings },
      };
    default:
      return state;
  }
}

// ─── Context ─────────────────────────────────────────────────────────────────

export const ChuckerContext = createContext<ChuckerContextValue>({
  requests:       [],
  settings:       DEFAULT_SETTINGS,
  isVisible:      false,
  openChucker:    () => {},
  closeChucker:   () => {},
  clearRequests:  () => {},
  updateSettings: () => {},
});

export function useChuckerContext(): ChuckerContextValue {
  return useContext(ChuckerContext);
}

// ─── Provider ─────────────────────────────────────────────────────────────────

interface ChuckerStateProviderProps {
  children: React.ReactNode;
  config?:  ChuckerConfig;
}

export function ChuckerStateProvider({
  children,
  config = {},
}: ChuckerStateProviderProps) {
  const initialSettings: ChuckerSettings = {
    ...DEFAULT_SETTINGS,
    showOnlyInDebug:
      config.showOnlyInDebug !== undefined
        ? config.showOnlyInDebug
        : DEFAULT_SETTINGS.showOnlyInDebug,
    maxRequests:          config.maxRequests          ?? DEFAULT_SETTINGS.maxRequests,
    showNotification:     config.showNotification     ?? DEFAULT_SETTINGS.showNotification,
    notificationDuration: config.notificationDuration ?? DEFAULT_SETTINGS.notificationDuration,
    hostFilter:           config.hostFilter           ?? DEFAULT_SETTINGS.hostFilter,
    theme:                config.theme                ?? DEFAULT_SETTINGS.theme,
    primaryColor:         config.primaryColor         ?? DEFAULT_SETTINGS.primaryColor,
  };

  const [state, dispatch] = useReducer(reducer, {
    requests:  [],
    settings:  initialSettings,
    isVisible: false,
  });

  const settingsRef = useRef<ChuckerSettings>(initialSettings);
  useEffect(() => {
    settingsRef.current = state.settings;
  }, [state.settings]);

  // Cache latest request snapshots for notification updates
  const requestCacheRef = useRef<Map<string, ChuckerRequest>>(new Map());

  // ─── Load persisted data ────────────────────────────────────────────────
  useEffect(() => {
    Promise.all([
      ChuckerStorage.loadRequests(),
      ChuckerStorage.loadSettings(),
    ]).then(([requests, savedSettings]) => {
      if (requests.length > 0) {
        dispatch({ type: 'SET_REQUESTS', payload: requests });
      }
      if (Object.keys(savedSettings).length > 0) {
        dispatch({ type: 'UPDATE_SETTINGS', settings: savedSettings });
      }
    });
  }, []);

  // ─── Persist requests on change ─────────────────────────────────────────
  useEffect(() => {
    ChuckerStorage.saveRequests(state.requests);
  }, [state.requests]);

  // ─── Install interceptor ─────────────────────────────────────────────────
  useEffect(() => {
    // Don't install if showOnlyInDebug and not in dev
    if (state.settings.showOnlyInDebug && !__DEV__) return;

    ChuckerInterceptor.install(
      (request: ChuckerRequest) => {
        dispatch({ type: 'ADD_REQUEST', payload: request });
        requestCacheRef.current.set(request.id, request);
        // Only notify when finished; avoid leaving a "pending" notification behind.
        if (settingsRef.current.showNotification && request.status !== 'pending') {
          ChuckerLocalNotifications.upsertRequestNotification(request);
        }
      },
      (id: string, update: Partial<ChuckerRequest>) => {
        dispatch({ type: 'UPDATE_REQUEST', id, update });
        const existing = requestCacheRef.current.get(id);
        if (existing) {
          const merged = { ...existing, ...update } as ChuckerRequest;
          requestCacheRef.current.set(id, merged);
          // Only display/update OS notification once the request completes/fails.
          if (settingsRef.current.showNotification && merged.status !== 'pending') {
            ChuckerLocalNotifications.upsertRequestNotification(merged);
          }
        }
      },
      state.settings,
      { shouldCapture: config.shouldCapture },
    );

    return () => {
      ChuckerInterceptor.uninstall();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.settings.showOnlyInDebug, state.settings.hostFilter.join(',')]);

  // ─── Sync interceptor settings ───────────────────────────────────────────
  useEffect(() => {
    ChuckerInterceptor.updateSettings(state.settings);
  }, [state.settings]);

  // ─── Public actions ──────────────────────────────────────────────────────
  const openChucker = useCallback(
    () => dispatch({ type: 'SET_VISIBLE', visible: true }),
    [],
  );
  const closeChucker = useCallback(
    () => dispatch({ type: 'SET_VISIBLE', visible: false }),
    [],
  );
  const clearRequests = useCallback(() => {
    dispatch({ type: 'CLEAR_REQUESTS' });
    ChuckerStorage.clearRequests();
  }, []);

  const updateSettings = useCallback((settings: Partial<ChuckerSettings>) => {
    dispatch({ type: 'UPDATE_SETTINGS', settings });
    ChuckerStorage.saveSettings({ ...state.settings, ...settings });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.settings]);

  const value: ChuckerContextValue = {
    requests:       state.requests,
    settings:       state.settings,
    isVisible:      state.isVisible,
    openChucker,
    closeChucker,
    clearRequests,
    updateSettings,
  };

  return (
    <ChuckerContext.Provider value={value}>
      {children}
    </ChuckerContext.Provider>
  );
}
