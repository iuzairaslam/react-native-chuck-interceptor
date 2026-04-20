// ─────────────────────────────────────────────────────────────────────────────
// react-native-chuck-interceptor — JSON Tree View
// Renders JSON as an interactive collapsible tree
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState } from 'react';
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

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
}

const INDENT = 16;
const COLORS = {
  key:        '#89DDFF',
  string:     '#C3E88D',
  number:     '#F78C6C',
  boolean:    '#FF5370',
  null:       '#B2CCD6',
  bracket:    '#FFCB6B',
  collapsed:  '#82AAFF',
  toggle:     '#546E7A',
};

function JsonNode({ value, keyName, depth, isLast }: JsonNodeProps) {
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
          <Text style={styles.toggle}>{collapsed ? '▶' : '▼'} </Text>
          {keyName !== undefined && (
            <Text style={styles.key}>"{keyName}": </Text>
          )}
          <Text style={styles.bracket}>{open}</Text>
          {collapsed && (
            <Text style={styles.collapsed}>
              {' '}
              {count} {count === 1 ? 'item' : 'items'}
            </Text>
          )}
          <Text style={styles.bracket}>{collapsed ? close : ''}</Text>
          {collapsed && <Text style={styles.punctuation}>{comma}</Text>}
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
                  />
                ))
              : items.map((v, i) => (
                  <JsonNode
                    key={i}
                    value={v}
                    depth={depth + 1}
                    isLast={i === items.length - 1}
                  />
                ))}
            <View style={[styles.row, { paddingLeft: indent }]}>
              <Text style={styles.bracket}>{close}</Text>
              <Text style={styles.punctuation}>{comma}</Text>
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
        <Text style={styles.key}>"{keyName}": </Text>
      )}
      {valueEl}
      <Text style={styles.punctuation}>{comma}</Text>
    </View>
  );
}

interface JsonTreeViewProps {
  json: string;
}

export function JsonTreeView({ json }: JsonTreeViewProps) {
  let parsed: JsonValue;
  try {
    parsed = JSON.parse(json);
  } catch {
    return (
      <ScrollView horizontal>
        <Text style={styles.rawText}>{json}</Text>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container} horizontal={false}>
      <ScrollView horizontal>
        <View style={styles.tree}>
          <JsonNode value={parsed} depth={0} isLast />
        </View>
      </ScrollView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    color:      '#546E7A',
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
    color:      '#CFD8DC',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize:   13,
    padding:    12,
  },
});
