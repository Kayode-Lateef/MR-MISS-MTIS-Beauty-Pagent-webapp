// lib/theme.ts

export const theme = {
  colors: {
    // Primary - Deep Blue (from logo)
    primary: {
      DEFAULT: "#1a2c5e", // Deep navy blue
      light: "#2a3d6e",
      dark: "#0f1e3d",
      hover: "#22376a",
    },
    // Secondary - Wine Red (from logo)
    secondary: {
      DEFAULT: "#7a2e4a", // Wine red
      light: "#8f3e5c",
      dark: "#5c1f36",
      hover: "#8a3453",
    },
    // Accent - Gold/Brass for highlights
    accent: {
      DEFAULT: "#c4a43e",
      light: "#d4b454",
      dark: "#a0842e",
    },
    // Neutral colors (keeping white/off-white)
    neutral: {
      white: "#ffffff",
      offWhite: "#f8f9fa",
      gray: {
        50: "#f9fafb",
        100: "#f3f4f6",
        200: "#e5e7eb",
        300: "#d1d5db",
        400: "#9ca3af",
        500: "#6b7280",
        600: "#4b5563",
        700: "#374151",
        800: "#1f2937",
        900: "#111827",
      },
    },
  },
  gradients: {
    primary: "linear-gradient(135deg, #1a2c5e 0%, #2a3d6e 100%)",
    secondary: "linear-gradient(135deg, #7a2e4a 0%, #8f3e5c 100%)",
    accent: "linear-gradient(135deg, #c4a43e 0%, #d4b454 100%)",
    hero: "linear-gradient(135deg, #1a2c5e 0%, #7a2e4a 100%)",
  },
  shadows: {
    sm: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
    md: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
    lg: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
    primary: "0 4px 14px 0 rgba(26, 44, 94, 0.25)",
    secondary: "0 4px 14px 0 rgba(122, 46, 74, 0.25)",
  },
};

export type Theme = typeof theme;