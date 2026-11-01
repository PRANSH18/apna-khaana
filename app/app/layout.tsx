import type { Metadata } from 'next';
import './globals.css';
import { Nav } from '@/components/Nav';

export const metadata: Metadata = {
  title: 'Apna Khaana | Your week, cooked with care',
  description: 'Personalised Indian meals, planned for your week.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-paper text-ink antialiased">
        <Nav />
        {children}
        <footer className="border-t border-ink/10 px-6 py-12">
          <div className="mx-auto flex max-w-6xl flex-col gap-4 text-sm text-ink/60 sm:flex-row sm:items-center sm:justify-between">
            <span className="font-display text-xl text-ink">apna khaana</span>
            <span>Made for Bengaluru, one good week at a time.</span>
          </div>
        </footer>
      </body>
    </html>
  );
}