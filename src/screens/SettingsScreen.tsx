// ─────────────────────────────────────────────────────────────────────────────
// react-native-chuck-interceptor — Settings Screen
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState } from 'react';
import {
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  StatusBar,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useChuckerContext } from '../context';

interface SettingsScreenProps {
  onBack: () => void;
}

export function SettingsScreen({ onBack }: SettingsScreenProps) {
  const { settings, updateSettings, requests, clearRequests } = useChuckerContext();
  const [filterInput, setFilterInput] = useState(settings.hostFilter.join(', '));

  function applyFilter() {
    const filters = filterInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    updateSettings({ hostFilter: filters });
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#0D0D1A" translucent={false} />
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Stats */}
        <View style={styles.statsRow}>
          <StatCard label="Total" value={String(requests.length)} />
          <StatCard label="Success" value={String(requests.filter((r) => r.responseCode && r.responseCode < 400).length)} color="#4CAF50" />
          <StatCard label="Errors"  value={String(requests.filter((r) => r.status === 'failed' || (r.responseCode && r.responseCode >= 400)).length)} color="#F44336" />
        </View>

        {/* Notifications */}
        <SectionHeader title="Notifications" />
        <SettingRow
          label="Show Notifications"
          description="Show a local notification for each request (requires permission)"
          value={settings.showNotification}
          onToggle={(v) => updateSettings({ showNotification: v })}
        />

        {/* Debug mode */}
        <SectionHeader title="Visibility" />
        <SettingRow
          label="Debug Mode Only"
          description="Only activate Chucker in __DEV__ builds"
          value={settings.showOnlyInDebug}
          onToggle={(v) => updateSettings({ showOnlyInDebug: v })}
        />

        {/* Max requests */}
        <SectionHeader title="Storage" />
        <View style={styles.settingCard}>
          <View style={styles.settingLabelRow}>
            <Text style={styles.settingLabel}>Max Requests</Text>
            <Text style={styles.settingDesc}>Older requests are discarded when limit is reached</Text>
          </View>
          <View style={styles.stepperRow}>
            {[50, 100, 200, 500].map((val) => (
              <TouchableOpacity
                key={val}
                style={[
                  styles.stepBtn,
                  settings.maxRequests === val && styles.stepBtnActive,
                ]}
                onPress={() => updateSettings({ maxRequests: val })}
              >
                <Text style={[styles.stepBtnText, settings.maxRequests === val && styles.stepBtnTextActive]}>
                  {val}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Host filter */}
        <SectionHeader title="Filters" />
        <View style={styles.settingCard}>
          <Text style={styles.settingLabel}>Host Filter</Text>
          <Text style={styles.settingDesc}>
            Comma-separated substrings. Only URLs matching will be captured.
            Leave empty to capture all.
          </Text>
          <TextInput
            style={styles.filterInput}
            value={filterInput}
            onChangeText={setFilterInput}
            onBlur={applyFilter}
            placeholder="e.g. api.example.com, staging."
            placeholderTextColor="#37474F"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        {/* Notification duration */}
        <SectionHeader title="Notification Duration" />
        <View style={styles.settingCard}>
          <Text style={styles.settingLabel}>Auto-dismiss after</Text>
          <View style={styles.stepperRow}>
            {[
              { label: '1s',  value: 1000  },
              { label: '2s',  value: 2000  },
              { label: '3s',  value: 3000  },
              { label: '5s',  value: 5000  },
            ].map(({ label, value }) => (
              <TouchableOpacity
                key={value}
                style={[
                  styles.stepBtn,
                  settings.notificationDuration === value && styles.stepBtnActive,
                ]}
                onPress={() => updateSettings({ notificationDuration: value })}
              >
                <Text style={[styles.stepBtnText, settings.notificationDuration === value && styles.stepBtnTextActive]}>
                  {label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Danger zone */}
        <SectionHeader title="Danger Zone" />
        <TouchableOpacity
          style={styles.clearBtn}
          onPress={clearRequests}
          activeOpacity={0.75}
        >
          <Text style={styles.clearBtnText}>Clear All Requests</Text>
        </TouchableOpacity>

        {/* About */}
        <View style={styles.about}>
          <Text style={styles.aboutText}>react-native-chuck-interceptor v1.0.0</Text>
          <Text style={styles.aboutSubtext}>
            Inspired by Chucker Android &amp; Chucker Flutter
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function SectionHeader({ title }: { title: string }) {
  return <Text style={styles.sectionHeader}>{title}</Text>;
}

function StatCard({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, color ? { color } : null]}>{value}</Text>
    </View>
  );
}

function SettingRow({
  label,
  description,
  value,
  onToggle,
}: {
  label:       string;
  description: string;
  value:       boolean;
  onToggle:    (v: boolean) => void;
}) {
  return (
    <View style={styles.settingCard}>
      <View style={styles.settingLabelRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.settingLabel}>{label}</Text>
          <Text style={styles.settingDesc}>{description}</Text>
        </View>
        <Switch
          value={value}
          onValueChange={onToggle}
          trackColor={{ false: '#1E2748', true: '#D97757' }}
          thumbColor={value ? '#FFF' : '#546E7A'}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex:            1,
    backgroundColor: '#0D0D1A',
  },
  header: {
    flexDirection:     'row',
    alignItems:        'center',
    paddingTop:        Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : 0,
    paddingVertical:   12,
    paddingHorizontal: 16,
    backgroundColor:   '#0D0D1A',
    borderBottomWidth: 1,
    borderBottomColor: '#1E2748',
  },
  backBtn: {},
  backText: {
    color:      '#D97757',
    fontSize:   14,
    fontWeight: '700',
    width:    60,
  },
  headerTitle: {
    flex:       1,
    fontSize:   17,
    fontWeight: '700',
    color:      '#E0E0E0',
    textAlign:  'center',
  },
  content: {
    padding:       16,
    paddingBottom: 60,
    gap:           10,
  },
  statsRow: {
    flexDirection: 'row',
    gap:           10,
    marginBottom:  6,
  },
  statCard: {
    flex:            1,
    backgroundColor: '#111128',
    borderRadius:    10,
    padding:         14,
    alignItems:      'center',
    borderWidth: 1,
    borderColor: '#1E2748',
    gap: 2,
  },
  statValue: {
    fontSize:   22,
    fontWeight: '700',
    color:      '#B0BEC5',
  },
  statLabel: {
    fontSize:  11,
    color:     '#546E7A',
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  sectionHeader: {
    fontSize:      11,
    fontWeight:    '700',
    color:         '#D97757',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginTop:     8,
    marginBottom:  2,
  },
  settingCard: {
    backgroundColor: '#111128',
    borderRadius:    10,
    padding:         14,
    gap:             8,
    borderWidth: 1,
    borderColor: '#1E2748',
  },
  settingLabelRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           12,
  },
  settingLabel: {
    fontSize:   15,
    color:      '#E0E0E0',
    fontWeight: '500',
  },
  settingDesc: {
    fontSize:  12,
    color:     '#546E7A',
    marginTop: 2,
  },
  stepperRow: {
    flexDirection: 'row',
    gap:           8,
    marginTop:     4,
  },
  stepBtn: {
    flex:              1,
    paddingVertical:    8,
    borderRadius:      8,
    backgroundColor:   '#1A1A2E',
    alignItems:        'center',
    borderWidth:       1,
    borderColor:       '#1E2748',
  },
  stepBtnActive: {
    backgroundColor: '#D97757',
    borderColor:     '#D97757',
  },
  stepBtnText: {
    color:    '#546E7A',
    fontSize: 13,
  },
  stepBtnTextActive: {
    color:      '#FFF',
    fontWeight: '600',
  },
  filterInput: {
    backgroundColor:   '#0D0D1A',
    borderRadius:       8,
    padding:            10,
    color:              '#B0BEC5',
    fontSize:           13,
    fontFamily:         Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    borderWidth:        1,
    borderColor:        '#1E2748',
  },
  clearBtn: {
    backgroundColor: '#1A0A0A',
    borderRadius:    10,
    padding:         14,
    alignItems:      'center',
    borderWidth:     1,
    borderColor:     '#F44336',
  },
  clearBtnText: {
    color:      '#F44336',
    fontSize:   15,
    fontWeight: '600',
  },
  about: {
    alignItems: 'center',
    marginTop:  16,
    gap:         4,
  },
  aboutText: {
    color:    '#37474F',
    fontSize: 12,
  },
  aboutSubtext: {
    color:    '#263238',
    fontSize: 11,
  },
});
