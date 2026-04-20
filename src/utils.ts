// ─────────────────────────────────────────────────────────────────────────────
// react-native-chuck-interceptor — Utilities
// ─────────────────────────────────────────────────────────────────────────────

import { ChuckerRequest } from './types';

/** Generate a random unique ID */
export function generateId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

type FormDataLike = {
  // RN FormData (undocumented): stores parts as [name, value] tuples
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _parts?: any[];
  // Standard FormData
  entries?: () => IterableIterator<[string, unknown]>;
};

function isFormData(value: unknown): value is FormDataLike {
  if (!value || typeof value !== 'object') return false;
  // In React Native, `FormData` exists and instances usually have `_parts`.
  // In some envs, it might also support `entries()`.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const v = value as any;
  return typeof v.append === 'function' && (Array.isArray(v._parts) || typeof v.entries === 'function');
}

function normalizeFormDataValue(value: unknown): unknown {
  if (value === null || value === undefined) return null;
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'object') {
    // Best effort for RN file objects: { uri, name, type }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const v = value as any;
    if (typeof v.uri === 'string') {
      return {
        uri: v.uri,
        name: typeof v.name === 'string' ? v.name : undefined,
        type: typeof v.type === 'string' ? v.type : undefined,
      };
    }
    // Blob-like
    if (typeof v.size === 'number' && typeof v.type === 'string') {
      return { blob: true, size: v.size, type: v.type };
    }
    // Fallback: attempt to JSON-stringify objects
    try {
      return JSON.parse(JSON.stringify(value));
    } catch {
      return String(value);
    }
  }
  return String(value);
}

/** Serialize FormData to a JSON-ish structure for display */
export function serializeFormData(fd: unknown): { [key: string]: unknown } | null {
  if (!isFormData(fd)) return null;

  const out: Record<string, unknown> = {};

  // Prefer standard entries() if available.
  if (typeof fd.entries === 'function') {
    try {
      for (const [k, v] of fd.entries()) {
        const normalized = normalizeFormDataValue(v);
        const existing = out[k];
        if (existing === undefined) out[k] = normalized;
        else if (Array.isArray(existing)) (existing as unknown[]).push(normalized);
        else out[k] = [existing, normalized];
      }
      return out;
    } catch {
      // fall back to _parts
    }
  }

  // React Native FormData stores parts as [name, value]
  if (Array.isArray(fd._parts)) {
    for (const part of fd._parts) {
      if (!Array.isArray(part) || part.length < 2) continue;
      const key = String(part[0]);
      const value = normalizeFormDataValue(part[1]);
      const existing = out[key];
      if (existing === undefined) out[key] = value;
      else if (Array.isArray(existing)) (existing as unknown[]).push(value);
      else out[key] = [existing, value];
    }
  }

  return out;
}

/** Parse a URL string into host, path, queryString, protocol */
export function parseUrl(url: string): {
  host: string;
  path: string;
  queryString: string;
  protocol: string;
} {
  try {
    // React Native doesn't have the browser URL API everywhere — manual parse
    const protocolMatch = url.match(/^([a-z]+):\/\//i);
    const protocol = protocolMatch ? protocolMatch[1].toLowerCase() : 'http';
    const withoutProtocol = url.replace(/^[a-z]+:\/\//i, '');
    const slashIdx = withoutProtocol.indexOf('/');
    const host =
      slashIdx === -1
        ? withoutProtocol.split('?')[0]
        : withoutProtocol.slice(0, slashIdx);
    const rest = slashIdx === -1 ? '' : withoutProtocol.slice(slashIdx);
    const qIdx = rest.indexOf('?');
    const path = qIdx === -1 ? rest : rest.slice(0, qIdx);
    const queryString = qIdx === -1 ? '' : rest.slice(qIdx + 1);
    return { host, path: path || '/', queryString, protocol };
  } catch {
    return { host: url, path: '/', queryString: '', protocol: 'http' };
  }
}

/** Convert a Headers object or plain map to a plain record */
export function headersToObject(
  headers: Headers | Record<string, string> | null | undefined,
): Record<string, string> {
  if (!headers) return {};
  if (typeof (headers as Headers).forEach === 'function') {
    const result: Record<string, string> = {};
    (headers as Headers).forEach((value, key) => {
      result[key] = value;
    });
    return result;
  }
  return headers as Record<string, string>;
}

/** Try to parse body as JSON — returns stringified pretty JSON or raw string */
export function parseBody(body: unknown): string | null {
  if (body === null || body === undefined) return null;
  const form = serializeFormData(body);
  if (form) {
    try {
      return JSON.stringify(form, null, 2);
    } catch {
      return '[FormData]';
    }
  }
  if (typeof body === 'string') {
    try {
      const parsed = JSON.parse(body);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return body;
    }
  }
  if (typeof body === 'object') {
    try {
      return JSON.stringify(body, null, 2);
    } catch {
      return String(body);
    }
  }
  return String(body);
}

/** Byte size of a UTF-8 string (works in React Native — no Blob required) */
export function byteSize(str: string | null): number {
  if (!str) return 0;
  // Accurate UTF-8 byte count without relying on Blob (unavailable in some RN envs)
  let size = 0;
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    if (code < 0x0080) size += 1;        // 1-byte (ASCII)
    else if (code < 0x0800) size += 2;   // 2-byte
    else if (code < 0xD800 || code >= 0xE000) size += 3; // 3-byte
    else {
      // Surrogate pair → 4-byte codepoint
      i++;
      size += 4;
    }
  }
  return size;
}

/** Format bytes into human-readable */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Format duration ms */
export function formatDuration(ms: number | null): string {
  if (ms === null) return '—';
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

/** Format timestamp to human readable time */
export function formatTime(ts: number): string {
  const d = new Date(ts);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

/** Color for a status code */
export function statusColor(code: number | null): string {
  if (code === null) return '#9E9E9E';
  if (code >= 500) return '#F44336'; // red
  if (code >= 400) return '#FF9800'; // orange
  if (code >= 300) return '#2196F3'; // blue
  if (code >= 200) return '#4CAF50'; // green
  return '#9E9E9E'; // grey
}

/** Method color for display */
export function methodColor(method: string): string {
  switch (method.toUpperCase()) {
    case 'GET':    return '#4CAF50';
    case 'POST':   return '#2196F3';
    case 'PUT':    return '#FF9800';
    case 'PATCH':  return '#9C27B0';
    case 'DELETE': return '#F44336';
    default:       return '#607D8B';
  }
}

/** Truncate a string */
export function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen) + '…';
}

/** Check if a string looks like JSON */
export function isJson(str: string | null): boolean {
  if (!str) return false;
  const trimmed = str.trim();
  return (
    (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
    (trimmed.startsWith('[') && trimmed.endsWith(']'))
  );
}

/** Parse JSON safely */
export function safeParseJson(str: string | null): unknown {
  if (!str) return null;
  try {
    return JSON.parse(str);
  } catch {
    return null;
  }
}

/** Get a display label for the request */
export function getRequestLabel(req: ChuckerRequest): string {
  return `${req.method} ${req.path}`;
}

/** Filter requests based on search query */
export function filterRequests(
  requests: ChuckerRequest[],
  query: string,
): ChuckerRequest[] {
  if (!query.trim()) return requests;
  const q = query.toLowerCase();
  return requests.filter(
    (r) =>
      r.url.toLowerCase().includes(q) ||
      r.method.toLowerCase().includes(q) ||
      (r.responseCode?.toString() || '').includes(q) ||
      r.host.toLowerCase().includes(q) ||
      r.path.toLowerCase().includes(q),
  );
}
