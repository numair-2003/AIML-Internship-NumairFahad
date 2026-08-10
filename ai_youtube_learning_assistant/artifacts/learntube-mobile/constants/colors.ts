/**
 * Design tokens synced from the sibling web artifact (artifacts/learntube/src/index.css).
 * HSL values converted to hex.
 */

const colors = {
  light: {
    text: '#181E2D',
    tint: '#2563EB',

    background: '#F3F5FA',   // hsl(220 20% 97%)
    foreground: '#181E2D',   // hsl(220 15% 12%)

    card: '#FFFFFF',
    cardForeground: '#181E2D',

    primary: '#2563EB',      // hsl(221 83% 53%)
    primaryForeground: '#FFFFFF',

    secondary: '#E8EBF4',    // hsl(220 14% 92%)
    secondaryForeground: '#3B4568',

    muted: '#EDF0F7',        // hsl(220 14% 94%)
    mutedForeground: '#737B8C',  // hsl(220 10% 50%)

    accent: '#EEF3FE',       // hsl(221 83% 96%)
    accentForeground: '#1A48C0',

    destructive: '#F03E3E',  // hsl(0 84% 60%)
    destructiveForeground: '#FFFFFF',

    border: '#DCE0EB',       // hsl(220 13% 88%)
    input: '#DCE0EB',
    ring: '#2563EB',
  },

  dark: {
    text: '#E5E8EE',
    tint: '#4B82F6',

    background: '#111827',   // hsl(220 18% 10%) - slightly darker for depth
    foreground: '#E5E8EE',   // hsl(220 10% 92%)

    card: '#1B2131',         // hsl(220 15% 13%)
    cardForeground: '#E5E8EE',

    primary: '#4B82F6',      // hsl(221 83% 60%) — slightly brightened
    primaryForeground: '#FFFFFF',

    secondary: '#272F42',    // hsl(220 14% 20%)
    secondaryForeground: '#B3B9C8',

    muted: '#232B3C',        // hsl(220 14% 18%)
    mutedForeground: '#80899A',  // hsl(220 10% 55%)

    accent: '#1F2E4F',       // hsl(221 40% 20%)
    accentForeground: '#93BBFB',

    destructive: '#D93025',  // hsl(0 72% 51%)
    destructiveForeground: '#FFFFFF',

    border: '#2D3549',       // hsl(220 13% 22%)
    input: '#2D3549',
    ring: '#4B82F6',
  },

  // Matches sibling web app's --radius: 0.5rem (8px)
  radius: 8,
};

export default colors;
