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
      bg: '#0D0D1A',
      surface: '#111128',
      border: '#1E2748',
      text: '#E0E0E0',
      mutedText: '#B0BEC5',
      subtleText: '#546E7A',
      chipBg: '#1A1A2E',
    };
  }

  // light
  return {
    primary,
    bg: '#F7F7FA',
    surface: '#FFFFFF',
    border: '#E7E7EE',
    text: '#12121A',
    mutedText: '#303047',
    subtleText: '#8A8A99',
    chipBg: '#F7F7FA',
  };
}

export function useChuckerPalette(settings: Pick<ChuckerSettings, 'theme' | 'primaryColor'>): ChuckerPalette {
  const system = useColorScheme();
  const systemMode = system === 'dark' || system === 'light' ? system : null;
  return useMemo(() => getPalette(settings, systemMode), [settings.primaryColor, settings.theme, systemMode]);
}

