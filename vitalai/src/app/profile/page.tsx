'use client';

import React, { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import { toast } from 'sonner';
import { useAuth, User as AuthUser } from '@/context/AuthContext';
import {
  User,
  Mail,
  Lock,
  Save,
  Camera,
  Scale,
  Ruler,
  Activity,
  Target,
  ChevronDown,
  Check,
  Eye,
  EyeOff,
  Shield,
} from 'lucide-react';


type GoalType = 'lose_weight' | 'maintain' | 'gain_muscle';
type ActivityLevel = 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active' | 'extra_active';
type Gender = 'male' | 'female' | 'other';

interface ProfileData {
  name: string;
  email: string;
  age: string;
  gender: Gender;
  weight: string;
  height: string;
  activityLevel: ActivityLevel;
  goalType: GoalType;
}

const activityLabels: Record<ActivityLevel, string> = {
  sedentary: 'Sedentary (little or no exercise)',
  lightly_active: 'Lightly active (1–3 days/week)',
  moderately_active: 'Moderately active (3–5 days/week)',
  very_active: 'Very active (6–7 days/week)',
  extra_active: 'Extra active (physical job + exercise)',
};

const goalLabels: Record<GoalType, { label: string; desc: string; color: string }> = {
  lose_weight: { label: 'Weight Loss', desc: '500 kcal deficit/day', color: 'text-danger' },
  maintain: { label: 'Maintenance', desc: 'Match TDEE', color: 'text-success' },
  gain_muscle: { label: 'Weight Gain', desc: '500 kcal surplus/day', color: 'text-primary' },
};

export default function ProfilePage() {
  const { user, updateUser, logout, isLoading } = useAuth();
  const [profile, setProfile] = useState<ProfileData>({
    name: '',
    email: '',
    age: '',
    gender: 'female',
    weight: '',
    height: '',
    activityLevel: 'moderately_active',
    goalType: 'lose_weight',
  });

  const [activeTab, setActiveTab] = useState<'profile' | 'health' | 'security'>('profile');
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });

  // Sync local state with global auth state
  useEffect(() => {
    if (user) {
      setProfile({
        name: user.name || '',
        email: user.email || '',
        age: user.age?.toString() || '',
        gender: (user.gender as Gender) || 'female',
        weight: user.weight?.toString() || '',
        height: user.height?.toString() || '',
        activityLevel: (user.activityLevel as ActivityLevel) || 'moderately_active',
        goalType: (user.goalType as GoalType) || 'lose_weight',
      });
    }
  }, [user]);

  const handleUpdatePassword = async () => {
    if (!passwords.current || !passwords.new || !passwords.confirm) {
      toast.error('Please fill in all password fields');
      return;
    }

    if (passwords.new !== passwords.confirm) {
      toast.error('New passwords do not match');
      return;
    }

    // Load users DB to verify current password
    const users = JSON.parse(localStorage.getItem('vital_users_db') || '[]');
    const dbUser = users.find((u: any) => u.id === user?.id);

    if (!dbUser || dbUser.password !== passwords.current) {
      toast.error('Current password is incorrect');
      return;
    }

    // Update password in the "database"
    const updatedUsers = users.map((u: any) => 
      u.id === user?.id ? { ...u, password: passwords.new } : u
    );
    localStorage.setItem('vital_users_db', JSON.stringify(updatedUsers));
    
    toast.success('Password updated successfully');
    setPasswords({ current: '', new: '', confirm: '' });
  };

  const handleDownloadData = () => {
    const data = {
      profile: user,
      meals: JSON.parse(localStorage.getItem(`meals_${user?.id}`) || '[]'),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `healthmate_data_${user?.id}.json`;
    link.click();
    toast.success('Your data is ready for download');
  };

  const handleDeleteAccount = () => {
    if (window.confirm('Are you sure you want to delete your account? This action is permanent.')) {
      const users = JSON.parse(localStorage.getItem('vital_users_db') || '[]');
      const filteredUsers = users.filter((u: any) => u.id !== user?.id);
      localStorage.setItem('vital_users_db', JSON.stringify(filteredUsers));
      localStorage.removeItem(`meals_${user?.id}`);
      logout();
      toast.success('Account deleted successfully');
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    
    updateUser({
      name: profile.name,
      email: profile.email,
      age: parseInt(profile.age) || undefined,
      gender: profile.gender,
      weight: parseFloat(profile.weight) || undefined,
      height: parseFloat(profile.height) || undefined,
      activityLevel: profile.activityLevel,
      goalType: profile.goalType,
    });

    await new Promise((r) => setTimeout(r, 800));
    setIsSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  // Computed health metrics
  const weightKg = parseFloat(profile.weight) || 0;
  const heightCm = parseFloat(profile.height) || 0;
  const heightM = heightCm / 100;
  const bmi = heightM > 0 ? (weightKg / (heightM * heightM)).toFixed(1) : '—';
  const bmiNum = parseFloat(bmi);
  const bmiCategory =
    bmiNum < 18.5 ? 'Underweight' : bmiNum < 25 ? 'Normal' : bmiNum < 30 ? 'Overweight' : 'Obese';
  const ageNum = parseFloat(profile.age) || 0;
  const bmr =
    profile.gender === 'male'
      ? Math.round(10 * weightKg + 6.25 * heightCm - 5 * ageNum + 5)
      : Math.round(10 * weightKg + 6.25 * heightCm - 5 * ageNum - 161);
  const activityMultipliers: Record<ActivityLevel, number> = {
    sedentary: 1.2,
    lightly_active: 1.375,
    moderately_active: 1.55,
    very_active: 1.725,
    extra_active: 1.9,
  };
  const tdee = Math.round(bmr * activityMultipliers[profile.activityLevel]);
  const dailyGoal =
    profile.goalType === 'lose_weight' ? tdee - 500 : profile.goalType === 'gain_muscle' ? tdee + 500 : tdee;

  const tabs = [
    { id: 'profile' as const, label: 'Personal Info', icon: User },
    { id: 'health' as const, label: 'Health Metrics', icon: Activity },
    { id: 'security' as const, label: 'Security', icon: Shield },
  ];

  if (isLoading) {
    return (
      <AppLayout activeRoute="/profile">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </AppLayout>
    );
  }

  if (!user) {
    return (
      <AppLayout activeRoute="/profile">
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
          <h1 className="text-2xl font-bold text-foreground">Sign In Required</h1>
          <p className="text-muted-foreground mt-2">Please log in to manage your profile and health metrics.</p>
        </div>
      </AppLayout>
    );
  }

  const initials = user.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  return (
    <AppLayout activeRoute="/profile">
      <div className="px-4 sm:px-6 lg:px-8 xl:px-10 py-6 max-w-screen-lg mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">Profile Settings</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Manage your personal info and health goals</p>
          </div>
          {activeTab !== 'security' && (
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="btn-primary flex items-center gap-2 text-sm self-start sm:self-auto"
            >
              {saved ? (
                <>
                  <Check className="w-4 h-4" />
                  Saved!
                </>
              ) : isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Changes
                </>
              )}
            </button>
          )}
        </div>

        {/* Avatar + Quick Stats */}
        <div className="card-base p-5">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
            {/* Avatar */}
            <div className="relative shrink-0">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-2xl font-bold text-primary">{initials}</span>
              </div>
              <button className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-primary flex items-center justify-center shadow-md hover:bg-emerald-600 transition-colors">
                <Camera className="w-3.5 h-3.5 text-white" />
              </button>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0 text-center sm:text-left">
              <h2 className="text-lg font-bold text-foreground">{profile.name}</h2>
              <p className="text-sm text-muted-foreground">{profile.email}</p>
              <div className="flex flex-wrap justify-center sm:justify-start gap-3 mt-3">
                <span className="text-xs bg-muted px-3 py-1 rounded-full text-muted-foreground">
                  BMI: <strong className="text-foreground">{bmi}</strong> ({bmiCategory})
                </span>
                <span className="text-xs bg-muted px-3 py-1 rounded-full text-muted-foreground">
                  Daily Goal: <strong className="text-foreground">{dailyGoal.toLocaleString()} kcal</strong>
                </span>
                <span className={`text-xs px-3 py-1 rounded-full font-semibold ${
                  profile.goalType === 'lose_weight' ? 'bg-danger-light text-danger' :
                  profile.goalType === 'gain_muscle'? 'bg-primary-light text-primary' : 'bg-success-light text-success'
                }`}>
                  {goalLabels[profile.goalType].label}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-muted p-1 rounded-xl overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap flex-1 justify-center ${
                  activeTab === tab.id
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab: Personal Info */}
        {activeTab === 'profile' && (
          <div className="card-base p-5 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={profile.name}
                    onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
                    className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))}
                    className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  />
                </div>
              </div>

              {/* Age */}
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                  Age
                </label>
                <input
                  type="number"
                  value={profile.age}
                  onChange={(e) => setProfile((p) => ({ ...p, age: e.target.value }))}
                  min="10"
                  max="120"
                  className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
              </div>

              {/* Gender */}
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                  Gender
                </label>
                <div className="relative">
                  <select
                    value={profile.gender}
                    onChange={(e) => setProfile((p) => ({ ...p, gender: e.target.value as Gender }))}
                    className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary appearance-none"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other / Prefer not to say</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab: Health Metrics */}
        {activeTab === 'health' && (
          <div className="space-y-5">
            <div className="card-base p-5">
              <h3 className="text-sm font-semibold text-foreground mb-4">Body Measurements</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Weight */}
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                    Weight (kg)
                  </label>
                  <div className="relative">
                    <Scale className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="number"
                      value={profile.weight}
                      onChange={(e) => setProfile((p) => ({ ...p, weight: e.target.value }))}
                      step="0.1"
                      className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                    />
                  </div>
                </div>

                {/* Height */}
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                    Height (cm)
                  </label>
                  <div className="relative">
                    <Ruler className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="number"
                      value={profile.height}
                      onChange={(e) => setProfile((p) => ({ ...p, height: e.target.value }))}
                      className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                    />
                  </div>
                </div>

                {/* Activity Level */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                    Activity Level
                  </label>
                  <div className="relative">
                    <Activity className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <select
                      value={profile.activityLevel}
                      onChange={(e) => setProfile((p) => ({ ...p, activityLevel: e.target.value as ActivityLevel }))}
                      className="w-full pl-9 pr-8 py-2.5 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary appearance-none"
                    >
                      {(Object.entries(activityLabels) as [ActivityLevel, string][]).map(([val, label]) => (
                        <option key={val} value={val}>{label}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>

            {/* Goal Type */}
            <div className="card-base p-5">
              <h3 className="text-sm font-semibold text-foreground mb-4">Fitness Goal</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {(Object.entries(goalLabels) as [GoalType, typeof goalLabels[GoalType]][]).map(([type, info]) => (
                  <button
                    key={type}
                    onClick={() => setProfile((p) => ({ ...p, goalType: type }))}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      profile.goalType === type
                        ? 'border-primary bg-primary/5' :'border-border bg-card hover:border-primary/30'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <Target className={`w-4 h-4 ${info.color}`} />
                      {profile.goalType === type && <Check className="w-4 h-4 text-primary" />}
                    </div>
                    <p className="text-sm font-bold text-foreground">{info.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{info.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Computed Metrics */}
            <div className="card-base p-5">
              <h3 className="text-sm font-semibold text-foreground mb-4">Calculated Health Metrics</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'BMI', value: bmi, sub: bmiCategory },
                  { label: 'BMR', value: `${bmr.toLocaleString()}`, sub: 'kcal/day at rest' },
                  { label: 'TDEE', value: `${tdee.toLocaleString()}`, sub: 'kcal/day total' },
                  { label: 'Daily Goal', value: `${dailyGoal.toLocaleString()}`, sub: 'kcal/day target' },
                ].map((metric) => (
                  <div key={metric.label} className="rounded-xl bg-muted/40 border border-border p-3 text-center">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{metric.label}</p>
                    <p className="text-xl font-bold text-foreground mt-1 font-tabular">{metric.value}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{metric.sub}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab: Security */}
        {activeTab === 'security' && (
          <div className="card-base p-5 space-y-5">
            <h3 className="text-sm font-semibold text-foreground">Change Password</h3>
            <div className="space-y-4 max-w-md">
              {[
                { key: 'current', label: 'Current Password' },
                { key: 'new', label: 'New Password' },
                { key: 'confirm', label: 'Confirm New Password' },
              ].map((field) => (
                <div key={field.key}>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                    {field.label}
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={passwords[field.key as keyof typeof passwords]}
                      onChange={(e) => setPasswords((p) => ({ ...p, [field.key]: e.target.value }))}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-10 py-2.5 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              ))}
              <button 
                onClick={handleUpdatePassword}
                className="btn-primary flex items-center gap-2 text-sm mt-2"
              >
                <Lock className="w-4 h-4" />
                Update Password
              </button>
            </div>

            <div className="pt-5 border-t border-border">
              <h3 className="text-sm font-semibold text-foreground mb-3">Account Actions</h3>
              <div className="space-y-2">
                <button 
                  onClick={handleDownloadData}
                  className="w-full sm:w-auto flex items-center gap-2 px-4 py-2.5 rounded-lg border border-border text-sm text-muted-foreground hover:bg-muted transition-colors"
                >
                  Download My Data
                </button>
                <button 
                  onClick={handleDeleteAccount}
                  className="w-full sm:w-auto flex items-center gap-2 px-4 py-2.5 rounded-lg border border-danger/30 text-sm text-danger hover:bg-danger-light transition-colors"
                >
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
