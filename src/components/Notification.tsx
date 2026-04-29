// ─────────────────────────────────────────────────────────────────────────────
// react-native-chuck-interceptor — Floating Notification Toast
// Shows a brief notification at the top of the screen for each network call
// ─────────────────────────────────────────────────────────────────────────────

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Platform,
} from 'react-native';
import { ChuckerRequest } from '../types';
import { statusColor, methodColor, truncate, formatDuration } from '../utils';
import { useChuckerContext } from '../context';
import { useChuckerPalette } from '../theme';
import { CloseIcon } from './ChuckerIcons';

interface NotificationItem {
  id:        string;
  request:   ChuckerRequest;
  anim:      Animated.Value;
  timeoutId: ReturnType<typeof setTimeout>;
}

interface ChuckerNotificationProps {
  /** Called when user taps the notification to open the inspector */
  onPress?: (requestId: string) => void;
}

export function ChuckerNotification({ onPress }: ChuckerNotificationProps) {
  const { settings, requests } = useChuckerContext();
  const palette = useChuckerPalette(settings);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const prevRequestsRef = useRef<ChuckerRequest[]>([]);

  const dismiss = useCallback((id: string) => {
    setNotifications((prev) => {
      const item = prev.find((n) => n.id === id);
      if (item) {
        clearTimeout(item.timeoutId);
        Animated.timing(item.anim, {
          toValue:         0,
          duration:        250,
          useNativeDriver: true,
        }).start(() => {
          setNotifications((curr) => curr.filter((n) => n.id !== id));
        });
      }
      return prev;
    });
  }, []);

  // Watch for requests that complete/fail and show a notification.
  useEffect(() => {
    if (!settings.showNotification) return;

    const prevIds = new Set(prevRequestsRef.current.map((r) => r.id));
    const prev    = prevRequestsRef.current;

    requests.forEach((req) => {
      const old = prev.find((r) => r.id === req.id);
      const wasSeenBefore = prevIds.has(req.id);

      // If it's brand new AND already finished (e.g. rehydrated), show it.
      if (!wasSeenBefore && req.status !== 'pending') {
        showNotification(req);
        return;
      }

      // If it transitions from pending -> complete/failed, update or create once.
      if (old && old.status === 'pending' && req.status !== 'pending') {
        const exists = notifications.some((n) => n.id === req.id);
        if (exists) updateNotification(req.id, req);
        else showNotification(req);
      }
    });

    prevRequestsRef.current = requests;
  }, [requests, settings.showNotification, notifications, settings.notificationDuration, dismiss]);

  function showNotification(request: ChuckerRequest) {
    const anim = new Animated.Value(0);

    const timeoutId = setTimeout(() => {
      dismiss(request.id);
    }, settings.notificationDuration);

    const item: NotificationItem = {
      id: request.id,
      request,
      anim,
      timeoutId,
    };

    setNotifications((prev) => [item, ...prev].slice(0, 5)); // max 5 at once

    Animated.spring(anim, {
      toValue:         1,
      tension:         80,
      friction:        10,
      useNativeDriver: true,
    }).start();
  }

  function updateNotification(id: string, updated: ChuckerRequest) {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, request: updated } : n)),
    );
  }

  if (notifications.length === 0) return null;

  return (
    <View style={styles.container} pointerEvents="box-none">
      {notifications.map((item) => (
        <NotificationBubble
          key={item.id}
          item={item}
          palette={palette}
          onPress={() => {
            dismiss(item.id);
            onPress?.(item.id);
          }}
          onDismiss={() => dismiss(item.id)}
        />
      ))}
    </View>
  );
}

interface BubbleProps {
  item:      NotificationItem;
  onPress:   () => void;
  onDismiss: () => void;
  palette: ReturnType<typeof useChuckerPalette>;
}

function NotificationBubble({ item, onPress, onDismiss, palette }: BubbleProps) {
  const { request, anim } = item;
  const isPending = request.status === 'pending';
  const isFailed  = request.status === 'failed';

  const statusCode = request.responseCode;
  const color      = isPending
    ? '#607D8B'
    : isFailed
    ? '#F44336'
    : statusColor(statusCode);

  const translateY = anim.interpolate({
    inputRange:  [0, 1],
    outputRange: [-80, 0],
  });
  const opacity = anim;

  return (
    <Animated.View style={[styles.bubble, { opacity, transform: [{ translateY }], backgroundColor: palette.surface }]}>
      <TouchableOpacity
        style={styles.bubbleInner}
        onPress={onPress}
        activeOpacity={0.85}
      >
        {/* Left color bar */}
        <View style={[styles.colorBar, { backgroundColor: color }]} />

        {/* Content */}
        <View style={styles.content}>
          <View style={styles.topRow}>
            <View style={[styles.methodBadge, { backgroundColor: methodColor(request.method) }]}>
              <Text style={styles.methodText}>{request.method}</Text>
            </View>
            <Text style={[styles.statusText, { color: palette.text }]} numberOfLines={1}>
              {isPending
                ? 'Pending…'
                : isFailed
                ? '✗ Failed'
                : `${statusCode}`}
            </Text>
            {!isPending && request.duration !== null && (
              <Text style={[styles.durationText, { color: palette.subtleText }]}>
                {formatDuration(request.duration)}
              </Text>
            )}
          </View>
          <Text style={[styles.urlText, { color: palette.mutedText }]} numberOfLines={1}>
            {truncate(request.host + request.path, 55)}
          </Text>
        </View>

        {/* Dismiss X */}
        <TouchableOpacity onPress={onDismiss} style={styles.dismissBtn} hitSlop={{ top: 8, left: 8, right: 8, bottom: 8 }}>
          <CloseIcon color={palette.subtleText} size={15} />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
}

const SAFE_TOP = Platform.OS === 'ios' ? 50 : 30;

const styles = StyleSheet.create({
  container: {
    position:  'absolute',
    top:       SAFE_TOP,
    left:      12,
    right:     12,
    zIndex:    99999,
    elevation: 99999,
    gap:       6,
  },
  bubble: {
    borderRadius:    10,
    overflow:        'hidden',
    backgroundColor: '#1E1E2E',
    shadowColor:     '#000',
    shadowOffset:    { width: 0, height: 4 },
    shadowOpacity:   0.25,
    shadowRadius:    8,
    elevation:       8,
  },
  bubbleInner: {
    flexDirection: 'row',
    alignItems:    'center',
    minHeight:     54,
  },
  colorBar: {
    width:  4,
    alignSelf: 'stretch',
  },
  content: {
    flex:            1,
    paddingVertical: 8,
    paddingLeft:     10,
  },
  topRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           6,
    marginBottom:  2,
  },
  methodBadge: {
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical:   2,
  },
  methodText: {
    color:      '#FFF',
    fontSize:   10,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  statusText: {
    color:      '#E0E0E0',
    fontSize:   13,
    fontWeight: '600',
  },
  durationText: {
    color:    '#9E9E9E',
    fontSize: 11,
    marginLeft: 'auto',
    paddingRight: 4,
  },
  urlText: {
    color:      '#B0BEC5',
    fontSize:   12,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  dismissBtn: {
    paddingHorizontal: 12,
    paddingVertical:    8,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
