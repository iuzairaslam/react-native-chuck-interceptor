import { useMemo } from 'react';
import { useColorScheme } from 'react-native';
import type { ChuckerSettings, ChuckerTheme } from './types';

export type ChuckerPalette = {
  primary: string;

  bg: string;
  surface: string;
  border: string;

  text: string;
  mutedText: string;
  subtleText: string;

  chipBg: string;
};

function resolveTheme(theme: ChuckerTheme | undefined, system: 'light' | 'dark' | null): 'light' | 'dark' {
  if (theme === 'light' || theme === 'dark') return theme;
  return system === 'dark' ? 'dark' : 'light';
}

export function getPalette(settings: Pick<ChuckerSettings, 'theme' | 'primaryColor'>, system: 'light' | 'dark' | null): ChuckerPalette {
  const mode = resolveTheme(settings.theme, system);
  const primary = settings.primaryColor || '#D97757';

  if (mode === 'dark') {
    return {
      primary,
      bg: '#000000',
      surface: '#111111',
      border: '#3A3A3A',
      text: '#FFFFFF',
      mutedText: '#D0D0D0',
      subtleText: '#9A9A9A',
      chipBg: '#1F1F1F',
    };
  }

  // light
  return {
    primary,
    bg: '#FFFFFF',
    surface: '#FFFFFF',
    border: '#E4E4E4',
    text: '#121212',
    mutedText: '#2B2B2B',
    subtleText: '#666666',
    chipBg: '#F2F2F2',
  };
}

export function useChuckerPalette(settings: Pick<ChuckerSettings, 'theme' | 'primaryColor'>): ChuckerPalette {
  const system = useColorScheme();
  const systemMode = system === 'dark' || system === 'light' ? system : null;
  return useMemo(() => getPalette(settings, systemMode), [settings.primaryColor, settings.theme, systemMode]);
}

