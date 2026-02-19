import type { Metadata } from 'next';
import { IBM_Plex_Mono, IBM_Plex_Sans, IBM_Plex_Sans_Condensed } from 'next/font/google';
import './globals.css';
import type { ReactNode } from 'react';

const sans = IBM_Plex_Sans({ subsets: ['latin'], variable: '--font-sans', weight: ['400', '500', '600'] });
const condensed = IBM_Plex_Sans_Condensed({
  subsets: ['latin'],
  variable: '--font-condensed',
  weight: ['400', '600'],
});
const mono = IBM_Plex_Mono({ subsets: ['latin'], variable: '--font-mono', weight: ['400', '500'] });

export const metadata: Metadata = {
  title: 'Karen Legal Suite',
  description: 'Construction litigation practice management + AI workforce',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${condensed.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
