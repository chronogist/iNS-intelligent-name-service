// Re-export client components
export { ThemeProvider, useTheme } from '@/components/ThemeProvider';

// Export types for server-side use
export type Theme = 'light' | 'dark';

export interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}
