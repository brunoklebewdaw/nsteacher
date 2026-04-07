'use client';

import { ThemeProvider } from '@/lib/theme-provider';

export function AdminProviders({ children }: { children: React.ReactNode }) {
  return <ThemeProvider>{children}</ThemeProvider>;
}
