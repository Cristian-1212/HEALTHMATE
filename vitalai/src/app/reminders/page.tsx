'use client';

import React, { useState } from 'react';
import AppLayout from '@/components/AppLayout';
import {
  Bell,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Utensils,
  Droplets,
  Pill,
  Clock,
  ToggleLeft,
  ToggleRight,
  Zap,
} from 'lucide-react';
import Icon from '@/components/ui/AppIcon';


type ReminderType = 'meal' | 'water' | 'medicine';
type ReminderFrequency = 'daily' | 'weekdays' | 'weekends' | 'custom';

interface Reminder {
  id: string;
  type: ReminderType;
  title: string;
  time: string;
  frequency: ReminderFrequency;
  enabled: boolean;
  aiOptimized?: boolean;
}

const typeConfig: Record<ReminderType, { icon: React.ElementType; color: string; bg: string; label: string }> = {
  meal: { icon: Utensils, color: 'text-primary', bg: 'bg-primary/10', label: 'Meal' },
  water: { icon: Droplets, color: 'text-cyan', bg: 'bg-cyan-light', label: 'Water' },
  medicine: { icon: Pill, color: 'text-warning', bg: 'bg-warning-light', label: 'Medicine' },
};

const initialReminders: Reminder[] = [
  { id: 'r1', type: 'meal', title: 'Breakfast Reminder', time: '07:45', frequency: 'daily', enabled: true, aiOptimized: true },
  { id: 'r2', type: 'meal', title: 'Lunch Reminder', time: '12:30', frequency: 'daily', enabled: true, aiOptimized: true },
  { id: 'r3', type: 'meal', title: 'Dinner Reminder', time: '19:00', frequency: 'daily', enabled: true },
  { id: 'r4', type: 'water', title: 'Morning Hydration', time: '08:00', frequency: 'daily', enabled: true },
  { id: 'r5', type: 'water', title: 'Afternoon Hydration', time: '14:00', frequency: 'daily', enabled: false },
  { id: 'r6', type: 'medicine', title: 'Morning Medication', time: '08:15', frequency: 'daily', enabled: true },
];

const frequencyLabels: Record<ReminderFrequency, string> = {
  daily: 'Every day',
  weekdays: 'Weekdays',
  weekends: 'Weekends',
  custom: 'Custom',
};

interface ReminderFormData {
  type: ReminderType;
  title: string;
  time: string;
  frequency: ReminderFrequency;
}

export default function RemindersPage() {
  const [reminders, setReminders] = useState<Reminder[]>(initialReminders);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ReminderFormData>({
    type: 'meal',
    title: '',
    time: '08:00',
    frequency: 'daily',
  });

  const toggleReminder = (id: string) => {
    setReminders((prev) =>
      prev.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r))
    );
  };

  const deleteReminder = (id: string) => {
    setReminders((prev) => prev.filter((r) => r.id !== id));
  };

  const startEdit = (reminder: Reminder) => {
    setEditingId(reminder.id);
    setForm({ type: reminder.type, title: reminder.title, time: reminder.time, frequency: reminder.frequency });
    setShowForm(true);
  };

  const handleSave = () => {
    if (!form.title.trim()) return;
    if (editingId) {
      setReminders((prev) =>
        prev.map((r) => (r.id === editingId ? { ...r, ...form } : r))
      );
    } else {
      const newReminder: Reminder = {
        id: `r${Date.now()}`,
        ...form,
        enabled: true,
      };
      setReminders((prev) => [...prev, newReminder]);
    }
    setShowForm(false);
    setEditingId(null);
    setForm({ type: 'meal', title: '', time: '08:00', frequency: 'daily' });
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setForm({ type: 'meal', title: '', time: '08:00', frequency: 'daily' });
  };

  const grouped = (['meal', 'water', 'medicine'] as ReminderType[]).map((type) => ({
    type,
    items: reminders.filter((r) => r.type === type),
  }));

  const enabledCount = reminders.filter((r) => r.enabled).length;

  return (
    <AppLayout activeRoute="/reminders">
      <div className="px-4 sm:px-6 lg:px-8 xl:px-10 py-6 max-w-screen-xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Bell className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-foreground">Reminders</h1>
              <p className="text-sm text-muted-foreground">{enabledCount} of {reminders.length} reminders active</p>
            </div>
          </div>
          <button
            onClick={() => { setShowForm(true); setEditingId(null); }}
            className="btn-primary flex items-center gap-2 text-sm self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            Add Reminder
          </button>
        </div>

        {/* AI Optimization Banner */}
        <div className="rounded-xl bg-primary/5 border border-primary/15 p-4 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Zap className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">AI-Optimized Reminders Active</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              VitalAI has analyzed your meal patterns and optimized 3 reminder times for better adherence.
              Breakfast moved to 7:45 AM based on your logging history.
            </p>
          </div>
          <button className="text-xs font-semibold text-primary hover:text-emerald-700 transition-colors whitespace-nowrap self-start sm:self-auto">
            View Analysis
          </button>
        </div>

        {/* Add/Edit Form */}
        {showForm && (
          <div className="card-base p-5">
            <h2 className="text-base font-semibold text-foreground mb-4">
              {editingId ? 'Edit Reminder' : 'New Reminder'}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Type */}
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                  Type
                </label>
                <div className="flex gap-2 flex-wrap">
                  {(['meal', 'water', 'medicine'] as ReminderType[]).map((t) => {
                    const cfg = typeConfig[t];
                    const Icon = cfg.icon;
                    return (
                      <button
                        key={t}
                        onClick={() => setForm((f) => ({ ...f, type: t }))}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                          form.type === t
                            ? 'border-primary bg-primary/10 text-primary' :'border-border bg-card text-muted-foreground hover:bg-muted'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        {cfg.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                  Title
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. Morning Breakfast"
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
              </div>

              {/* Time */}
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                  Time
                </label>
                <input
                  type="time"
                  value={form.time}
                  onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
              </div>

              {/* Frequency */}
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                  Frequency
                </label>
                <select
                  value={form.frequency}
                  onChange={(e) => setForm((f) => ({ ...f, frequency: e.target.value as ReminderFrequency }))}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                >
                  <option value="daily">Every day</option>
                  <option value="weekdays">Weekdays only</option>
                  <option value="weekends">Weekends only</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-3 mt-5 pt-4 border-t border-border">
              <button onClick={handleSave} className="btn-primary flex items-center gap-2 text-sm">
                <Check className="w-4 h-4" />
                {editingId ? 'Save Changes' : 'Add Reminder'}
              </button>
              <button onClick={handleCancel} className="btn-ghost flex items-center gap-2 text-sm">
                <X className="w-4 h-4" />
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Reminder Groups */}
        <div className="space-y-5">
          {grouped.map(({ type, items }) => {
            const cfg = typeConfig[type];
            const Icon = cfg.icon;
            if (items.length === 0) return null;
            return (
              <div key={type} className="card-base overflow-hidden">
                <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
                  <div className={`w-8 h-8 rounded-lg ${cfg.bg} flex items-center justify-center`}>
                    <Icon className={`w-4 h-4 ${cfg.color}`} />
                  </div>
                  <h2 className="text-sm font-semibold text-foreground capitalize">{cfg.label} Reminders</h2>
                  <span className="ml-auto text-xs text-muted-foreground">
                    {items.filter((r) => r.enabled).length}/{items.length} active
                  </span>
                </div>

                <div className="divide-y divide-border">
                  {items.map((reminder) => (
                    <div
                      key={reminder.id}
                      className={`flex items-center gap-3 px-5 py-4 transition-colors ${
                        reminder.enabled ? '' : 'opacity-50'
                      }`}
                    >
                      {/* Time */}
                      <div className="flex items-center gap-1.5 min-w-[70px]">
                        <Clock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                        <span className="text-sm font-bold text-foreground font-tabular">{reminder.time}</span>
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-foreground truncate">{reminder.title}</span>
                          {reminder.aiOptimized && (
                            <span className="flex items-center gap-1 text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                              <Zap className="w-3 h-3" />
                              AI
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{frequencyLabels[reminder.frequency]}</p>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => startEdit(reminder)}
                          className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                          aria-label="Edit reminder"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => deleteReminder(reminder.id)}
                          className="p-1.5 rounded-lg hover:bg-danger-light transition-colors text-muted-foreground hover:text-danger"
                          aria-label="Delete reminder"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => toggleReminder(reminder.id)}
                          className="p-1 rounded-lg transition-colors"
                          aria-label={reminder.enabled ? 'Disable reminder' : 'Enable reminder'}
                        >
                          {reminder.enabled ? (
                            <ToggleRight className="w-6 h-6 text-primary" />
                          ) : (
                            <ToggleLeft className="w-6 h-6 text-muted-foreground" />
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Notification Settings */}
        <div className="card-base p-5">
          <h2 className="text-base font-semibold text-foreground mb-4">Notification Preferences</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { label: 'Push Notifications', desc: 'Receive alerts on your device', enabled: true },
              { label: 'Email Reminders', desc: 'Daily summary via email', enabled: false },
              { label: 'Smart Snooze', desc: 'AI-powered snooze suggestions', enabled: true },
              { label: 'Quiet Hours', desc: 'No alerts between 10 PM – 7 AM', enabled: true },
            ].map((pref, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-muted/40 border border-border">
                <div>
                  <p className="text-sm font-semibold text-foreground">{pref.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{pref.desc}</p>
                </div>
                <button className="shrink-0">
                  {pref.enabled ? (
                    <ToggleRight className="w-7 h-7 text-primary" />
                  ) : (
                    <ToggleLeft className="w-7 h-7 text-muted-foreground" />
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
