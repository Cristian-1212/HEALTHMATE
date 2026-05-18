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
  ShieldAlert
} from 'lucide-react';

export default function Sidebar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  /**
   * Generates dynamic initials from the user's name
   */
  const getInitials = (fullName?: string) => {
    if (!fullName) return 'HM';

    return fullName
      .split(' ')
      .map((word) => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/user-dashboard' },
    { icon: Utensils, label: 'Meal Tracker', href: '/meal-tracker' },
    { icon: Brain, label: 'AI Insights', href: '/ai-insights' },
    { icon: BarChart3, label: 'Health Trends', href: '/user-dashboard' },
  ];

  return (
    <aside className="w-64 border-r border-border h-screen bg-card flex flex-col sticky top-0">
      {/* Step 4: Update Branding */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border/50">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
          <span className="text-white font-bold text-lg">H</span>
        </div>
        <span className="font-bold text-lg text-foreground tracking-tight">
          HealthMate
        </span>
      </div>

      {/* Step 3: Dynamic Profile Section */}
      <div className="flex items-center gap-3 p-4 border-b border-muted/40">
        {/* Avatar with dynamic initials */}
        <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm select-none shrink-0">
          {user?.name ? getInitials(user.name) : 'HM'}
        </div>

        {/* User Info from Auth Context */}
        <div className="flex flex-col min-w-0 flex-1">
          <span className="font-semibold text-sm text-foreground truncate">
            {user?.name || 'Guest User'}
          </span>
          <span className="text-xs text-muted-foreground truncate">
            {user?.email || 'not-signed-in@healthmate.io'}
          </span>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <Icon className="w-4 h-4" />
              {item.label}
            </Link>
          );
        })}

        {/* Admin Link (Conditional) */}
        {user?.role === 'admin' && (
          <Link
            href="/admin"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
              pathname === '/admin'
                ? 'bg-warning-light text-warning'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            Admin Panel
          </Link>
        )}
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
          onClick={() => {
            logout();
            router.push('/');
          }}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-danger hover:bg-danger-light transition-colors w-full text-left"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}