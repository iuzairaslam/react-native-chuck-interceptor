// ─────────────────────────────────────────────────────────────────────────────
// react-native-chuck-interceptor — Request Detail Screen
// Full detail view: Overview, Request, Response tabs with JSON tree
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState } from 'react';
import {
  Platform,
  ScrollView,
  Share,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { ChuckerRequest } from '../types';
import { TabBar, TabItem } from '../components/TabBar';
import { JsonTreeView } from '../components/JsonTreeView';
import { ChuckerSafeAreaView } from '../components/SafeArea';
import {
  formatBytes,
  formatDuration,
  formatTime,
  isJson,
  methodColor,
  statusColor,
} from '../utils';

interface RequestDetailScreenProps {
  request: ChuckerRequest;
  onBack:  () => void;
}

const TABS: TabItem[] = [
  { key: 'overview', label: 'Overview' },
  { key: 'request',  label: 'Request'  },
  { key: 'response', label: 'Response' },
  { key: 'headers',  label: 'Headers'  },
];

export function RequestDetailScreen({ request, onBack }: RequestDetailScreenProps) {
  const [activeTab, setActiveTab] = useState<string>('overview');

  const handleShare = async () => {
    const text = buildShareText(request);
    try {
      await Share.share({ message: text, title: `${request.method} ${request.url}` });
    } catch {
      // ignore share cancellation
    }
  };

  const statusCode = request.responseCode;
  const codeColor  = request.status === 'failed'
    ? '#F44336'
    : request.status === 'pending'
    ? '#78909C'
    : statusColor(statusCode);

  return (
    <ChuckerSafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" translucent={false} />
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {request.method} {request.path}
        </Text>
        <TouchableOpacity onPress={handleShare} style={styles.shareBtn} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Text style={styles.shareText}>Share</Text>
        </TouchableOpacity>
      </View>

      {/* Status badge row */}
      <View style={styles.statusRow}>
        <View style={[styles.methodBadge, { backgroundColor: methodColor(request.method) }]}>
          <Text style={styles.methodText}>{request.method}</Text>
        </View>
        <View style={[styles.statusPill, { borderColor: codeColor }]}>
          <Text style={[styles.statusCode, { color: codeColor }]} numberOfLines={1}>
            {request.status === 'pending'
              ? 'PENDING'
              : request.status === 'failed'
              ? 'FAILED'
              : request.responseCode !== null
              ? `${request.responseCode} ${request.responseMessage ?? ''}`.trim()
              : 'COMPLETE'}
          </Text>
        </View>
        <Text style={styles.duration}>
          {formatDuration(request.duration)}
        </Text>
      </View>

      {/* Tab bar */}
      <TabBar tabs={TABS} activeKey={activeTab} onChange={setActiveTab} />

      {/* Tab content */}
      <View style={styles.tabContent}>
        {activeTab === 'overview' && <OverviewTab request={request} codeColor={codeColor} />}
        {activeTab === 'request'  && <BodyTab body={request.requestBody}  label="Request Body"  />}
        {activeTab === 'response' && <BodyTab body={request.responseBody} label="Response Body" />}
        {activeTab === 'headers'  && <HeadersTab request={request} />}
      </View>
    </ChuckerSafeAreaView>
  );
}

// ─── Overview Tab ─────────────────────────────────────────────────────────────

function OverviewTab({ request, codeColor }: { request: ChuckerRequest; codeColor: string }) {
  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
      <Section title="URL">
        <MonoText>{request.url}</MonoText>
      </Section>

      <Section title="Timing">
        <Row label="Start time"  value={formatTime(request.startedAt)} />
        <Row label="Duration"    value={formatDuration(request.duration)} />
        {request.completedAt && (
          <Row label="End time" value={formatTime(request.completedAt)} />
        )}
      </Section>

      <Section title="Response">
        <Row label="Status"       value={request.responseCode !== null ? `${request.responseCode}` : '—'} valueColor={codeColor} />
        <Row label="Message"      value={request.responseMessage ?? '—'} />
        <Row label="Content-Type" value={request.responseContentType ?? '—'} />
        <Row label="Body size"    value={formatBytes(request.responseBodySize)} />
      </Section>

      <Section title="Request">
        <Row label="Protocol"   value={request.protocol.toUpperCase()} />
        <Row label="Host"       value={request.host} />
        <Row label="Path"       value={request.path} />
        {request.queryString && (
          <Row label="Query" value={request.queryString} />
        )}
        <Row label="Body size" value={formatBytes(request.requestBodySize)} />
      </Section>

      {request.error && (
        <Section title="Error">
          <Text style={styles.errorText}>{request.error}</Text>
        </Section>
      )}
    </ScrollView>
  );
}

// ─── Body Tab ─────────────────────────────────────────────────────────────────

function BodyTab({ body, label }: { body: string | null; label: string }) {
  const [mode, setMode] = useState<'pretty' | 'raw'>('pretty');
  const hasJson = isJson(body);

  if (!body) {
    return (
      <View style={styles.emptyBody}>
        <Text style={styles.emptyBodyIcon}>📭</Text>
        <Text style={styles.emptyBodyText}>No {label}</Text>
      </View>
    );
  }

  return (
    <View style={styles.bodyContainer}>
      {hasJson && (
        <View style={styles.modeRow}>
          <TouchableOpacity
            style={[styles.modeBtn, mode === 'pretty' && styles.modeBtnActive]}
            onPress={() => setMode('pretty')}
          >
            <Text style={[styles.modeBtnText, mode === 'pretty' && styles.modeBtnTextActive]}>
              Tree
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeBtn, mode === 'raw' && styles.modeBtnActive]}
            onPress={() => setMode('raw')}
          >
            <Text style={[styles.modeBtnText, mode === 'raw' && styles.modeBtnTextActive]}>
              Raw
            </Text>
          </TouchableOpacity>
        </View>
      )}
      <View style={styles.bodyContent}>
        {hasJson && mode === 'pretty' ? (
          <JsonTreeView json={body} />
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator>
            <ScrollView showsVerticalScrollIndicator>
              <Text style={styles.rawBody}>{body}</Text>
            </ScrollView>
          </ScrollView>
        )}
      </View>
    </View>
  );
}

// ─── Headers Tab ─────────────────────────────────────────────────────────────

function HeadersTab({ request }: { request: ChuckerRequest }) {
  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
      <Section title="Request Headers">
        {Object.keys(request.requestHeaders).length === 0 ? (
          <Text style={styles.noHeaders}>No request headers</Text>
        ) : (
          Object.entries(request.requestHeaders).map(([k, v]) => (
            <HeaderRow key={k} name={k} value={v} />
          ))
        )}
      </Section>
      <Section title="Response Headers">
        {Object.keys(request.responseHeaders).length === 0 ? (
          <Text style={styles.noHeaders}>No response headers</Text>
        ) : (
          Object.entries(request.responseHeaders).map(([k, v]) => (
            <HeaderRow key={k} name={k} value={v} />
          ))
        )}
      </Section>
    </ScrollView>
  );
}

// ─── Reusable sub-components ──────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

function Row({
  label,
  value,
  valueColor,
}: {
  label:       string;
  value:       string;
  valueColor?: string;
}) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={[styles.rowValue, valueColor ? { color: valueColor } : null]} selectable>
        {value}
      </Text>
    </View>
  );
}

function MonoText({ children }: { children: string }) {
  return <Text style={styles.monoText} selectable>{children}</Text>;
}

function HeaderRow({ name, value }: { name: string; value: string }) {
  return (
    <View style={styles.headerRow}>
      <Text style={styles.headerName}>{name}</Text>
      <Text style={styles.headerValue} selectable>{value}</Text>
    </View>
  );
}

// ─── Share helper ─────────────────────────────────────────────────────────────

function buildShareText(r: ChuckerRequest): string {
  const lines: string[] = [
    `=== Chucker Network Inspector ===`,
    ``,
    `${r.method} ${r.url}`,
    `Status: ${r.responseCode ?? 'N/A'} ${r.responseMessage ?? ''}`,
    `Duration: ${r.duration !== null ? r.duration + 'ms' : '—'}`,
    ``,
    `── Request Headers ──`,
    ...Object.entries(r.requestHeaders).map(([k, v]) => `${k}: ${v}`),
  ];

  if (r.requestBody) {
    lines.push('', '── Request Body ──', r.requestBody);
  }

  lines.push(
    '',
    '── Response Headers ──',
    ...Object.entries(r.responseHeaders).map(([k, v]) => `${k}: ${v}`),
  );

  if (r.responseBody) {
    lines.push('', '── Response Body ──', r.responseBody);
  }

  if (r.error) {
    lines.push('', '── Error ──', r.error);
  }

  return lines.join('\n');
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: {
    flex:            1,
    backgroundColor: '#F7F7FA',
  },
  header: {
    flexDirection:     'row',
    alignItems:        'center',
    paddingVertical:   10,
    paddingHorizontal: 14,
    backgroundColor:   '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E7E7EE',
    gap:               8,
  },
  backBtn: {
    minWidth: 60,
  },
  backText: {
    color:      '#D97757',
    fontSize:   14,
    fontWeight: '700',
  },
  headerTitle: {
    flex:       1,
    fontSize:   14,
    fontWeight: '600',
    color:      '#303047',
    textAlign:  'center',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  shareBtn: {
    minWidth: 60,
    alignItems: 'flex-end',
  },
  shareText: {
    color:      '#D97757',
    fontSize:   14,
    fontWeight: '700',
  },
  statusRow: {
    flexDirection:     'row',
    alignItems:        'center',
    paddingHorizontal: 16,
    paddingVertical:   10,
    backgroundColor:   '#FFFFFF',
    gap:               10,
    borderBottomWidth: 1,
    borderBottomColor: '#E7E7EE',
  },
  methodBadge: {
    borderRadius:      5,
    paddingHorizontal: 8,
    paddingVertical:   3,
  },
  methodText: {
    color:      '#FFF',
    fontSize:   11,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  statusCode: {
    fontSize:   13,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  statusPill: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#F7F7FA',
  },
  duration: {
    fontSize:  13,
    color:     '#8A8A99',
    marginLeft: 'auto',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  tabContent: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding:       16,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize:      12,
    fontWeight:    '700',
    color:         '#D97757',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom:  8,
  },
  sectionBody: {
    backgroundColor: '#FFFFFF',
    borderRadius:    10,
    padding:         12,
    gap:             8,
    borderWidth: 1,
    borderColor: '#E7E7EE',
  },
  row: {
    flexDirection: 'row',
    gap:           8,
  },
  rowLabel: {
    width:      110,
    color:      '#6B6B7A',
    fontSize:   13,
    flexShrink: 0,
  },
  rowValue: {
    flex:       1,
    color:      '#303047',
    fontSize:   13,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  monoText: {
    color:      '#303047',
    fontSize:   13,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    lineHeight: 20,
  },
  headerRow: {
    paddingVertical: 4,
    gap:             2,
  },
  headerName: {
    fontSize:   12,
    color:      '#303047',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontWeight: '600',
  },
  headerValue: {
    fontSize:   12,
    color:      '#6B6B7A',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    paddingLeft: 8,
  },
  noHeaders: {
    color:     '#8A8A99',
    fontSize:  13,
    fontStyle: 'italic',
  },
  emptyBody: {
    flex:           1,
    alignItems:     'center',
    justifyContent: 'center',
  },
  emptyBodyIcon: {
    fontSize:     40,
    marginBottom: 8,
  },
  emptyBodyText: {
    color:    '#8A8A99',
    fontSize: 15,
  },
  bodyContainer: {
    flex:            1,
    backgroundColor: '#F7F7FA',
  },
  modeRow: {
    flexDirection:     'row',
    paddingHorizontal: 12,
    paddingVertical:   8,
    gap:               6,
    borderBottomWidth: 1,
    borderBottomColor: '#E7E7EE',
    backgroundColor: '#FFFFFF',
  },
  modeBtn: {
    paddingHorizontal: 14,
    paddingVertical:    5,
    borderRadius:      6,
    backgroundColor:   '#F7F7FA',
  },
  modeBtnActive: {
    backgroundColor: '#D97757',
  },
  modeBtnText: {
    fontSize:   13,
    color:      '#6B6B7A',
    fontWeight: '500',
  },
  modeBtnTextActive: {
    color: '#FFF',
  },
  bodyContent: {
    flex: 1,
  },
  rawBody: {
    color:      '#303047',
    fontSize:   12,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    padding:    12,
    lineHeight: 20,
  },
  errorText: {
    color:      '#F44336',
    fontSize:   13,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
});
