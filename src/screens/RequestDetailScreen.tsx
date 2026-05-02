// ─────────────────────────────────────────────────────────────────────────────
// react-native-chuck-interceptor — Request Detail Screen
// Full detail view: Overview, Request, Response tabs with JSON tree
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState } from 'react';
import {
  Alert,
  Platform,
  ScrollView,
  Share,
  StatusBar,
  StyleSheet,
  Text,
  ToastAndroid,
  TouchableOpacity,
  View,
} from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import { ChuckerRequest } from '../types';
import { useChuckerContext } from '../context';
import { ChuckerPalette, useChuckerPalette } from '../theme';
import { TabBar, TabItem } from '../components/TabBar';
import { JsonTreeView } from '../components/JsonTreeView';
import { ChuckerSafeAreaView } from '../components/SafeArea';
import { ChevronBackIcon, ShareIcon } from '../components/ChuckerIcons';
import {
  formatBytes,
  formatDuration,
  formatTime,
  isJson,
  methodColor,
  statusColor,
} from '../utils';

const HEADER_ICON_SIZE = 19;

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
  const { settings } = useChuckerContext();
  const palette = useChuckerPalette(settings);
  const isDark = palette.bg === '#000000';

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

  const showCopiedMessage = () => {
    const message = 'Link copied to clipboard';
    if (Platform.OS === 'android') {
      ToastAndroid.show(message, ToastAndroid.SHORT);
      return;
    }
    Alert.alert('Copied', message);
  };

  const copyIfLink = (value: string) => {
    const link = extractFirstLink(value);
    if (!link) return;
    Clipboard.setString(link);
    showCopiedMessage();
  };

  return (
    <ChuckerSafeAreaView style={[styles.safe, { backgroundColor: palette.bg }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={palette.surface} translucent={false} />
      {/* Header */}
      <View style={[styles.header, { backgroundColor: palette.surface, borderBottomColor: palette.border }]}>
        <TouchableOpacity
          onPress={onBack}
          style={[styles.iconBtn, { backgroundColor: palette.chipBg, borderColor: palette.border }]}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <ChevronBackIcon color={palette.primary} size={HEADER_ICON_SIZE} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: palette.mutedText }]} numberOfLines={1}>
          {request.method} {request.path}
        </Text>
        <TouchableOpacity
          onPress={handleShare}
          style={[styles.iconBtn, { backgroundColor: palette.chipBg, borderColor: palette.border }]}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <ShareIcon color={palette.primary} size={HEADER_ICON_SIZE} />
        </TouchableOpacity>
      </View>

      {/* Status badge row */}
      <View style={[styles.statusRow, { backgroundColor: palette.surface, borderBottomColor: palette.border }]}>
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
          <Text style={[styles.duration, { color: palette.subtleText }]}>
          {formatDuration(request.duration)}
        </Text>
      </View>

      {/* Tab bar */}
      <TabBar tabs={TABS} activeKey={activeTab} onChange={setActiveTab} />

      {/* Tab content */}
      <View style={styles.tabContent}>
        {activeTab === 'overview' && (
          <OverviewTab
            request={request}
            codeColor={codeColor}
            palette={palette}
            onCopyLink={copyIfLink}
          />
        )}
        {activeTab === 'request'  && <BodyTab body={request.requestBody} label="Request Body" palette={palette} />}
        {activeTab === 'response' && <BodyTab body={request.responseBody} label="Response Body" palette={palette} />}
        {activeTab === 'headers'  && <HeadersTab request={request} palette={palette} onCopyLink={copyIfLink} />}
      </View>
    </ChuckerSafeAreaView>
  );
}

// ─── Overview Tab ─────────────────────────────────────────────────────────────

function OverviewTab({
  request,
  codeColor,
  palette,
  onCopyLink,
}: {
  request: ChuckerRequest;
  codeColor: string;
  palette: ChuckerPalette;
  onCopyLink: (value: string) => void;
}) {
  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
      <Section title="URL" palette={palette}>
        <MonoText palette={palette} onPress={() => onCopyLink(request.url)}>{request.url}</MonoText>
      </Section>

      <Section title="Timing" palette={palette}>
        <Row label="Start time" value={formatTime(request.startedAt)} palette={palette} />
        <Row label="Duration" value={formatDuration(request.duration)} palette={palette} />
        {request.completedAt && (
          <Row label="End time" value={formatTime(request.completedAt)} palette={palette} />
        )}
      </Section>

      <Section title="Response" palette={palette}>
        <Row label="Status" value={request.responseCode !== null ? `${request.responseCode}` : '—'} valueColor={codeColor} palette={palette} />
        <Row label="Message" value={request.responseMessage ?? '—'} palette={palette} />
        <Row label="Content-Type" value={request.responseContentType ?? '—'} palette={palette} />
        <Row label="Body size" value={formatBytes(request.responseBodySize)} palette={palette} />
      </Section>

      <Section title="Request" palette={palette}>
        <Row label="Protocol" value={request.protocol.toUpperCase()} palette={palette} />
        <Row label="Host" value={request.host} palette={palette} />
        <Row label="Path" value={request.path} palette={palette} />
        {request.queryString && (
          <Row label="Query" value={request.queryString} palette={palette} />
        )}
        <Row label="Body size" value={formatBytes(request.requestBodySize)} palette={palette} />
      </Section>

      {request.error && (
        <Section title="Error" palette={palette}>
          <Text style={styles.errorText}>{request.error}</Text>
        </Section>
      )}
    </ScrollView>
  );
}

// ─── Body Tab ─────────────────────────────────────────────────────────────────

function BodyTab({ body, label, palette }: { body: string | null; label: string; palette: ChuckerPalette }) {
  const [mode, setMode] = useState<'pretty' | 'raw'>('pretty');
  const hasJson = isJson(body);

  if (!body) {
    return (
      <View style={styles.emptyBody}>
        <Text style={styles.emptyBodyIcon}>📭</Text>
        <Text style={[styles.emptyBodyText, { color: palette.subtleText }]}>No {label}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.bodyContainer, { backgroundColor: palette.bg }]}>
      {hasJson && (
        <View style={[styles.modeRow, { borderBottomColor: palette.border, backgroundColor: palette.surface }]}>
          <TouchableOpacity
            style={[
              styles.modeBtn,
              { backgroundColor: palette.chipBg },
              mode === 'pretty' && { backgroundColor: palette.primary },
            ]}
            onPress={() => setMode('pretty')}
          >
            <Text style={[styles.modeBtnText, { color: palette.mutedText }, mode === 'pretty' && styles.modeBtnTextActive]}>
              Tree
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.modeBtn,
              { backgroundColor: palette.chipBg },
              mode === 'raw' && { backgroundColor: palette.primary },
            ]}
            onPress={() => setMode('raw')}
          >
            <Text style={[styles.modeBtnText, { color: palette.mutedText }, mode === 'raw' && styles.modeBtnTextActive]}>
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
              <Text style={[styles.rawBody, { color: palette.mutedText }]}>{body}</Text>
            </ScrollView>
          </ScrollView>
        )}
      </View>
    </View>
  );
}

// ─── Headers Tab ─────────────────────────────────────────────────────────────

function HeadersTab({
  request,
  palette,
  onCopyLink,
}: {
  request: ChuckerRequest;
  palette: ChuckerPalette;
  onCopyLink: (value: string) => void;
}) {
  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
      <Section title="Request Headers" palette={palette}>
        {Object.keys(request.requestHeaders).length === 0 ? (
          <Text style={[styles.noHeaders, { color: palette.subtleText }]}>No request headers</Text>
        ) : (
          Object.entries(request.requestHeaders).map(([k, v]) => (
            <HeaderRow key={k} name={k} value={v} palette={palette} onCopyLink={onCopyLink} />
          ))
        )}
      </Section>
      <Section title="Response Headers" palette={palette}>
        {Object.keys(request.responseHeaders).length === 0 ? (
          <Text style={[styles.noHeaders, { color: palette.subtleText }]}>No response headers</Text>
        ) : (
          Object.entries(request.responseHeaders).map(([k, v]) => (
            <HeaderRow key={k} name={k} value={v} palette={palette} onCopyLink={onCopyLink} />
          ))
        )}
      </Section>
    </ScrollView>
  );
}

// ─── Reusable sub-components ──────────────────────────────────────────────────

function Section({ title, children, palette }: { title: string; children: React.ReactNode; palette: ChuckerPalette }) {
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: palette.primary }]}>{title}</Text>
      <View style={[styles.sectionBody, { backgroundColor: palette.surface, borderColor: palette.border }]}>{children}</View>
    </View>
  );
}

function Row({
  label,
  value,
  valueColor,
  palette,
}: {
  label:       string;
  value:       string;
  valueColor?: string;
  palette: ChuckerPalette;
}) {
  return (
    <View style={styles.row}>
      <Text style={[styles.rowLabel, { color: palette.subtleText }]}>{label}</Text>
      <Text style={[styles.rowValue, { color: valueColor ?? palette.mutedText }]} selectable>
        {value}
      </Text>
    </View>
  );
}

function MonoText({
  children,
  palette,
  onPress,
}: {
  children: string;
  palette: ChuckerPalette;
  onPress?: () => void;
}) {
  const copyable = !!onPress;
  return (
    <TouchableOpacity disabled={!copyable} onPress={onPress} activeOpacity={0.75}>
      <Text style={[styles.monoText, { color: copyable ? palette.primary : palette.mutedText }]} selectable>
        {children}
      </Text>
    </TouchableOpacity>
  );
}

function HeaderRow({
  name,
  value,
  palette,
  onCopyLink,
}: {
  name: string;
  value: string;
  palette: ChuckerPalette;
  onCopyLink: (value: string) => void;
}) {
  const copyable = hasLink(value);
  return (
    <TouchableOpacity
      style={styles.headerRow}
      disabled={!copyable}
      onPress={() => onCopyLink(value)}
      activeOpacity={0.75}
    >
      <Text style={[styles.headerName, { color: palette.mutedText }]}>{name}</Text>
      <Text style={[styles.headerValue, { color: copyable ? palette.primary : palette.subtleText }]} selectable>{value}</Text>
    </TouchableOpacity>
  );
}

function hasLink(value: string): boolean {
  return /https?:\/\/[^\s,]+/i.test(value);
}

function extractFirstLink(value: string): string | null {
  const match = value.match(/https?:\/\/[^\s,]+/i);
  return match ? match[0] : null;
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
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  headerTitle: {
    flex:       1,
    fontSize:   13,
    fontWeight: '700',
    color:      '#303047',
    textAlign:  'center',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
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
