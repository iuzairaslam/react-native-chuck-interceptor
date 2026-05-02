// ─────────────────────────────────────────────────────────────────────────────
// react-native-chuck-interceptor — Internal Tab Bar
// ─────────────────────────────────────────────────────────────────────────────

import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useChuckerContext } from '../context';
import { useChuckerPalette } from '../theme';

export interface TabItem {
  key:   string;
  label: string;
}

interface TabBarProps {
  tabs:      TabItem[];
  activeKey: string;
  onChange:  (key: string) => void;
}

export function TabBar({ tabs, activeKey, onChange }: TabBarProps) {
  const { settings } = useChuckerContext();
  const palette = useChuckerPalette(settings);

  return (
    <View style={[styles.container, { backgroundColor: palette.surface, borderBottomColor: palette.border }]}>
      {tabs.map((tab) => {
        const isActive = tab.key === activeKey;
        return (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, isActive && { backgroundColor: palette.chipBg }]}
            onPress={() => onChange(tab.key)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.label,
                { color: palette.subtleText },
                isActive && { color: palette.text },
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection:   'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E7E7EE',
    paddingHorizontal: 8,
    paddingTop: 4,
    paddingBottom: 6,
  },
  tab: {
    flex:            1,
    paddingVertical: 10,
    alignItems:      'center',
    borderRadius: 10,
  },
  label: {
    fontSize:   13,
    fontWeight: '500',
  },
});
