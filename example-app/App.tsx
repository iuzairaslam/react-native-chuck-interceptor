import React, { useEffect } from 'react';
import {
  PermissionsAndroid,
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  ChuckerProvider,
  useChuckerContext,
} from '@iuzairaslam/react-native-chuck-interceptor';
import PushNotificationIOS from '@react-native-community/push-notification-ios';

function DemoScreen() {
  const { openChucker } = useChuckerContext();

  useEffect(() => {
    const requestNotificationPermission = async () => {
      if (Platform.OS === 'ios') {
        try {
          await PushNotificationIOS.requestPermissions({
            alert: true,
            badge: true,
            sound: true,
          });
        } catch {
          // Ignore permission errors in example app.
        }
        return;
      }

      // Android 13+ (API 33): runtime POST_NOTIFICATIONS (also declared in AndroidManifest).
      if (Platform.OS === 'android' && Platform.Version >= 33) {
        try {
          await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
            {
              title: 'Notification Permission',
              message:
                'Allow notifications so Chucker alerts can be shown.',
              buttonPositive: 'Allow',
              buttonNegative: 'Deny',
            },
          );
        } catch {
          // Ignore permission errors in example app.
        }
      }
    };

    requestNotificationPermission();
  }, []);

  const makeGetRequest = async () => {
    await fetch('https://httpbin.org/get?hello=world');
  };

  const makePostRequest = async () => {
    await fetch('https://httpbin.org/post', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Chuck', mode: 'example-app' }),
    });
  };

  const makeErrorRequest = async () => {
    await fetch('https://httpbin.org/status/500');
  };

  const makeRedirectRequest = async () => {
    await fetch(
      'https://httpbin.org/redirect-to?url=https://example.com/deep-link',
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.container}>
        <Text style={styles.title}>Chucker Example App</Text>
        <Text style={styles.subtitle}>
          Trigger requests, then open Chucker.
        </Text>

        <TouchableOpacity style={styles.button} onPress={makeGetRequest}>
          <Text style={styles.buttonText}>GET Request</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={makePostRequest}>
          <Text style={styles.buttonText}>POST Request</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={makeErrorRequest}>
          <Text style={styles.buttonText}>500 Error Request</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={makeRedirectRequest}>
          <Text style={styles.buttonText}>Redirect (Link Header)</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, styles.primary]} onPress={openChucker}>
          <Text style={[styles.buttonText, styles.primaryText]}>
            Open Chucker
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function App() {
  return (
    <ChuckerProvider config={{ showOnlyInDebug: true, theme: 'auto' }}>
      <DemoScreen />
    </ChuckerProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    gap: 12,
  },
  safe: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111111',
    textAlign: 'center',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 8,
  },
  button: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#F7F7F7',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#222222',
  },
  primary: {
    backgroundColor: '#D97757',
    borderColor: '#D97757',
    marginTop: 4,
  },
  primaryText: {
    color: '#FFFFFF',
  },
});

export default App;
