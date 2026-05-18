'use client';

import React, { useState } from 'react';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';
import { Zap, TrendingUp, Brain, Shield } from 'lucide-react';
import AppLogo from '@/components/ui/AppLogo';


const featurePoints = [
  { icon: Brain, text: 'AI meal parsing — just type what you ate' },
  { icon: TrendingUp, text: 'Real-time calorie deficit tracking' },
  { icon: Zap, text: 'Personalized health insights & predictions' },
  { icon: Shield, text: 'HIPAA-aligned data privacy & security' },
];

export default function AuthScreen() {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');

  return (
    <div className="flex min-h-screen bg-background">
      {/* Left hero panel */}
      <div className="hidden lg:flex flex-col justify-between w-[45%] max-w-[550px] p-12 bg-emerald-900 text-white h-screen sticky top-0 overflow-hidden select-none">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
            <AppLogo size={28} />
          </div>
          <span className="text-white font-bold text-xl tracking-tight">HealthMate</span>
        </div>

        {/* Hero content */}
        <div className="my-auto py-12 space-y-8">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-1.5 text-xs font-medium bg-white/10 px-3 py-1 rounded-full text-emerald-200 mb-2">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
              AI-Powered Health Tracking
            </div>
            <h1 className="text-4xl font-bold text-white leading-tight">
              Track smarter.<br />
              Eat better.<br />
              <span className="text-emerald-400">Live healthier.</span>
            </h1>
            <p className="text-emerald-100/80 text-sm leading-relaxed max-w-sm">
              Log meals with natural language, get AI-powered insights, and reach your health goals with precision.
            </p>
          </div>

          {/* Feature list */}
          <ul className="space-y-3">
            {featurePoints?.map((fp, i) => {
              const Icon = fp?.icon;
              return (
                <li key={`feature-${i}`} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-white/85 text-sm font-medium">{fp?.text}</span>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
      {/* Right form panel */}
      <div className="flex-1 flex flex-col items-center p-6 sm:p-12 overflow-y-auto bg-background">
        <div className="w-full max-w-xl py-8 space-y-8">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
              <AppLogo size={24} />
            </div>
            <span className="font-bold text-lg text-foreground">HealthMate</span>
          </div>

          {/* Tabs */}
          <div className="flex bg-muted rounded-xl p-1">
            <button
              onClick={() => setActiveTab('login')}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${
                activeTab === 'login' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setActiveTab('register')}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${
                activeTab === 'register' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Forms */}
          <div className="slide-up">
            {activeTab === 'login' ? (
              <LoginForm onSwitchToRegister={() => setActiveTab('register')} />
            ) : (
              <RegisterForm onSwitchToLogin={() => setActiveTab('login')} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}