import type { Metadata } from 'next';
import { Inter, Geist } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Ayush Singh — Software Engineer',
  description: 'Backend engineer and systems programmer building production-grade distributed systems, AI agents, and Rust-based infrastructure.',
  icons: {
    icon: [{ url: '/avatar.jpg', type: 'image/jpeg' }],
    apple: [{ url: '/avatar.jpg', type: 'image/jpeg' }],
    shortcut: '/avatar.jpg',
  },
  openGraph: {
    title: 'Ayush Singh — Software Engineer',
    description: 'Backend engineer and systems programmer building production-grade distributed systems, AI agents, and Rust-based infrastructure.',
    images: ['/avatar.jpg'],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Ayush Singh — Software Engineer',
    description: 'Backend engineer and systems programmer building production-grade distributed systems, AI agents, and Rust-based infrastructure.',
    images: ['/avatar.jpg'],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className={cn("font-sans", geist.variable)}>
      <head>
        <script defer src="https://cloud.umami.is/script.js" data-website-id="c690b6ce-058c-4ea6-ba59-1103bcd8d636"></script>
      </head>
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
