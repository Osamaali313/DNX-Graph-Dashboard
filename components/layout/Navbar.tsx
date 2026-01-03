'use client';

import { Search, Bell, User } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';
import { APP_NAME } from '@/lib/constants';

export default function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-lg">
      <div className="flex h-16 items-center gap-4 px-6">
        <div className="flex flex-1 items-center gap-4">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search transactions, AFEs, owners..."
              className="pl-9 border-muted-foreground/20 focus-visible:ring-purple-500 bg-muted/50"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />

          <Button variant="ghost" size="icon" className="relative hover:bg-muted transition-all hover:scale-105">
            <Bell className="h-5 w-5" />
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500 animate-pulse shadow-lg shadow-red-500/50" />
          </Button>

          <Button variant="ghost" size="icon" className="hover:bg-muted transition-all hover:scale-105">
            <User className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}
