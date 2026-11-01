'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, CalendarDays, ReceiptIndianRupee, Repeat, UserRound } from 'lucide-react';

const TABS = [
  { href: '/app', label: 'Home', icon: LayoutDashboard },
  { href: '/app/plan', label: 'Plan', icon: CalendarDays },
  { href: '/app/orders', label: 'Orders', icon: ReceiptIndianRupee },
  { href: '/app/subscription', label: 'Plan+', icon: Repeat },
  { href: '/app/account', label: 'Account', icon: UserRound },
];

export function MobileTabBar() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-ink/10 bg-paper/95 backdrop-blur md:hidden">
      <div className="mx-auto flex max-w-6xl items-stretch justify-between px-2 py-1.5">
        {TABS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-1 flex-col items-center gap-1 rounded-xl py-2 text-[11px] font-medium ${active ? 'text-leaf' : 'text-ink/50'}`}
            >
              <Icon size={20} className={active ? 'text-leaf' : 'text-ink/45'} />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
