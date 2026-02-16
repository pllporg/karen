import type { Metadata } from 'next';
import { Space_Grotesk, IBM_Plex_Serif } from 'next/font/google';
import './globals.css';
import type { ReactNode } from 'react';

const sans = Space_Grotesk({ subsets: ['latin'], variable: '--font-sans' });
const serif = IBM_Plex_Serif({ subsets: ['latin'], variable: '--font-serif', weight: ['400', '700'] });

export const metadata: Metadata = {
  title: 'Karen Legal Suite',
  description: 'Construction litigation practice management + AI workforce',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${serif.variable}`}>
      <body style={{ fontFamily: 'var(--font-sans)' }}>{children}</body>
    </html>
  );
}
