import type { Metadata } from 'next';
import { Unbounded, Manrope, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const unbounded = Unbounded({
  subsets: ['latin'],
  variable: '--font-display',
});

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-body',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
});

export const metadata: Metadata = {
  title: 'FORMA | Your AI Fitness Coach',
  description: 'Train smarter. Move better. Become FORMA. Adaptive coaching powered by multimodal AI.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${unbounded.variable} ${manrope.variable} ${jetbrainsMono.variable}`}>
      <body className="font-body bg-[var(--color-void)] text-[var(--color-text-main)] antialiased selection:bg-[#7c3aed] selection:text-white" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
