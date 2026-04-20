import React from 'react';
import { Platform, StatusBar, View, ViewProps } from 'react-native';

declare const require: (moduleName: string) => unknown;

type SafeAreaContextModule = {
  SafeAreaView: React.ComponentType<ViewProps>;
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
 * Falls back to a plain View (no SafeArea) to avoid deprecated RN SafeAreaView warning.
 */
export function ChuckerSafeAreaView(props: ViewProps) {
  const mod = loadSafeAreaContext();
  if (mod?.SafeAreaView) return <mod.SafeAreaView {...props} />;

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

