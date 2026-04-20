// ─────────────────────────────────────────────────────────────────────────────
// react-native-chuck-interceptor — Internal Tab Bar
// ─────────────────────────────────────────────────────────────────────────────

import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

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
  return (
    <View style={styles.container}>
      {tabs.map((tab) => {
        const isActive = tab.key === activeKey;
        return (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, isActive && styles.tabActive]}
            onPress={() => onChange(tab.key)}
            activeOpacity={0.7}
          >
            <Text style={[styles.label, isActive && styles.labelActive]}>
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
    backgroundColor: '#0D0D1A',
    borderBottomWidth: 1,
    borderBottomColor: '#1E2748',
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
  tabActive: {
    backgroundColor: '#1A1A2E',
  },
  label: {
    fontSize:   13,
    color:      '#546E7A',
    fontWeight: '500',
  },
  labelActive: {
    color:      '#E0E0E0',
    fontWeight: '700',
  },
});
