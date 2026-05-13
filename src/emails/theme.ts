export const theme = {
  colors: {
    primary: '#d62013',
    primaryDark: '#a3140b',
    primarySoft: '#fef2f2',
    primaryBorder: '#fecaca',
    ink: '#1a1a1a',
    body: '#2d2d2d',
    muted: '#6b6b6b',
    subtle: '#9a9a9a',
    line: '#e8e8e8',
    surface: '#ffffff',
    canvas: '#f5f1ec',
  },
  fonts: {
    serif: "'Georgia', 'Times New Roman', serif",
    sans: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
  },
  siteUrl: (import.meta.env.SITE_URL as string) || 'https://madame-ardent.com',
} as const;
