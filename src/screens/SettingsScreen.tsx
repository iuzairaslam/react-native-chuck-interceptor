// ─────────────────────────────────────────────────────────────────────────────
// react-native-chuck-interceptor — Settings Screen
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState } from 'react';
import {
  Platform,
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
import { ChuckerSafeAreaView } from '../components/SafeArea';
import { ChuckerPalette, useChuckerPalette } from '../theme';
import { ChevronBackIcon } from '../components/ChuckerIcons';

const HEADER_ICON_SIZE = 19;

interface SettingsScreenProps {
  onBack: () => void;
}

export function SettingsScreen({ onBack }: SettingsScreenProps) {
  const { settings, updateSettings, requests, clearRequests } = useChuckerContext();
  const palette = useChuckerPalette(settings);
  const isDark = palette.bg === '#000000';
  const [filterInput, setFilterInput] = useState(settings.hostFilter.join(', '));

  function applyFilter() {
    const filters = filterInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    updateSettings({ hostFilter: filters });
  }

  return (
    <ChuckerSafeAreaView style={[styles.safe, { backgroundColor: palette.bg }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={palette.surface} translucent={false} />
      {/* Header */}
      <View style={[styles.header, { backgroundColor: palette.surface, borderBottomColor: palette.border }]}>
        <TouchableOpacity
          onPress={onBack}
          style={[styles.iconBtn, { backgroundColor: palette.chipBg, borderColor: palette.border }]}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <ChevronBackIcon color={palette.primary} size={HEADER_ICON_SIZE} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: palette.text }]}>Settings</Text>
        <View style={styles.iconBtnPlaceholder} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Stats */}
        <View style={styles.statsRow}>
          <StatCard label="Total" value={String(requests.length)} palette={palette} />
          <StatCard label="Success" value={String(requests.filter((r) => r.responseCode && r.responseCode < 400).length)} color="#4CAF50" palette={palette} />
          <StatCard label="Errors"  value={String(requests.filter((r) => r.status === 'failed' || (r.responseCode && r.responseCode >= 400)).length)} color="#F44336" palette={palette} />
        </View>

        {/* Notifications */}
        <SectionHeader title="Notifications" palette={palette} />
        <SettingRow
          label="Show Notifications"
          description="Show a local notification for each request (requires permission)"
          value={settings.showNotification}
          onToggle={(v) => updateSettings({ showNotification: v })}
          palette={palette}
        />

        {/* Debug mode */}
        <SectionHeader title="Visibility" palette={palette} />
        <SettingRow
          label="Debug Mode Only"
          description="Only activate Chucker in __DEV__ builds"
          value={settings.showOnlyInDebug}
          onToggle={(v) => updateSettings({ showOnlyInDebug: v })}
          palette={palette}
        />

        {/* Max requests */}
        <SectionHeader title="Storage" palette={palette} />
        <View style={[styles.settingCard, { backgroundColor: palette.surface, borderColor: palette.border }]}>
          <View style={styles.settingLabelRow}>
            <Text style={[styles.settingLabel, { color: palette.text }]}>Max Requests</Text>
            <Text style={[styles.settingDesc, { color: palette.mutedText }]}>Older requests are discarded when limit is reached</Text>
          </View>
          <View style={styles.stepperRow}>
            {[50, 100, 200, 500].map((val) => (
              <TouchableOpacity
                key={val}
                style={[
                  styles.stepBtn,
                  { backgroundColor: palette.chipBg, borderColor: palette.border },
                  settings.maxRequests === val && styles.stepBtnActive,
                ]}
                onPress={() => updateSettings({ maxRequests: val })}
              >
                <Text style={[styles.stepBtnText, { color: palette.mutedText }, settings.maxRequests === val && styles.stepBtnTextActive]}>
                  {val}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Host filter */}
        <SectionHeader title="Filters" palette={palette} />
        <View style={[styles.settingCard, { backgroundColor: palette.surface, borderColor: palette.border }]}>
          <Text style={[styles.settingLabel, { color: palette.text }]}>Host Filter</Text>
          <Text style={[styles.settingDesc, { color: palette.mutedText }]}>
            Comma-separated substrings. Only URLs matching will be captured.
            Leave empty to capture all.
          </Text>
          <TextInput
            style={[styles.filterInput, { color: palette.mutedText, borderColor: palette.border, backgroundColor: palette.surface }]}
            value={filterInput}
            onChangeText={setFilterInput}
            onBlur={applyFilter}
            placeholder="e.g. api.example.com, staging."
            placeholderTextColor={palette.subtleText}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        {/* Notification duration */}
        <SectionHeader title="Notification Duration" palette={palette} />
        <View style={[styles.settingCard, { backgroundColor: palette.surface, borderColor: palette.border }]}>
          <Text style={[styles.settingLabel, { color: palette.text }]}>Auto-dismiss after</Text>
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
                  { backgroundColor: palette.chipBg, borderColor: palette.border },
                  settings.notificationDuration === value && styles.stepBtnActive,
                ]}
                onPress={() => updateSettings({ notificationDuration: value })}
              >
                <Text style={[styles.stepBtnText, { color: palette.mutedText }, settings.notificationDuration === value && styles.stepBtnTextActive]}>
                  {label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Danger zone */}
        <SectionHeader title="Danger Zone" palette={palette} />
        <TouchableOpacity
          style={[styles.clearBtn, { backgroundColor: palette.bg }]}
          onPress={clearRequests}
          activeOpacity={0.75}
        >
          <Text style={styles.clearBtnText}>Clear All Requests</Text>
        </TouchableOpacity>

        {/* About */}
        <View style={styles.about}>
          <Text style={[styles.aboutText, { color: palette.mutedText }]}>react-native-chuck-interceptor v1.0.0</Text>
          <Text style={[styles.aboutSubtext, { color: palette.subtleText }]}>
            Inspired by Chucker Android &amp; Chucker Flutter
          </Text>
        </View>
      </ScrollView>
    </ChuckerSafeAreaView>
  );
}

function SectionHeader({ title, palette }: { title: string; palette: ChuckerPalette }) {
  return <Text style={[styles.sectionHeader, { color: palette.primary }]}>{title}</Text>;
}

function StatCard({ label, value, color, palette }: { label: string; value: string; color?: string; palette: ChuckerPalette }) {
  return (
    <View style={[styles.statCard, { backgroundColor: palette.surface, borderColor: palette.border }]}>
      <Text style={[styles.statLabel, { color: palette.subtleText }]}>{label}</Text>
      <Text style={[styles.statValue, { color: color ?? palette.text }]}>{value}</Text>
    </View>
  );
}

function SettingRow({
  label,
  description,
  value,
  onToggle,
  palette,
}: {
  label:       string;
  description: string;
  value:       boolean;
  onToggle:    (v: boolean) => void;
  palette: ChuckerPalette;
}) {
  return (
    <View style={[styles.settingCard, { backgroundColor: palette.surface, borderColor: palette.border }]}>
      <View style={styles.settingLabelRow}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.settingLabel, { color: palette.text }]}>{label}</Text>
          <Text style={[styles.settingDesc, { color: palette.mutedText }]}>{description}</Text>
        </View>
        <Switch
          value={value}
          onValueChange={onToggle}
          trackColor={{ false: palette.border, true: palette.primary }}
          thumbColor={value ? '#FFFFFF' : palette.subtleText}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex:            1,
    backgroundColor: '#F7F7FA',
  },
  header: {
    flexDirection:     'row',
    alignItems:        'center',
    paddingVertical:   10,
    paddingHorizontal: 14,
    backgroundColor:   '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E7E7EE',
  },
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  iconBtnPlaceholder: {
    width: 34,
    height: 34,
  },
  headerTitle: {
    flex:       1,
    fontSize:   16,
    fontWeight: '700',
    color:      '#12121A',
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
    backgroundColor: '#FFFFFF',
    borderRadius:    10,
    padding:         14,
    alignItems:      'center',
    borderWidth: 1,
    borderColor: '#E7E7EE',
    gap: 2,
  },
  statValue: {
    fontSize:   22,
    fontWeight: '700',
    color:      '#12121A',
  },
  statLabel: {
    fontSize:  11,
    color:     '#8A8A99',
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
    backgroundColor: '#FFFFFF',
    borderRadius:    10,
    padding:         14,
    gap:             8,
    borderWidth: 1,
    borderColor: '#E7E7EE',
  },
  settingLabelRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           12,
  },
  settingLabel: {
    fontSize:   15,
    color:      '#12121A',
    fontWeight: '500',
  },
  settingDesc: {
    fontSize:  12,
    color:     '#6B6B7A',
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
    backgroundColor:   '#F7F7FA',
    alignItems:        'center',
    borderWidth:       1,
    borderColor:       '#E7E7EE',
  },
  stepBtnActive: {
    backgroundColor: '#D97757',
    borderColor:     '#D97757',
  },
  stepBtnText: {
    color:    '#6B6B7A',
    fontSize: 13,
  },
  stepBtnTextActive: {
    color:      '#FFF',
    fontWeight: '600',
  },
  filterInput: {
    backgroundColor:   '#FFFFFF',
    borderRadius:       8,
    padding:            10,
    color:              '#303047',
    fontSize:           13,
    fontFamily:         Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    borderWidth:        1,
    borderColor:        '#E7E7EE',
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
