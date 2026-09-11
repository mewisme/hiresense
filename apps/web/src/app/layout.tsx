import type { Metadata } from 'next';
import { Geist_Mono, Inter } from 'next/font/google';

import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@hiresense/ui/components/toast';
import { TooltipProvider } from '@hiresense/ui/components/tooltip';
import { cn } from '@hiresense/ui/lib/utils';
import '@hiresense/ui/globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

const fontMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
});

export const metadata: Metadata = {
  title: 'HireSense',
  description: 'AI-assisted recruitment and explainable CV-job matching.',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn('h-full antialiased font-sans', inter.variable, fontMono.variable)}
    >
      <body className="flex min-h-full flex-col">
        <ThemeProvider>
          <TooltipProvider>
            <Toaster>{children}</Toaster>
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
