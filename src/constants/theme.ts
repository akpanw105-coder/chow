/**
 * Chow Design System — Design Tokens
 * Extracted from Stitch exports: calabar_kitchen_contemporary_food_experience/DESIGN.md
 * Brand palette: Fiery coral red primary, warm off-white canvas, crisp white cards.
 */

import { Platform } from 'react-native';

// ─── Brand Colors ────────────────────────────────────────────────────────────
export const ChowColors = {
  // Primary coral red — CTAs, active states, quantity plus counters
  primary: '#FF493D',
  primaryHover: '#E03E33',
  primaryGlow: 'rgba(255, 73, 61, 0.28)',

  // Secondary warm peach — selected chip fills, tag backdrops
  secondary: '#F8D6C8',
  secondaryLight: '#FFF2EE',

  // Canvas and surfaces
  canvas: '#F8F9FA',      // warm off-white background
  canvasAlt: '#FAF9F7',   // slightly warmer variant
  surface: '#FFFFFF',     // pure white cards

  // Typography
  textPrimary: '#111827',   // deep charcoal for headings, prices
  textDark: '#111827',      // alias: same as textPrimary — used in Checkout & Cart screens
  textSecondary: '#6B7280', // mid-grey for descriptions, metadata
  textMuted: '#9CA3AF',     // disabled/placeholder text

  // Primary light / tint backgrounds
  primaryLight: '#FFF2EE',  // alias: same as secondaryLight — used for selected pay method bg

  // Borders
  border: '#F1F2F4',
  borderLight: 'rgba(0,0,0,0.03)',

  // Accent
  amber: '#FFAE35',
  amberStar: '#F59E0B',

  // Status
  success: '#22C55E',
  error: '#EF4444',

  // Naira formatting helper (not a color — just a constant)
  currency: '₦',
} as const;

// ─── Legacy Colors (kept for existing component compatibility) ─────────────────
export const Colors = {
  light: {
    text: '#111827',
    background: ChowColors.canvas,
    backgroundElement: '#F1F2F4',
    backgroundSelected: '#EAE8E3',
    textSecondary: '#6B7280',
  },
  dark: {
    text: '#F9FAFB',
    background: '#111827',
    backgroundElement: '#1F2937',
    backgroundSelected: '#374151',
    textSecondary: '#9CA3AF',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

// ─── Typography ───────────────────────────────────────────────────────────────
export const Typography = {
  headlineXl: { fontSize: 32, fontWeight: '700' as const, lineHeight: 38, letterSpacing: -0.64 },
  headlineLg: { fontSize: 24, fontWeight: '700' as const, lineHeight: 30, letterSpacing: -0.48 },
  headlineMd: { fontSize: 20, fontWeight: '600' as const, lineHeight: 26, letterSpacing: -0.2 },
  headlineSm: { fontSize: 17, fontWeight: '600' as const, lineHeight: 22, letterSpacing: -0.17 },
  bodyLg: { fontSize: 15, fontWeight: '400' as const, lineHeight: 22 },
  bodyMd: { fontSize: 13, fontWeight: '400' as const, lineHeight: 18 },
  labelLg: { fontSize: 15, fontWeight: '600' as const, lineHeight: 20 },
  labelMd: { fontSize: 13, fontWeight: '500' as const, lineHeight: 16, letterSpacing: 0.13 },
  labelSm: { fontSize: 11, fontWeight: '500' as const, lineHeight: 14, letterSpacing: 0.22 },
  priceDisplay: { fontSize: 20, fontWeight: '700' as const, lineHeight: 24, letterSpacing: -0.2 },
  priceLg: { fontSize: 24, fontWeight: '800' as const, lineHeight: 28, letterSpacing: -0.48 },
} as const;

// ─── Spacing ─────────────────────────────────────────────────────────────────
export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  gutter: 16,
  margin: 20,
} as const;

// ─── Border Radius ────────────────────────────────────────────────────────────
export const Radius = {
  sm: 8,
  DEFAULT: 16,
  md: 24,
  lg: 32,
  xl: 48,
  full: 9999,
  card: 16,
  button: 12,
  input: 10,
  chip: 8,
  circle: 9999,
} as const;

// ─── Shadows ─────────────────────────────────────────────────────────────────
export const Shadows = {
  card: {
    shadowColor: '#1E1E24',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 24,
    elevation: 2,
  },
  subtle: {
    shadowColor: '#1E1E24',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 12,
    elevation: 1,
  },
  float: {
    shadowColor: '#1E1E24',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08,
    shadowRadius: 32,
    elevation: 4,
  },
  primaryGlow: {
    shadowColor: '#FF493D',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 20,
    elevation: 6,
  },
  nav: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.04,
    shadowRadius: 18,
    elevation: 8,
  },
} as const;

// ─── Platform helpers ─────────────────────────────────────────────────────────
export const Fonts = Platform.select({
  ios: { sans: 'Inter', mono: 'Courier' },
  android: { sans: 'Inter', mono: 'monospace' },
  default: { sans: 'Inter', mono: 'monospace' },
});

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
