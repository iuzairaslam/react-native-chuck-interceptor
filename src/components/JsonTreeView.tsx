// ─────────────────────────────────────────────────────────────────────────────
// react-native-chuck-interceptor — JSON Tree View
// Renders JSON as an interactive collapsible tree
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState } from 'react';
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useChuckerContext } from '../context';
import { ChuckerPalette, useChuckerPalette } from '../theme';

type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

interface JsonNodeProps {
  value:       JsonValue;
  keyName?:    string;
  depth:       number;
  isLast:      boolean;
  palette: ChuckerPalette;
}

const INDENT = 16;
const COLORS = {
  key:        '#303047',
  string:     '#1F7A43',
  number:     '#B45309',
  boolean:    '#B42318',
  null:       '#8A8A99',
  bracket:    '#6B6B7A',
  collapsed:  '#6B6B7A',
  toggle:     '#8A8A99',
};

function JsonNode({ value, keyName, depth, isLast, palette }: JsonNodeProps) {
  const [collapsed, setCollapsed] = useState(depth >= 2);
  const isObject  = typeof value === 'object' && value !== null && !Array.isArray(value);
  const isArray   = Array.isArray(value);
  const isComplex = isObject || isArray;

  const indent = depth * INDENT;
  const keys   = isObject ? Object.keys(value as object) : [];
  const items  = isArray  ? (value as JsonValue[])        : [];
  const count  = isObject ? keys.length                   : items.length;
  const open   = isArray  ? '['                           : '{';
  const close  = isArray  ? ']'                           : '}';
  const comma  = isLast   ? ''                            : ',';

  if (isComplex) {
    return (
      <View>
        <TouchableOpacity
          onPress={() => setCollapsed(!collapsed)}
          activeOpacity={0.7}
          style={[styles.row, { paddingLeft: indent }]}
        >
          <Text style={[styles.toggle, { color: palette.subtleText }]}>{collapsed ? '▶' : '▼'} </Text>
          {keyName !== undefined && (
            <Text style={[styles.key, { color: palette.mutedText }]}>"{keyName}": </Text>
          )}
          <Text style={[styles.bracket, { color: palette.mutedText }]}>{open}</Text>
          {collapsed && (
            <Text style={[styles.collapsed, { color: palette.subtleText }]}>
              {' '}
              {count} {count === 1 ? 'item' : 'items'}
            </Text>
          )}
          <Text style={[styles.bracket, { color: palette.mutedText }]}>{collapsed ? close : ''}</Text>
          {collapsed && <Text style={[styles.punctuation, { color: palette.subtleText }]}>{comma}</Text>}
        </TouchableOpacity>

        {!collapsed && (
          <View>
            {isObject
              ? keys.map((k, i) => (
                  <JsonNode
                    key={k}
                    keyName={k}
                    value={(value as { [key: string]: JsonValue })[k]}
                    depth={depth + 1}
                    isLast={i === keys.length - 1}
                    palette={palette}
                  />
                ))
              : items.map((v, i) => (
                  <JsonNode
                    key={i}
                    value={v}
                    depth={depth + 1}
                    isLast={i === items.length - 1}
                    palette={palette}
                  />
                ))}
            <View style={[styles.row, { paddingLeft: indent }]}>
              <Text style={[styles.bracket, { color: palette.mutedText }]}>{close}</Text>
              <Text style={[styles.punctuation, { color: palette.subtleText }]}>{comma}</Text>
            </View>
          </View>
        )}
      </View>
    );
  }

  // Primitive value
  let valueEl: React.ReactNode;
  if (typeof value === 'string') {
    valueEl = <Text style={styles.string}>"{value}"</Text>;
  } else if (typeof value === 'number') {
    valueEl = <Text style={styles.number}>{value}</Text>;
  } else if (typeof value === 'boolean') {
    valueEl = <Text style={styles.boolean}>{String(value)}</Text>;
  } else {
    valueEl = <Text style={styles.null}>null</Text>;
  }

  return (
    <View style={[styles.row, { paddingLeft: indent }]}>
      {keyName !== undefined && (
        <Text style={[styles.key, { color: palette.mutedText }]}>"{keyName}": </Text>
      )}
      {valueEl}
      <Text style={[styles.punctuation, { color: palette.subtleText }]}>{comma}</Text>
    </View>
  );
}

interface JsonTreeViewProps {
  json: string;
}

export function JsonTreeView({ json }: JsonTreeViewProps) {
  const { settings } = useChuckerContext();
  const palette = useChuckerPalette(settings);
  let parsed: JsonValue;
  try {
    parsed = JSON.parse(json);
  } catch {
    return (
      <ScrollView horizontal>
        <Text style={[styles.rawText, { color: palette.mutedText }]}>{json}</Text>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: palette.surface }]} horizontal={false}>
      <ScrollView horizontal>
        <View style={styles.tree}>
          <JsonNode value={parsed} depth={0} isLast palette={palette} />
        </View>
      </ScrollView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  tree: {
    padding: 12,
  },
  row: {
    flexDirection: 'row',
    flexWrap:      'nowrap',
    alignItems:    'flex-start',
    paddingVertical: 1,
  },
  key: {
    color:      COLORS.key,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize:   13,
  },
  string: {
    color:      COLORS.string,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize:   13,
    flexShrink: 1,
  },
  number: {
    color:      COLORS.number,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize:   13,
  },
  boolean: {
    color:      COLORS.boolean,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize:   13,
  },
  null: {
    color:      COLORS.null,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize:   13,
  },
  bracket: {
    color:      COLORS.bracket,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize:   13,
  },
  collapsed: {
    color:      COLORS.collapsed,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize:   13,
    fontStyle:  'italic',
  },
  punctuation: {
    color:      '#8A8A99',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize:   13,
  },
  toggle: {
    color:    COLORS.toggle,
    fontSize: 10,
    width:    14,
    marginTop: 2,
  },
  rawText: {
    color:      '#303047',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize:   13,
    padding:    12,
  },
});
