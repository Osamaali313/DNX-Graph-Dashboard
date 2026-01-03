'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { NAV_ITEMS, APP_NAME } from '@/lib/constants';
import * as LucideIcons from 'lucide-react';
import { LucideIcon } from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 border-r bg-background relative">
      <div className="absolute inset-0 bg-gradient-to-b from-purple-500/5 via-transparent to-blue-500/5 pointer-events-none" />
      <div className="flex h-full flex-col relative z-10">
        <div className="flex h-16 items-center border-b px-6">
          <Link href="/" className="flex items-center gap-2 font-semibold group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl gradient-purple text-white shadow-lg group-hover:shadow-xl transition-all group-hover:scale-105">
              <span className="text-sm font-bold">DN</span>
            </div>
            <span className="text-sm bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">{APP_NAME}</span>
          </Link>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-4">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            const Icon = (LucideIcons as Record<string, LucideIcon>)[item.icon];

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg shadow-purple-500/30'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground hover:translate-x-1'
                )}
              >
                {Icon && <Icon className="h-5 w-5" />}
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="border-t p-4">
          <div className="rounded-xl glass p-4 shadow-lg">
            <p className="text-xs font-semibold text-muted-foreground">Database Status</p>
            <div className="mt-2 flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse shadow-lg shadow-green-500/50" />
              <span className="text-xs font-medium">Connected</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
