import React from 'react';
import { Platform, SafeAreaView, StatusBar, View, ViewProps } from 'react-native';

declare const require: (moduleName: string) => unknown;

type SafeAreaContextModule = {
  SafeAreaView: React.ComponentType<ViewProps>;
  SafeAreaProvider?: React.ComponentType<{ children: React.ReactNode }>;
};

function loadSafeAreaContext(): SafeAreaContextModule | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require('react-native-safe-area-context') as SafeAreaContextModule;
  } catch {
    return null;
  }
}

/**
 * Prefer react-native-safe-area-context when available.
 * Falls back to:
 * - iOS: react-native SafeAreaView (to correctly respect notches/home indicator)
 * - Android: plain View with StatusBar padding (avoid deprecated SafeAreaView warning noise)
 */
export function ChuckerSafeAreaView(props: ViewProps) {
  const mod = loadSafeAreaContext();
  if (mod?.SafeAreaView) return <mod.SafeAreaView {...props} />;

  if (Platform.OS === 'ios') {
    return <SafeAreaView {...props} />;
  }

  const extraAndroidPadding =
    Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : 0;

  return (
    <View
      {...props}
      style={[
        { paddingTop: extraAndroidPadding },
        // eslint-disable-next-line react-native/no-inline-styles
        props.style,
      ]}
    />
  );
}

export function ChuckerSafeAreaProvider({ children }: { children: React.ReactNode }) {
  const mod = loadSafeAreaContext();
  if (mod?.SafeAreaProvider) return <mod.SafeAreaProvider>{children}</mod.SafeAreaProvider>;
  return <>{children}</>;
}

