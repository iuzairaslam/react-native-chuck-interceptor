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
  tabActive: {
    backgroundColor: '#F7F7FA',
  },
  label: {
    fontSize:   13,
    color:      '#6B6B7A',
    fontWeight: '500',
  },
  labelActive: {
    color:      '#12121A',
    fontWeight: '700',
  },
});
