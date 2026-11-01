'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowUpRight, Leaf, Menu, X } from 'lucide-react';

const LINKS = [
  { href: '/menu', label: 'Menu' },
  { href: '/how-it-works', label: 'How it works' },
  { href: '/pricing', label: 'Pricing' },
];

export function Nav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-30 border-b border-ink/10 bg-paper/90 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2 font-display text-2xl text-ink" onClick={() => setOpen(false)}>
          <Leaf size={19} className="text-leaf" />
          apna khaana
        </Link>

        <div className="hidden items-center gap-7 text-sm font-medium text-ink/70 md:flex">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`transition hover:text-leaf ${pathname === link.href ? 'text-leaf' : ''}`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-3 text-sm">
          <Link href="/login" className="hidden font-medium text-ink/70 hover:text-leaf sm:block">
            Log in
          </Link>
          <Link
            href="/signup"
            className="hidden items-center gap-1 rounded-full bg-chili px-4 py-2 font-semibold text-white shadow-pop transition hover:bg-chili-dark sm:flex"
          >
            Build my week <ArrowUpRight size={15} />
          </Link>
          <button
            onClick={() => setOpen((o) => !o)}
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            className="flex items-center justify-center rounded-full border border-ink/15 p-2 text-ink md:hidden"
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </nav>

      {open && (
        <div className="border-t border-ink/10 bg-paper px-6 py-5 md:hidden">
          <div className="flex flex-col gap-1">
            {LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className={`rounded-lg px-3 py-3 text-base font-medium ${pathname === link.href ? 'bg-wash text-leaf' : 'text-ink/80'}`}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/login"
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-3 text-base font-medium text-ink/80"
            >
              Log in
            </Link>
          </div>
          <Link
            href="/signup"
            onClick={() => setOpen(false)}
            className="mt-4 flex items-center justify-center gap-1 rounded-full bg-chili px-5 py-3 text-base font-semibold text-white"
          >
            Build my week <ArrowUpRight size={16} />
          </Link>
        </div>
      )}
    </header>
  );
}
