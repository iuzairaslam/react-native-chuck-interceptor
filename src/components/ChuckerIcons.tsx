import React from 'react';
import { View } from 'react-native';

export type ChuckerIconProps = {
  color: string;
  size?: number;
};

function stroke(size: number): number {
  return Math.max(2, Math.round(size * 0.11));
}

/** Left chevron — built from borders only (no icon fonts). */
export function ChevronBackIcon({ color, size = 22 }: ChuckerIconProps) {
  const s = size * 0.4;
  const st = stroke(size);
  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <View
        style={{
          width: s,
          height: s,
          borderLeftWidth: st,
          borderBottomWidth: st,
          borderColor: color,
          transform: [{ rotate: '45deg' }],
          marginLeft: size * 0.12,
        }}
      />
    </View>
  );
}

/** Share — upturned arrow over a tray outline. */
export function ShareIcon({ color, size = 22 }: ChuckerIconProps) {
  const st = stroke(size);
  const arr = size * 0.26;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View
        style={{
          width: arr,
          height: arr,
          borderLeftWidth: st,
          borderTopWidth: st,
          borderColor: color,
          transform: [{ rotate: '45deg' }],
          marginBottom: -size * 0.04,
        }}
      />
      <View
        style={{
          width: size * 0.54,
          height: size * 0.2,
          borderWidth: st,
          borderColor: color,
          borderTopWidth: 0,
          borderBottomLeftRadius: 3,
          borderBottomRightRadius: 3,
        }}
      />
    </View>
  );
}

/** Close — two crossing bars. */
export function CloseIcon({ color, size = 22 }: ChuckerIconProps) {
  const st = stroke(size);
  const bar = size * 0.52;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View
        style={{
          position: 'absolute',
          width: bar,
          height: st,
          backgroundColor: color,
          borderRadius: st / 2,
          transform: [{ rotate: '45deg' }],
        }}
      />
      <View
        style={{
          position: 'absolute',
          width: bar,
          height: st,
          backgroundColor: color,
          borderRadius: st / 2,
          transform: [{ rotate: '-45deg' }],
        }}
      />
    </View>
  );
}

/** Settings — three horizontal rules (system-settings pattern). */
export function SettingsIcon({ color, size = 22 }: ChuckerIconProps) {
  const st = stroke(size);
  const g = size * 0.11;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ width: size * 0.62, height: st, backgroundColor: color, borderRadius: st / 2, marginBottom: g }} />
      <View style={{ width: size * 0.42, height: st, backgroundColor: color, borderRadius: st / 2, marginBottom: g }} />
      <View style={{ width: size * 0.55, height: st, backgroundColor: color, borderRadius: st / 2 }} />
    </View>
  );
}

/** Trash — lid + can outline. */
export function TrashIcon({ color, size = 22 }: ChuckerIconProps) {
  const st = stroke(size);
  const binW = size * 0.44;
  const binH = size * 0.38;
  const lidW = size * 0.52;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View
        style={{
          width: lidW,
          height: st * 1.1,
          backgroundColor: color,
          borderRadius: st,
          marginBottom: size * 0.04,
        }}
      />
      <View
        style={{
          width: binW,
          height: binH,
          borderWidth: st,
          borderColor: color,
          borderTopWidth: 0,
          borderBottomLeftRadius: 4,
          borderBottomRightRadius: 4,
        }}
      />
    </View>
  );
}
