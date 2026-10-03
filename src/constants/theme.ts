/**
 * ArcSense design system
 *
 * Visual direction:
 * Clean student productivity + subtle futuristic "arc" feel.
 */

import "@/global.css";

import { Platform } from "react-native";

export const Colors = {
  light: {
    text: "#0B1220",
    background: "#F7F9FC",
    backgroundElement: "#EAF1FA",
    backgroundSelected: "#DCE9F8",
    textSecondary: "#607089",
  },

  dark: {
    text: "#F7FBFF",
    background: "#07111F",
    backgroundElement: "#10243A",
    backgroundSelected: "#16375A",
    textSecondary: "#9FB0C5",
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    sans: "system-ui",
    serif: "ui-serif",
    rounded: "ui-rounded",
    mono: "ui-monospace",
  },

  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },

  web: {
    sans: "var(--font-display)",
    serif: "var(--font-serif)",
    rounded: "var(--font-rounded)",
    mono: "var(--font-mono)",
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

export const BottomTabInset =
  Platform.select({
    ios: 50,
    android: 80,
  }) ?? 0;

export const MaxContentWidth = 800;
