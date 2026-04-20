// ─────────────────────────────────────────────────────────────────────────────
// react-native-chuck-interceptor — Request List Item
// ─────────────────────────────────────────────────────────────────────────────

import React from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { ChuckerRequest } from '../types';
import {
  formatDuration,
  formatTime,
  methodColor,
  statusColor,
  truncate,
} from '../utils';

interface RequestItemProps {
  request: ChuckerRequest;
  onPress: (request: ChuckerRequest) => void;
}

export function RequestItem({ request, onPress }: RequestItemProps) {
  const isPending = request.status === 'pending';
  const isFailed  = request.status === 'failed';

  const codeColor = isPending
    ? '#78909C'
    : isFailed
    ? '#F44336'
    : statusColor(request.responseCode);

  const codeText = isPending
    ? '···'
    : isFailed
    ? 'ERR'
    : String(request.responseCode ?? '—');

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => onPress(request)}
      activeOpacity={0.75}
    >
      <View style={styles.body}>
        {/* Top row: method badge + status + time */}
        <View style={styles.topRow}>
          <View style={[styles.methodBadge, { backgroundColor: methodColor(request.method) }]}>
            <Text style={styles.methodText}>{request.method}</Text>
          </View>

          <View style={[styles.statusPill, { borderColor: codeColor }]}>
            <Text style={[styles.statusCode, { color: codeColor }]}>
              {codeText}
            </Text>
          </View>

          <Text style={styles.duration}>
            {formatDuration(request.duration)}
          </Text>

          <Text style={styles.time}>{formatTime(request.startedAt)}</Text>
        </View>

        {/* Host */}
        <Text style={styles.host} numberOfLines={1}>
          {request.host}
        </Text>

        {/* Path */}
        <Text style={styles.path} numberOfLines={1}>
          {truncate(request.path + (request.queryString ? '?' + request.queryString : ''), 70)}
        </Text>

        {/* Error row */}
        {isFailed && request.error && (
          <Text style={styles.error} numberOfLines={1}>
            ✗ {request.error}
          </Text>
        )}
      </View>

      {/* Chevron */}
      <Text style={styles.chevron}>›</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection:   'row',
    alignItems:      'stretch',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 12,
    marginVertical:   5,
    borderRadius:    10,
    overflow:        'hidden',
    elevation:       2,
    shadowColor:     '#000',
    shadowOffset:    { width: 0, height: 1 },
    shadowOpacity:   0.15,
    shadowRadius:    3,
    borderWidth: 1,
    borderColor: '#E7E7EE',
  },
  body: {
    flex:            1,
    paddingVertical:  10,
    paddingLeft:     12,
    paddingRight:     4,
    gap:             2,
  },
  topRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           8,
    marginBottom:  4,
  },
  methodBadge: {
    borderRadius:      4,
    paddingHorizontal: 7,
    paddingVertical:   2,
  },
  methodText: {
    color:      '#FFF',
    fontSize:   10,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    letterSpacing: 0.5,
  },
  statusPill: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: '#F7F7FA',
  },
  statusCode: {
    fontSize:   14,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  duration: {
    fontSize: 11,
    color:    '#8A8A99',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  time: {
    fontSize:  11,
    color:     '#8A8A99',
    marginLeft: 'auto',
  },
  host: {
    fontSize:   13,
    color:      '#12121A',
    fontWeight: '500',
  },
  path: {
    fontSize:   12,
    color:      '#6B6B7A',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  error: {
    fontSize:  12,
    color:     '#F44336',
    marginTop: 2,
  },
  chevron: {
    fontSize:    20,
    color:       '#C2C2CC',
    alignSelf:   'center',
    paddingRight: 12,
  },
});
