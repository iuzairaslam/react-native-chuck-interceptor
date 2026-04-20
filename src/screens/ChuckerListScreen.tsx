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
  SafeAreaView,
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
  const { requests, clearRequests } = useChuckerContext();
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
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#0D0D1A" translucent={false} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.headerBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={styles.headerBtnText}>Close</Text>
        </TouchableOpacity>
        <View style={styles.headerTitle}>
          <Text style={styles.title}>Chucker</Text>
          <Text style={styles.subtitle}>{requests.length} requests</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={handleClear} style={styles.headerBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Text style={styles.headerBtnText}>Clear</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onOpenSettings} style={styles.headerBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Text style={styles.headerBtnText}>Settings</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Search bar */}
      <View style={styles.searchBar}>
        <Text style={styles.searchIcon}>Search</Text>
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Search URL, method, status..."
          placeholderTextColor="#37474F"
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
            style={[styles.chip, filter === f.key && styles.chipActive]}
            onPress={() => setFilter(f.key)}
          >
            <Text style={[styles.chipText, filter === f.key && styles.chipTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* List */}
      {filtered.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>
            {requests.length === 0 ? 'No requests yet' : 'No matching requests'}
          </Text>
          <Text style={styles.emptySubtitle}>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex:            1,
    backgroundColor: '#0D0D1A',
  },
  header: {
    flexDirection:   'row',
    alignItems:      'center',
    paddingTop:      Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : 0,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#0D0D1A',
    borderBottomWidth: 1,
    borderBottomColor: '#1E2748',
    gap:             8,
  },
  headerBtn: {
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  headerBtnText: {
    fontSize: 13,
    color:    '#B0BEC5',
    fontWeight: '600',
  },
  headerTitle: {
    flex:      1,
    alignItems: 'center',
  },
  title: {
    fontSize:   17,
    fontWeight: '700',
    color:      '#E0E0E0',
    letterSpacing: 0.3,
  },
  subtitle: {
    fontSize: 12,
    color:    '#546E7A',
    marginTop: 1,
  },
  headerRight: {
    flexDirection: 'row',
    gap:           4,
  },
  searchBar: {
    flexDirection:   'row',
    alignItems:      'center',
    backgroundColor: '#1A1A2E',
    marginHorizontal: 12,
    marginTop:       12,
    marginBottom:    8,
    borderRadius:    10,
    paddingHorizontal: 12,
    height:          42,
    borderWidth: 1,
    borderColor: '#1E2748',
  },
  searchIcon: {
    fontSize:    12,
    marginRight: 10,
    color: '#546E7A',
    fontWeight: '600',
  },
  searchInput: {
    flex:      1,
    color:     '#E0E0E0',
    fontSize:  14,
    padding:   0,
  },
  filterRow: {
    flexDirection:   'row',
    paddingHorizontal: 12,
    gap:             6,
    marginBottom:    8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical:    5,
    borderRadius:      20,
    backgroundColor:   '#1A1A2E',
    borderWidth:       1,
    borderColor:       '#1E2748',
  },
  chipActive: {
    backgroundColor: '#D97757',
    borderColor:     '#D97757',
  },
  chipText: {
    fontSize:   12,
    color:      '#546E7A',
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
    color:        '#546E7A',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color:    '#37474F',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});
