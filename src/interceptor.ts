// ─────────────────────────────────────────────────────────────────────────────
// react-native-chuck-interceptor — Network Interceptor
// Patches global `fetch` and `XMLHttpRequest` to capture all HTTP traffic.
// ─────────────────────────────────────────────────────────────────────────────

import { ChuckerRequest, ChuckerSettings } from './types';
import {
  generateId,
  parseUrl,
  headersToObject,
  parseBody,
  serializeFormData,
  byteSize,
} from './utils';

// When using the built-in axios interceptors, we mark the request with this header
// so the underlying fetch/XHR patch can skip capturing the same call twice.
const CHUCKER_CAPTURED_HEADER = 'x-chucker-captured';

function hasChuckerCapturedHeader(headers: Record<string, string> | null | undefined): boolean {
  if (!headers) return false;
  for (const k of Object.keys(headers)) {
    if (k.toLowerCase() === CHUCKER_CAPTURED_HEADER) return headers[k] === '1';
  }
  return false;
}

type OnRequestCallback = (request: ChuckerRequest) => void;
type OnUpdateCallback  = (id: string, update: Partial<ChuckerRequest>) => void;

interface InterceptorState {
  onRequest: OnRequestCallback | null;
  onUpdate:  OnUpdateCallback  | null;
  settings:  ChuckerSettings;
  isPatched: boolean;
  originalFetch: typeof fetch | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  originalXHROpen: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  originalXHRSend: any;
}

const state: InterceptorState = {
  onRequest:       null,
  onUpdate:        null,
  settings:        {
    showOnlyInDebug:      true,
    maxRequests:          200,
    showNotification:     true,
    notificationDuration: 3000,
    hostFilter:           [],
  },
  isPatched:       false,
  originalFetch:   null,
  originalXHROpen: null,
  originalXHRSend: null,
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function shouldCapture(url: string): boolean {
  const { hostFilter } = state.settings;
  if (!hostFilter || hostFilter.length === 0) return true;
  return hostFilter.some((h) => url.includes(h));
}

// Best-effort dedupe to prevent the same underlying network call being captured
// twice (e.g. when fetch is polyfilled via XHR, or when multiple layers are used).
const DEDUPE_WINDOW_MS = 200;
const DEDUPE_BUCKET_MS = 50;
const recentKeys = new Map<string, number>();

function cleanupRecent(now: number) {
  for (const [k, ts] of recentKeys) {
    if (now - ts > DEDUPE_WINDOW_MS) recentKeys.delete(k);
  }
}

function shouldDedupe(method: string, url: string, bodySize: number, startedAt: number): boolean {
  cleanupRecent(startedAt);
  const bucket = Math.floor(startedAt / DEDUPE_BUCKET_MS);
  const key = `${method}|${url}|${bodySize}|${bucket}`;
  if (recentKeys.has(key)) return true;
  recentKeys.set(key, startedAt);
  return false;
}

// ─── Fetch Patch ─────────────────────────────────────────────────────────────

function patchFetch(): void {
  if (!globalThis.fetch) return;
  state.originalFetch = globalThis.fetch;

  globalThis.fetch = async function chuckerFetch(
    input: RequestInfo | URL,
    init?: RequestInit,
  ): Promise<Response> {
    const url =
      typeof input === 'string'
        ? input
        : input instanceof URL
        ? input.toString()
        : (input as Request).url;

    if (!shouldCapture(url)) {
      return state.originalFetch!(input, init);
    }

    const method = (
      init?.method ||
      (input instanceof Request ? input.method : 'GET')
    ).toUpperCase();

    const requestHeaders = headersToObject(
      (init?.headers as Record<string, string>) ||
        (input instanceof Request
          ? headersToObject(input.headers)
          : {}),
    );

    // If axios interceptors already captured this call, skip fetch-layer capture.
    if (requestHeaders[CHUCKER_CAPTURED_HEADER] === '1') {
      return state.originalFetch!(input, init);
    }

    let requestBodyStr: string | null = null;
    if (init?.body) {
      if (typeof init.body === 'string') {
        requestBodyStr = init.body;
      } else if (init.body instanceof FormData) {
        const serialized = serializeFormData(init.body);
        requestBodyStr = serialized ? JSON.stringify(serialized) : '[FormData]';
      } else if (init.body instanceof Blob) {
        requestBodyStr = `[Blob ${init.body.size}B]`;
      } else {
        try {
          requestBodyStr = JSON.stringify(init.body);
        } catch {
          requestBodyStr = String(init.body);
        }
      }
    }

    const { host, path, queryString, protocol } = parseUrl(url);
    const id        = generateId();
    const startedAt = Date.now();

    if (shouldDedupe(method, url, byteSize(requestBodyStr), startedAt)) {
      return state.originalFetch!(input, init);
    }

    const entry: ChuckerRequest = {
      id,
      method,
      url,
      host,
      path,
      queryString,
      protocol,
      requestHeaders,
      requestBody:      parseBody(requestBodyStr),
      requestBodySize:  byteSize(requestBodyStr),
      responseCode:     null,
      responseMessage:  null,
      responseHeaders:  {},
      responseBody:     null,
      responseBodySize: 0,
      startedAt,
      completedAt:      null,
      duration:         null,
      status:           'pending',
      error:            null,
      responseContentType: null,
    };

    state.onRequest?.(entry);

    try {
      const response = await state.originalFetch!(input, init);
      const cloned    = response.clone();
      const completedAt = Date.now();

      let responseBody: string | null = null;
      try {
        responseBody = await cloned.text();
      } catch {
        responseBody = null;
      }

      const responseHeaders = headersToObject(response.headers);
      const contentType     = response.headers.get('content-type') || null;

      state.onUpdate?.(id, {
        responseCode:        response.status,
        responseMessage:     response.statusText,
        responseHeaders,
        responseBody:        parseBody(responseBody),
        responseBodySize:    byteSize(responseBody),
        responseContentType: contentType,
        completedAt,
        duration:            completedAt - startedAt,
        status:              'complete',
      });

      return response;
    } catch (err: unknown) {
      const completedAt = Date.now();
      const errMsg = err instanceof Error ? err.message : String(err);
      state.onUpdate?.(id, {
        completedAt,
        duration: completedAt - startedAt,
        status:   'failed',
        error:    errMsg,
      });
      throw err;
    }
  };
}

// ─── XMLHttpRequest Patch ────────────────────────────────────────────────────

function patchXHR(): void {
  if (typeof XMLHttpRequest === 'undefined') return;

  const OriginalXHR      = XMLHttpRequest;
  state.originalXHROpen  = OriginalXHR.prototype.open;
  state.originalXHRSend  = OriginalXHR.prototype.send;

  // We store Chucker metadata on the XHR instance via a symbol
  const META = Symbol('chuckerMeta');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  OriginalXHR.prototype.open = function (this: any, method: string, url: string, ...rest: any[]) {
    this[META] = {
      method: method.toUpperCase(),
      url,
      requestHeaders: {} as Record<string, string>,
    };
    return state.originalXHROpen.call(this, method, url, ...rest);
  };

  // Capture setRequestHeader
  const origSetHeader = OriginalXHR.prototype.setRequestHeader;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  OriginalXHR.prototype.setRequestHeader = function (this: any, name: string, value: string) {
    if (this[META]) {
      this[META].requestHeaders[name] = value;
    }
    return origSetHeader.call(this, name, value);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  OriginalXHR.prototype.send = function (this: any, body?: Document | XMLHttpRequestBodyInit | null) {
    const meta = this[META];
    if (!meta || !shouldCapture(meta.url)) {
      return state.originalXHRSend.call(this, body);
    }

    // If axios interceptors already captured this call, skip XHR-layer capture.
    if (hasChuckerCapturedHeader(meta.requestHeaders)) {
      return state.originalXHRSend.call(this, body);
    }

    const { host, path, queryString, protocol } = parseUrl(meta.url);
    const id        = generateId();
    const startedAt = Date.now();

    let requestBodyStr: string | null = null;
    if (body !== null && body !== undefined) {
      if (typeof body === 'string') requestBodyStr = body;
      else if (body instanceof FormData) {
        const serialized = serializeFormData(body);
        requestBodyStr = serialized ? JSON.stringify(serialized) : '[FormData]';
      }
      else requestBodyStr = String(body);
    }

    if (shouldDedupe(meta.method, meta.url, byteSize(requestBodyStr), startedAt)) {
      return state.originalXHRSend.call(this, body);
    }

    const entry: ChuckerRequest = {
      id,
      method:           meta.method,
      url:              meta.url,
      host,
      path,
      queryString,
      protocol,
      requestHeaders:   meta.requestHeaders,
      requestBody:      parseBody(requestBodyStr),
      requestBodySize:  byteSize(requestBodyStr),
      responseCode:     null,
      responseMessage:  null,
      responseHeaders:  {},
      responseBody:     null,
      responseBodySize: 0,
      startedAt,
      completedAt:      null,
      duration:         null,
      status:           'pending',
      error:            null,
      responseContentType: null,
    };

    state.onRequest?.(entry);

    this.addEventListener('load', () => {
      const completedAt = Date.now();
      const rawHeaders  = this.getAllResponseHeaders();
      const responseHeaders: Record<string, string> = {};
      rawHeaders.split('\r\n').forEach((line: string) => {
        const [k, ...v] = line.split(': ');
        if (k) responseHeaders[k.toLowerCase()] = v.join(': ');
      });

      const responseBody = typeof this.responseText === 'string'
        ? this.responseText
        : null;

      state.onUpdate?.(id, {
        responseCode:        this.status,
        responseMessage:     this.statusText,
        responseHeaders,
        responseBody:        parseBody(responseBody),
        responseBodySize:    byteSize(responseBody),
        responseContentType: this.getResponseHeader('content-type'),
        completedAt,
        duration:            completedAt - startedAt,
        status:              'complete',
      });
    });

    this.addEventListener('error', () => {
      const completedAt = Date.now();
      state.onUpdate?.(id, {
        completedAt,
        duration: completedAt - startedAt,
        status:   'failed',
        error:    'Network error',
      });
    });

    this.addEventListener('timeout', () => {
      const completedAt = Date.now();
      state.onUpdate?.(id, {
        completedAt,
        duration: completedAt - startedAt,
        status:   'failed',
        error:    'Request timed out',
      });
    });

    return state.originalXHRSend.call(this, body);
  };
}

// ─── Axios Interceptor Helper ─────────────────────────────────────────────────

/**
 * Returns an axios interceptor pair you can plug in manually:
 *
 * ```ts
 * const { request, response } = ChuckerInterceptor.axiosInterceptors();
 * axios.interceptors.request.use(request.onFulfilled);
 * axios.interceptors.response.use(response.onFulfilled, response.onRejected);
 * ```
 */
function createAxiosInterceptors() {
  const pendingMap = new Map<string, { id: string; startedAt: number }>();

  const request = {
    onFulfilled: (config: Record<string, unknown>) => {
      const url    = String(config.url || '');
      const method = String(config.method || 'GET').toUpperCase();
      if (!shouldCapture(url)) return config;

      // Mark so fetch/XHR patches can skip capturing the same request again.
      // Axios v1 may use `AxiosHeaders` (has `.set()`); older versions use plain objects.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const hdrs: any = (config as any).headers || {};
      if (typeof hdrs.set === 'function') {
        hdrs.set(CHUCKER_CAPTURED_HEADER, '1');
        hdrs.set('X-Chucker-Captured', '1');
      } else if (typeof hdrs === 'object' && hdrs) {
        hdrs[CHUCKER_CAPTURED_HEADER] = '1';
        hdrs['X-Chucker-Captured'] = '1';
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (config as any).headers = hdrs;

      const { host, path, queryString, protocol } = parseUrl(url);
      const id        = generateId();
      const startedAt = Date.now();

      // stash so response handler can look it up
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (config as any).__chuckerId = id;

      const requestHeaders = headersToObject(
        config.headers as Record<string, string>,
      );

      const entry: ChuckerRequest = {
        id, method, url, host, path, queryString, protocol,
        requestHeaders,
        requestBody:      parseBody(config.data as string),
        requestBodySize:  byteSize(config.data as string),
        responseCode:     null, responseMessage: null,
        responseHeaders:  {}, responseBody: null, responseBodySize: 0,
        startedAt, completedAt: null, duration: null,
        status: 'pending', error: null, responseContentType: null,
      };

      state.onRequest?.(entry);
      pendingMap.set(id, { id, startedAt });
      return config;
    },
  };

  const response = {
    onFulfilled: (res: Record<string, unknown>) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const id = (res.config as any)?.__chuckerId;
      if (!id) return res;
      const pending     = pendingMap.get(id);
      const completedAt = Date.now();
      const duration    = pending ? completedAt - pending.startedAt : null;

      const responseBody = typeof res.data === 'string'
        ? res.data
        : JSON.stringify(res.data);

      state.onUpdate?.(id, {
        responseCode:        (res as Record<string, unknown>).status as number,
        responseMessage:     (res as Record<string, unknown>).statusText as string,
        responseHeaders:     headersToObject((res as Record<string, unknown>).headers as Record<string, string>),
        responseBody:        parseBody(responseBody),
        responseBodySize:    byteSize(responseBody),
        responseContentType: ((res as Record<string, unknown>).headers as Record<string, string>)?.['content-type'] || null,
        completedAt,
        duration,
        status: 'complete',
      });
      pendingMap.delete(id);
      return res;
    },
    onRejected: (error: unknown) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const id = (error as any)?.config?.__chuckerId;
      if (id) {
        const pending     = pendingMap.get(id);
        const completedAt = Date.now();

        // Axios puts server responses on `error.response` for 4xx/5xx
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const resp = (error as any)?.response;
        const respStatus: number | null = resp?.status ?? null;
        const respStatusText: string | null = resp?.statusText ?? null;
        const respHeaders: Record<string, string> =
          resp?.headers ? headersToObject(resp.headers as Record<string, string>) : {};

        let respBodyStr: string | null = null;
        try {
          if (resp && 'data' in resp) {
            const data = resp.data;
            respBodyStr = typeof data === 'string' ? data : JSON.stringify(data);
          }
        } catch {
          respBodyStr = null;
        }

        const contentType =
          respHeaders['content-type'] ||
          respHeaders['Content-Type'] ||
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (resp?.headers as any)?.['content-type'] ||
          null;

        state.onUpdate?.(id, {
          completedAt,
          duration: pending ? completedAt - pending.startedAt : null,
          status:   'failed',
          error:    (error instanceof Error ? error.message : String(error)),
          // Include response info if available (e.g. 4xx/5xx)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          responseCode: respStatus,
          responseMessage: respStatusText,
          responseHeaders: respHeaders,
          responseBody: respBodyStr ? parseBody(respBodyStr) : null,
          responseBodySize: respBodyStr ? byteSize(respBodyStr) : 0,
          responseContentType: contentType,
        });
        pendingMap.delete(id);
      }
      throw error;
    },
  };

  return { request, response };
}

// ─── Public API ───────────────────────────────────────────────────────────────

export const ChuckerInterceptor = {
  /**
   * Attach the interceptor. Called automatically by ChuckerProvider.
   */
  install(
    onRequest: OnRequestCallback,
    onUpdate:  OnUpdateCallback,
    settings:  ChuckerSettings,
  ): void {
    state.onRequest = onRequest;
    state.onUpdate  = onUpdate;
    state.settings  = settings;

    if (state.isPatched) return;
    state.isPatched = true;

    patchFetch();
    patchXHR();
  },

  /**
   * Remove patches and restore originals.
   */
  uninstall(): void {
    if (!state.isPatched) return;

    if (state.originalFetch) {
      globalThis.fetch    = state.originalFetch;
      state.originalFetch = null;
    }

    if (
      typeof XMLHttpRequest !== 'undefined' &&
      state.originalXHROpen
    ) {
      XMLHttpRequest.prototype.open = state.originalXHROpen;
      XMLHttpRequest.prototype.send = state.originalXHRSend;
      state.originalXHROpen         = null;
      state.originalXHRSend         = null;
    }

    state.isPatched  = false;
    state.onRequest  = null;
    state.onUpdate   = null;
  },

  /**
   * Update settings on the interceptor (e.g. host filter).
   */
  updateSettings(settings: Partial<ChuckerSettings>): void {
    state.settings = { ...state.settings, ...settings };
  },

  /**
   * Get axios-compatible interceptors. Use when axios does NOT use fetch
   * underneath and you want accurate per-request timing.
   *
   * @example
   * const chucker = ChuckerInterceptor.axiosInterceptors();
   * axiosInstance.interceptors.request.use(chucker.request.onFulfilled);
   * axiosInstance.interceptors.response.use(
   *   chucker.response.onFulfilled,
   *   chucker.response.onRejected,
   * );
   */
  axiosInterceptors: createAxiosInterceptors,
};
