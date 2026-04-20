// ─────────────────────────────────────────────────────────────────────────────
// react-native-chuck-interceptor — ChuckerProvider
// Root component. Wrap your app with this to enable the inspector.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useCallback, useEffect, useState } from 'react';
import { Modal, StyleSheet, View } from 'react-native';
import { ChuckerConfig, ChuckerRequest } from './types';
import { ChuckerStateProvider, useChuckerContext } from './context';
import { ChuckerListScreen } from './screens/ChuckerListScreen';
import { RequestDetailScreen } from './screens/RequestDetailScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { ChuckerLocalNotifications } from './localNotifications';

// ─── Internal navigation stack ────────────────────────────────────────────────

type Screen = 'list' | 'detail' | 'settings';

interface InspectorProps {
  visible:  boolean;
  onClose:  () => void;
}

function ChuckerInspector({ visible, onClose }: InspectorProps) {
  const [screen,          setScreen]         = useState<Screen>('list');
  const [selectedRequest, setSelectedRequest] = useState<ChuckerRequest | null>(null);

  const handleSelectRequest = useCallback((req: ChuckerRequest) => {
    setSelectedRequest(req);
    setScreen('detail');
  }, []);

  const handleBack = useCallback(() => {
    setScreen('list');
    setSelectedRequest(null);
  }, []);

  const handleOpenSettings = useCallback(() => {
    setScreen('settings');
  }, []);

  const handleClose = useCallback(() => {
    setScreen('list');
    setSelectedRequest(null);
    onClose();
  }, [onClose]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <View style={styles.modal}>
        {screen === 'list' && (
          <ChuckerListScreen
            onSelectRequest={handleSelectRequest}
            onOpenSettings={handleOpenSettings}
            onClose={handleClose}
          />
        )}
        {screen === 'detail' && selectedRequest && (
          <RequestDetailScreen
            request={selectedRequest}
            onBack={handleBack}
          />
        )}
        {screen === 'settings' && (
          <SettingsScreen onBack={handleBack} />
        )}
      </View>
    </Modal>
  );
}

// ─── Provider content (has context access) ────────────────────────────────────

function ChuckerProviderContent({
  children,
  config,
}: {
  children: React.ReactNode;
  config: ChuckerConfig;
}) {
  const { isVisible, openChucker, closeChucker } = useChuckerContext();

  useEffect(() => {
    if (config.requestNotificationPermissionOnStart !== false) {
      ChuckerLocalNotifications.requestPermissionOnAppStart();
    }
  }, [config.requestNotificationPermissionOnStart]);

  useEffect(() => {
    return ChuckerLocalNotifications.subscribeToPresses(() => {
      openChucker();
    });
  }, [openChucker]);

  return (
    <View style={styles.root}>
      {children}

      {/* Full-screen inspector modal */}
      <ChuckerInspector visible={isVisible} onClose={closeChucker} />
    </View>
  );
}

// ─── Public ChuckerProvider ───────────────────────────────────────────────────

export interface ChuckerProviderProps {
  children: React.ReactNode;
  config?:  ChuckerConfig;
}

/**
 * Wrap your app with `<ChuckerProvider>` to enable network inspection.
 *
 * @example
 * ```tsx
 * export default function App() {
 *   return (
 *     <ChuckerProvider config={{ showOnlyInDebug: true }}>
 *       <YourApp />
 *     </ChuckerProvider>
 *   );
 * }
 * ```
 */
export function ChuckerProvider({ children, config }: ChuckerProviderProps) {
  return (
    <ChuckerStateProvider config={config}>
      <ChuckerProviderContent config={config || {}}>
        {children}
      </ChuckerProviderContent>
    </ChuckerStateProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  modal: {
    flex: 1,
  },
});
