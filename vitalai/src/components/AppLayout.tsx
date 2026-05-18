'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  LogOut,
  LayoutDashboard,
  Utensils,
  BarChart3,
  Brain,
  Settings,
  ShieldAlert,
  Bell
} from 'lucide-react';

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  badge?: number;
}

interface AppLayoutProps {
  children: React.ReactNode;
  activeRoute?: string;
}

export default function AppLayout({ children, activeRoute }: AppLayoutProps) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  // Step 3: Add Initials Helper Function
  const getInitials = (name: string) => {
    if (!name) return 'HM';

    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const navItems: NavItem[] = [
    { name: 'Dashboard', href: '/user-dashboard', icon: LayoutDashboard },
    { name: 'Meal Tracker', href: '/meal-tracker', icon: Utensils },
    { name: 'Health Trends', href: '/user-dashboard', icon: BarChart3 },
    { name: 'AI Insights', href: '/ai-insights', icon: Brain },
    {
      name: 'Reminders',
      href: '/reminders',
      icon: Bell,
      badge: 2
    },
    { name: 'Settings', href: '/profile', icon: Settings }
  ];

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Sidebar Navigation */}
      <aside className="w-64 border-r border-border h-screen bg-card flex flex-col sticky top-0">
        {/* Step 5: Update Branding */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border/50">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-white font-bold text-lg">H</span>
          </div>
          <span className="font-bold text-lg text-foreground tracking-tight">
            HealthMate
          </span>
        </div>

        {/* Step 4: Replace the Hardcoded Profile Block */}
        <div className="flex items-center gap-3 p-4 border-b border-muted/40">
          <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm select-none shrink-0">
            {user?.name ? getInitials(user.name) : 'HM'}
          </div>

          <div className="flex flex-col min-w-0 flex-1">
            <span className="font-semibold text-sm text-foreground truncate">
              {user?.name || 'Guest User'}
            </span>
            <span className="text-xs text-muted-foreground truncate">
              {user?.email || 'user@healthmate.io'}
            </span>
          </div>
        </div>

        {/* Main Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center justify-between px-3 py-2 rounded-xl transition-all duration-200 ${
                  activeRoute === item.href
                    ? 'bg-emerald-50 text-emerald-700 font-medium'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-5 h-5" />
                  <span>{item.name}</span>
                </div>

                {/* Notification Badge */}
                {item.badge && (
                  <span className="bg-emerald-600 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer Section */}
        <div className="p-3 border-t border-border space-y-1">
          <Link
            href="/profile"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <Settings className="w-4 h-4" />
            Settings
          </Link>
          <button
            onClick={async () => {
              await logout();
              router.push('/');
            }}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-danger hover:bg-danger-light transition-colors w-full text-left"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}