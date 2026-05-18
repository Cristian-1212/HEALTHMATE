'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import AppLayout from '@/components/AppLayout';
import {
  Shield,
  Users,
  Database,
  FileText,
  Search,
  MoreVertical,
  UserX,
  Trash2,
  Eye,
  Plus,
  Edit2,
  ChevronDown,
  TrendingUp,
  Activity,
  AlertTriangle,
  Check,
  X,
} from 'lucide-react';


type UserStatus = 'active' | 'suspended' | 'inactive';
type AdminTab = 'overview' | 'users' | 'food' | 'audit';

interface AppUser {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  status: UserStatus;
  joined: string;
  lastActive: string;
  meals: number;
}

interface FoodItem {
  id: string;
  name: string;
  calories: number;
  serving: string;
  category: string;
}

interface AuditLog {
  id: string;
  user: string;
  action: string;
  detail: string;
  timestamp: string;
  type: 'login' | 'meal' | 'profile' | 'admin';
}

const mockFoods: FoodItem[] = [];

const mockAuditLogs: AuditLog[] = [];

const statusStyles: Record<UserStatus, string> = {
  active: 'bg-success-light text-success',
  suspended: 'bg-danger-light text-danger',
  inactive: 'bg-muted text-muted-foreground',
};

const auditTypeStyles: Record<AuditLog['type'], string> = {
  login: 'bg-cyan-light text-cyan',
  meal: 'bg-primary/10 text-primary',
  profile: 'bg-warning-light text-warning',
  admin: 'bg-danger-light text-danger',
};

export default function AdminPanelPage() {
  const { user, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [userSearch, setUserSearch] = useState('');
  const [foodSearch, setFoodSearch] = useState('');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [foods, setFoods] = useState<FoodItem[]>(mockFoods);
  const [showFoodForm, setShowFoodForm] = useState(false);
  const [foodForm, setFoodForm] = useState({ name: '', calories: '', serving: '', category: 'Protein' });

  // Load real users from LocalStorage
  React.useEffect(() => {
    const dbUsers = JSON.parse(localStorage.getItem('vital_users_db') || '[]');
    const formattedUsers: AppUser[] = dbUsers.map((u: any) => ({
      id: u.id || `u-${Math.random().toString(36).substring(2, 9)}`,
      name: u.name,
      email: u.email,
      role: u.role,
      status: u.status || 'active',
      joined: u.joined || new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      lastActive: u.lastActive || 'Just now',
      meals: JSON.parse(localStorage.getItem(`meals_${u.id || u.email}`) || '[]').length
    }));
    setUsers(formattedUsers);
  }, []);

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase())
  );

  const filteredFoods = foods.filter((f) =>
    f.name.toLowerCase().includes(foodSearch.toLowerCase())
  );

  const toggleSuspend = (id: string) => {
    const dbUsers = JSON.parse(localStorage.getItem('vital_users_db') || '[]');
    const updatedDb = dbUsers.map((u: any) => 
      u.id === id ? { ...u, status: u.status === 'suspended' ? 'active' : 'suspended' } : u
    );
    localStorage.setItem('vital_users_db', JSON.stringify(updatedDb));

    setUsers((prev) => {
      return prev.map((u) =>
        u.id === id ? { ...u, status: u.status === 'suspended' ? 'active' : 'suspended' } : u
      );
    });

    setOpenMenuId(null);
    toast.success('User status updated');
  };

  const deleteUser = (id: string) => {
    const dbUsers = JSON.parse(localStorage.getItem('vital_users_db') || '[]');
    const updatedDb = dbUsers.filter((u: any) => u.id !== id);
    localStorage.setItem('vital_users_db', JSON.stringify(updatedDb));
    
    // Cleanup user meals
    localStorage.removeItem(`meals_${id}`);

    setUsers((prev) => prev.filter((u) => u.id !== id));
    setOpenMenuId(null);
    toast.success('User deleted successfully');
  };

  const deleteFood = (id: string) => {
    const updated = foods.filter((f) => f.id !== id);
    setFoods(updated);
    localStorage.setItem('vital_food_db', JSON.stringify(updated));
    toast.success('Food item removed');
  };

  const addFood = () => {
    if (!foodForm.name.trim() || !foodForm.calories) return;
    const newFood: FoodItem = {
      id: `f${Date.now()}`,
      name: foodForm.name,
      calories: parseInt(foodForm.calories),
      serving: foodForm.serving || '100g',
      category: foodForm.category,
    };
    const updated = [...foods, newFood];
    setFoods(updated);
    localStorage.setItem('vital_food_db', JSON.stringify(updated));
    setFoodForm({ name: '', calories: '', serving: '', category: 'Protein' });
    setShowFoodForm(false);
    toast.success('Food item added to database');
  };

  const tabs: { id: AdminTab; label: string; icon: React.ElementType }[] = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'food', label: 'Food DB', icon: Database },
    { id: 'audit', label: 'Audit Logs', icon: FileText },
  ];

  // Load Food DB on mount
  React.useEffect(() => {
    const dbFoods = JSON.parse(localStorage.getItem('vital_food_db') || '[]');
    if (dbFoods.length > 0) setFoods(dbFoods);
  }, []);

  if (!isLoading && user?.role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-danger">Access Denied</h1>
          <p className="text-muted-foreground">You do not have permission to view this page.</p>
        </div>
      </div>
    );
  }

  const stats = [
    { label: 'Total Users', value: users.length.toString(), sub: `${users.filter((u) => u.status === 'active').length} active`, icon: Users, color: 'text-primary', bg: 'bg-primary/10' },
    { label: 'Meals Logged', value: users.reduce((a, u) => a + u.meals, 0).toString(), sub: 'All time', icon: TrendingUp, color: 'text-success', bg: 'bg-success-light' },
    { label: 'Food Items', value: foods.length.toString(), sub: 'In database', icon: Database, color: 'text-cyan', bg: 'bg-cyan-light' },
    { label: 'Suspended', value: users.filter((u) => u.status === 'suspended').length.toString(), sub: 'Accounts', icon: AlertTriangle, color: 'text-warning', bg: 'bg-warning-light' },
  ];

  return (
    <AppLayout activeRoute="/admin">
      <div className="px-4 sm:px-6 lg:px-8 xl:px-10 py-6 max-w-screen-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-warning-light flex items-center justify-center shrink-0">
            <Shield className="w-5 h-5 text-warning" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">Admin Panel</h1>
            <p className="text-sm text-muted-foreground">System management & oversight</p>
          </div>
          <span className="ml-auto text-xs font-bold px-2.5 py-1 rounded-full bg-warning-light text-warning">
            ADMIN
          </span>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-muted p-1 rounded-xl overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap flex-1 justify-center ${
                  activeTab === tab.id
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {stats.map((stat) => {
                const Icon = stat.icon;
                return (
                  <div key={stat.label} className="card-base p-4 flex flex-col gap-3">
                    <div className={`w-9 h-9 rounded-lg ${stat.bg} flex items-center justify-center`}>
                      <Icon className={`w-4 h-4 ${stat.color}`} />
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{stat.label}</p>
                      <p className="text-2xl font-bold text-foreground mt-0.5 font-tabular">{stat.value}</p>
                      <p className="text-xs text-muted-foreground">{stat.sub}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Recent Activity */}
            <div className="card-base">
              <div className="px-5 py-4 border-b border-border">
                <h2 className="text-base font-semibold text-foreground">Recent Activity</h2>
              </div>
              <div className="divide-y divide-border">
                {mockAuditLogs.slice(0, 4).map((log) => (
                  <div key={log.id} className="flex items-start gap-3 px-5 py-3.5">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full shrink-0 mt-0.5 ${auditTypeStyles[log.type]}`}>
                      {log.type}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground">{log.action}</p>
                      <p className="text-xs text-muted-foreground truncate">{log.detail}</p>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0">{log.timestamp}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="card-base overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 border-b border-border">
              <h2 className="text-base font-semibold text-foreground">User Management</h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="pl-9 pr-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary w-full sm:w-56"
                />
              </div>
            </div>

            {/* Desktop table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">User</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Role</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Last Active</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Meals</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                            <span className="text-xs font-bold text-primary">{user.name.charAt(0)}</span>
                          </div>
                          <div>
                            <p className="font-semibold text-foreground">{user.name}</p>
                            <p className="text-xs text-muted-foreground">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${user.role === 'admin' ? 'bg-warning-light text-warning' : 'bg-muted text-muted-foreground'}`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${statusStyles[user.status]}`}>
                          {user.status}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-xs text-muted-foreground">{user.lastActive}</td>
                      <td className="px-4 py-3.5 text-xs font-tabular text-foreground">{user.meals}</td>
                      <td className="px-4 py-3.5">
                        <div className="relative">
                          <button
                            onClick={() => setOpenMenuId(openMenuId === user.id ? null : user.id)}
                            className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                          {openMenuId === user.id && (
                            <div className="absolute right-0 top-8 z-20 bg-card border border-border rounded-xl shadow-lg py-1 min-w-[160px]">
                              <button className="flex items-center gap-2 w-full px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors">
                                <Eye className="w-3.5 h-3.5" /> View Profile
                              </button>
                              <button
                                onClick={() => toggleSuspend(user.id)}
                                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-warning hover:bg-warning-light transition-colors"
                              >
                                <UserX className="w-3.5 h-3.5" />
                                {user.status === 'suspended' ? 'Unsuspend' : 'Suspend'}
                              </button>
                              <button
                                onClick={() => deleteUser(user.id)}
                                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-danger hover:bg-danger-light transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" /> Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="sm:hidden divide-y divide-border">
              {filteredUsers.map((user) => (
                <div key={user.id} className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="text-sm font-bold text-primary">{user.name.charAt(0)}</span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{user.name}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${statusStyles[user.status]}`}>
                      {user.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${user.role === 'admin' ? 'bg-warning-light text-warning' : 'bg-muted text-muted-foreground'}`}>
                      {user.role}
                    </span>
                    <span className="text-xs text-muted-foreground">Last: {user.lastActive}</span>
                    <span className="text-xs text-muted-foreground">{user.meals} meals</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => toggleSuspend(user.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-warning/30 text-xs font-semibold text-warning hover:bg-warning-light transition-colors"
                    >
                      <UserX className="w-3 h-3" />
                      {user.status === 'suspended' ? 'Unsuspend' : 'Suspend'}
                    </button>
                    <button
                      onClick={() => deleteUser(user.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-danger/30 text-xs font-semibold text-danger hover:bg-danger-light transition-colors"
                    >
                      <Trash2 className="w-3 h-3" /> Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Food DB Tab */}
        {activeTab === 'food' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search food database..."
                  value={foodSearch}
                  onChange={(e) => setFoodSearch(e.target.value)}
                  className="pl-9 pr-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary w-full"
                />
              </div>
              <button
                onClick={() => setShowFoodForm(true)}
                className="btn-primary flex items-center gap-2 text-sm self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" /> Add Food
              </button>
            </div>

            {/* Add Food Form */}
            {showFoodForm && (
              <div className="card-base p-5">
                <h3 className="text-sm font-semibold text-foreground mb-4">Add New Food Item</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Food Name</label>
                    <input
                      type="text"
                      value={foodForm.name}
                      onChange={(e) => setFoodForm((f) => ({ ...f, name: e.target.value }))}
                      placeholder="e.g. Grilled Salmon"
                      className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Calories (kcal)</label>
                    <input
                      type="number"
                      value={foodForm.calories}
                      onChange={(e) => setFoodForm((f) => ({ ...f, calories: e.target.value }))}
                      placeholder="e.g. 208"
                      className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Serving Size</label>
                    <input
                      type="text"
                      value={foodForm.serving}
                      onChange={(e) => setFoodForm((f) => ({ ...f, serving: e.target.value }))}
                      placeholder="e.g. 100g"
                      className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Category</label>
                    <div className="relative">
                      <select
                        value={foodForm.category}
                        onChange={(e) => setFoodForm((f) => ({ ...f, category: e.target.value }))}
                        className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary appearance-none"
                      >
                        {['Protein', 'Carbs', 'Fats', 'Dairy', 'Fruits', 'Vegetables', 'Beverages', 'Snacks'].map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 mt-4 pt-4 border-t border-border">
                  <button onClick={addFood} className="btn-primary flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4" /> Add Food
                  </button>
                  <button onClick={() => setShowFoodForm(false)} className="btn-ghost flex items-center gap-2 text-sm">
                    <X className="w-4 h-4" /> Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Food Table */}
            <div className="card-base overflow-hidden">
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Food Name</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Calories</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Serving</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Category</th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredFoods.map((food) => (
                      <tr key={food.id} className="hover:bg-muted/20 transition-colors">
                        <td className="px-5 py-3.5 font-semibold text-foreground">{food.name}</td>
                        <td className="px-4 py-3.5 font-tabular text-foreground">{food.calories} kcal</td>
                        <td className="px-4 py-3.5 text-muted-foreground">{food.serving}</td>
                        <td className="px-4 py-3.5">
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{food.category}</span>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-1">
                            <button className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => deleteFood(food.id)}
                              className="p-1.5 rounded-lg hover:bg-danger-light transition-colors text-muted-foreground hover:text-danger"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile food cards */}
              <div className="sm:hidden divide-y divide-border">
                {filteredFoods.map((food) => (
                  <div key={food.id} className="flex items-center gap-3 p-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground">{food.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{food.serving} · {food.category}</p>
                    </div>
                    <span className="text-sm font-bold text-foreground font-tabular shrink-0">{food.calories} kcal</span>
                    <button
                      onClick={() => deleteFood(food.id)}
                      className="p-1.5 rounded-lg hover:bg-danger-light transition-colors text-muted-foreground hover:text-danger shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Audit Logs Tab */}
        {activeTab === 'audit' && (
          <div className="card-base overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
              <h2 className="text-base font-semibold text-foreground">Audit Trail</h2>
              <p className="text-xs text-muted-foreground mt-0.5">All system activity logs</p>
            </div>
            <div className="divide-y divide-border">
              {mockAuditLogs.map((log) => (
                <div key={log.id} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 px-5 py-4">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full self-start sm:self-auto shrink-0 ${auditTypeStyles[log.type]}`}>
                    {log.type}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">{log.action}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{log.detail}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 sm:hidden">{log.user} · {log.timestamp}</p>
                  </div>
                  <div className="hidden sm:flex flex-col items-end shrink-0">
                    <span className="text-xs text-muted-foreground">{log.user}</span>
                    <span className="text-xs text-muted-foreground">{log.timestamp}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
