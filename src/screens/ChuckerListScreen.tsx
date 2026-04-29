// ─────────────────────────────────────────────────────────────────────────────
// react-native-chuck-interceptor — Main List Screen
// Shows all intercepted network requests with search and filter
// ─────────────────────────────────────────────────────────────────────────────

import React, { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  ListRenderItemInfo,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { ChuckerRequest } from '../types';
import { useChuckerContext } from '../context';
import { RequestItem } from '../components/RequestItem';
import { filterRequests } from '../utils';
import { ChuckerSafeAreaView } from '../components/SafeArea';
import { useChuckerPalette } from '../theme';
import { CloseIcon, SettingsIcon, TrashIcon } from '../components/ChuckerIcons';

const HEADER_ICON_SIZE = 19;

interface ChuckerListScreenProps {
  onSelectRequest: (request: ChuckerRequest) => void;
  onOpenSettings:  () => void;
  onClose:         () => void;
}

type FilterType = 'all' | '2xx' | '4xx' | '5xx' | 'failed';

export function ChuckerListScreen({
  onSelectRequest,
  onOpenSettings,
  onClose,
}: ChuckerListScreenProps) {
  const { requests, clearRequests, settings } = useChuckerContext();
  const palette = useChuckerPalette(settings);
  const isDark = palette.bg === '#000000';
  const [search,     setSearch]     = useState('');
  const [filter,     setFilter]     = useState<FilterType>('all');

  const filtered = useMemo(() => {
    let list = filterRequests(requests, search);
    switch (filter) {
      case '2xx':
        list = list.filter((r) => r.responseCode !== null && r.responseCode >= 200 && r.responseCode < 300);
        break;
      case '4xx':
        list = list.filter((r) => r.responseCode !== null && r.responseCode >= 400 && r.responseCode < 500);
        break;
      case '5xx':
        list = list.filter((r) => r.responseCode !== null && r.responseCode >= 500);
        break;
      case 'failed':
        list = list.filter((r) => r.status === 'failed');
        break;
    }
    return list;
  }, [requests, search, filter]);

  const handleClear = useCallback(() => {
    Alert.alert(
      'Clear All Requests',
      'This will delete all captured network requests.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear', style: 'destructive', onPress: clearRequests },
      ],
    );
  }, [clearRequests]);

  const FILTERS: { key: FilterType; label: string }[] = [
    { key: 'all',    label: 'All' },
    { key: '2xx',    label: '2xx' },
    { key: '4xx',    label: '4xx' },
    { key: '5xx',    label: '5xx' },
    { key: 'failed', label: 'Failed' },
  ];

  return (
    <ChuckerSafeAreaView style={[styles.safe, { backgroundColor: palette.bg }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={palette.surface} translucent={false} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: palette.surface, borderBottomColor: palette.border }]}>
        <View style={styles.headerTitle}>
          <Text style={[styles.title, { color: palette.text }]}>Chucker</Text>
          <Text style={[styles.subtitle, { color: palette.subtleText }]}>{requests.length}</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity
            onPress={handleClear}
            style={[styles.iconBtn, { backgroundColor: palette.chipBg, borderColor: palette.border }]}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <TrashIcon color={palette.mutedText} size={HEADER_ICON_SIZE} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onOpenSettings}
            style={[styles.iconBtn, { backgroundColor: palette.chipBg, borderColor: palette.border }]}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <SettingsIcon color={palette.mutedText} size={HEADER_ICON_SIZE} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onClose}
            style={[styles.iconBtn, { backgroundColor: palette.chipBg, borderColor: palette.border }]}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <CloseIcon color={palette.mutedText} size={HEADER_ICON_SIZE} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search bar */}
      <View style={[styles.searchBar, { backgroundColor: palette.surface, borderColor: palette.border }]}>
        <Text style={[styles.searchIcon, { color: palette.subtleText }]}>⌕</Text>
        <TextInput
          style={[styles.searchInput, { color: palette.text }]}
          value={search}
          onChangeText={setSearch}
          placeholder="Search URL, method, status..."
          placeholderTextColor={palette.subtleText}
          autoCapitalize="none"
          autoCorrect={false}
          clearButtonMode="while-editing"
        />
      </View>

      {/* Filter chips */}
      <View style={styles.filterRow}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[
              styles.chip,
              { backgroundColor: palette.surface, borderColor: palette.border },
              filter === f.key && { backgroundColor: palette.primary, borderColor: palette.primary },
            ]}
            onPress={() => setFilter(f.key)}
          >
            <Text style={[
              styles.chipText,
              { color: palette.subtleText },
              filter === f.key && styles.chipTextActive,
            ]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* List */}
      {filtered.length === 0 ? (
        <View style={styles.empty}>
          <Text style={[styles.emptyTitle, { color: palette.mutedText }]}>
            {requests.length === 0 ? 'No requests yet' : 'No matching requests'}
          </Text>
          <Text style={[styles.emptySubtitle, { color: palette.subtleText }]}>
            {requests.length === 0
              ? 'Make a network call to see it here'
              : 'Try changing your search or filter'}
          </Text>
        </View>
      ) : (
        <FlatList<ChuckerRequest>
          data={filtered}
          keyExtractor={(item: ChuckerRequest) => item.id}
          renderItem={({ item }: ListRenderItemInfo<ChuckerRequest>) => (
            <RequestItem request={item} onPress={onSelectRequest} />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={null}
        />
      )}
    </ChuckerSafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex:            1,
    backgroundColor: '#F7F7FA',
  },
  header: {
    flexDirection:   'row',
    alignItems:      'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E7E7EE',
    gap:             8,
  },
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  headerTitle: {
    flex:      1,
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  title: {
    fontSize:   18,
    fontWeight: '800',
    color:      '#12121A',
    letterSpacing: 0.3,
  },
  subtitle: {
    fontSize: 12,
    color:    '#8A8A99',
    fontWeight: '600',
  },
  headerRight: {
    flexDirection: 'row',
    gap:           6,
  },
  searchBar: {
    flexDirection:   'row',
    alignItems:      'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 12,
    marginTop:       12,
    marginBottom:    8,
    borderRadius:    14,
    paddingHorizontal: 12,
    height:          46,
    borderWidth: 1,
    borderColor: '#E7E7EE',
  },
  searchIcon: {
    fontSize:    12,
    marginRight: 10,
    color: '#8A8A99',
    fontWeight: '600',
  },
  searchInput: {
    flex:      1,
    color:     '#12121A',
    fontSize:  14,
    padding:   0,
  },
  filterRow: {
    flexDirection:   'row',
    paddingHorizontal: 12,
    gap:             6,
    marginBottom:    12,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical:    5,
    borderRadius:      999,
    backgroundColor:   '#FFFFFF',
    borderWidth:       1,
    borderColor:       '#E7E7EE',
  },
  chipActive: {
    backgroundColor: '#D97757',
    borderColor:     '#D97757',
  },
  chipText: {
    fontSize:   12,
    color:      '#6B6B7A',
    fontWeight: '500',
  },
  chipTextActive: {
    color: '#FFF',
  },
  listContent: {
    paddingBottom: 24,
    paddingTop: 4,
  },
  empty: {
    flex:           1,
    alignItems:     'center',
    justifyContent: 'center',
    paddingBottom:  60,
  },
  emptyTitle: {
    fontSize:     18,
    fontWeight:   '600',
    color:        '#303047',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color:    '#6B6B7A',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});
