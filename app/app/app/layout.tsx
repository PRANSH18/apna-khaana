'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, CalendarDays, ReceiptIndianRupee, Repeat, UserRound } from 'lucide-react';
import { MobileTabBar } from '@/components/MobileTabBar';

const NAV = [
  { href: '/app', label: 'Overview', icon: LayoutDashboard },
  { href: '/app/plan', label: 'My plan', icon: CalendarDays },
  { href: '/app/orders', label: 'Orders', icon: ReceiptIndianRupee },
  { href: '/app/subscription', label: 'Subscription', icon: Repeat },
  { href: '/app/account', label: 'Account', icon: UserRound },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="mx-auto flex max-w-7xl gap-10 px-6 py-8 pb-tabbar">
      <aside className="hidden w-52 shrink-0 md:block">
        <p className="mb-8 text-xs font-semibold uppercase tracking-[.12em] text-leaf">Your kitchen</p>
        <nav className="space-y-1 text-sm">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 font-medium transition ${active ? 'bg-wash text-leaf' : 'text-ink/65 hover:bg-wash/60 hover:text-leaf'}`}
              >
                <Icon size={17} />
                {label}
              </Link>
            );
          })}
        </nav>
      </aside>
      <main className="min-w-0 flex-1">{children}</main>
      <MobileTabBar />
    </div>
  );
}
