/**
 * useTheme — returns the current colour set based on the device colour scheme.
 * Wraps Colors[scheme] so components don't need to call useColorScheme directly.
 */
import { useColorScheme } from 'react-native';

import { Colors } from '@/constants/theme';

export function useTheme() {
  const scheme = useColorScheme();
  return Colors[scheme === 'dark' ? 'dark' : 'light'];
}
