/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

// 🔵 Power Plugs brand palette — deep navy, royal/electric blue, sky accent.
export const Brand = {
  navy900: '#0A1830',
  navy800: '#122A4D',
  navy700: '#1B3A66',
  blue700: '#1D4ED8',
  blue600: '#2563EB',
  blue500: '#3B82F6',
  sky400: '#38BDF8',
  sky300: '#7DD3FC',
  success: '#16A34A',
  warning: '#D97706',
  danger: '#DC2626',
} as const;

export const Colors = {
  light: {
    text: '#0F1E33',
    background: '#F4F7FC',
    backgroundElement: '#EAF1FB',
    backgroundSelected: '#E2E9F5',
    textSecondary: '#5B6B85',
  },
  dark: {
    text: '#EAF1FB',
    background: '#070F20',
    backgroundElement: '#101E38',
    backgroundSelected: '#132845',
    textSecondary: '#93A5C2',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
