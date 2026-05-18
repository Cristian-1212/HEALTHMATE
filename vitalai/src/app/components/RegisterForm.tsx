'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Loader2, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';
import { auth, db } from '@/app/admin/firebase';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

interface RegisterValues {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  age: number;
  gender: string;
  weight: number;
  height: number;
  activityLevel: string;
  goalType: string;
  units: string;
}

const activityOptions = [
  { value: 'sedentary', label: 'Sedentary (little or no exercise)' },
  { value: 'lightly_active', label: 'Lightly Active (1–3 days/week)' },
  { value: 'moderately_active', label: 'Moderately Active (3–5 days/week)' },
  { value: 'very_active', label: 'Very Active (6–7 days/week)' },
  { value: 'extra_active', label: 'Extra Active (physical job + exercise)' },
];

const goalOptions = [
  { value: 'lose_weight', label: '🔻 Lose Weight', desc: 'Calorie deficit mode' },
  { value: 'maintain', label: '⚖️ Maintain Weight', desc: 'TDEE maintenance' },
  { value: 'gain_muscle', label: '💪 Gain Muscle', desc: 'Calorie surplus mode' },
];

interface RegisterFormProps {
  onSwitchToLogin: () => void;
}

export default function RegisterForm({ onSwitchToLogin }: RegisterFormProps) {
  const router = useRouter();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<RegisterValues>({
    defaultValues: {
      units: 'metric',
      activityLevel: 'moderately_active',
      goalType: 'lose_weight',
      gender: 'female',
    },
  });

  const watchGoal = watch('goalType');
  const watchUnits = watch('units');

  const onSubmit = async (data: RegisterValues) => {
    setIsLoading(true);

    try {
      // 1. Create user in Firebase
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      const firebaseUser = userCredential.user;

      // 2. Set display name in Firebase
      await updateProfile(firebaseUser, { displayName: data.name });

      const newUser = { 
        ...data, 
        id: firebaseUser.uid, 
        role: 'user', 
        joined: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) 
      };
      
      delete (newUser as any).password;
      delete (newUser as any).confirmPassword;
      
      // 3. Store metadata in Firestore linked to Firebase UID
      await setDoc(doc(db, "users", firebaseUser.uid), newUser);

      // Sync to localStorage as well
      const users = JSON.parse(localStorage.getItem('vital_users_db') || '[]');
      users.push(newUser);
      localStorage.setItem('vital_users_db', JSON.stringify(users));

      toast.success('Account created! Welcome to HealthMate 🎉');
      router.push('/user-dashboard');
    } catch (error: any) {
      toast.error(error.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Start your health journey</h2>
        <p className="text-muted-foreground text-sm mt-1">Create your account and set your goals</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        {/* Section: Account Info */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">1</div>
            <span className="text-sm font-semibold text-foreground">Account Info</span>
          </div>

          <div>
            <label className="block text-sm font-semibold text-foreground mb-1.5" htmlFor="reg-name">
              Full Name
            </label>
            <input
              id="reg-name"
              type="text"
              placeholder="Alex Johnson"
              className="input-field"
              {...register('name', { required: 'Full name is required' })}
            />
            {errors.name && <p className="mt-1.5 text-xs text-danger font-medium">{errors.name.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-semibold text-foreground mb-1.5" htmlFor="reg-email">
              Email Address
            </label>
            <input
              id="reg-email"
              type="email"
              placeholder="sarah@example.com"
              className="input-field"
              {...register('email', {
                required: 'Email is required',
                pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Enter a valid email' },
              })}
            />
            {errors.email && <p className="mt-1.5 text-xs text-danger font-medium">{errors.email.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-foreground mb-1.5" htmlFor="reg-password">
                Password
              </label>
              <div className="relative">
                <input
                  id="reg-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Min. 8 characters"
                  className="input-field pr-10"
                  {...register('password', {
                    required: 'Password is required',
                    minLength: { value: 8, message: 'At least 8 characters' },
                  })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label="Toggle password"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="mt-1.5 text-xs text-danger font-medium">{errors.password.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold text-foreground mb-1.5" htmlFor="reg-confirm">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  id="reg-confirm"
                  type={showConfirm ? 'text' : 'password'}
                  placeholder="Repeat password"
                  className="input-field pr-10"
                  {...register('confirmPassword', {
                    required: 'Please confirm your password',
                    validate: (val) => val === watch('password') || 'Passwords do not match',
                  })}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label="Toggle confirm password"
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.confirmPassword && <p className="mt-1.5 text-xs text-danger font-medium">{errors.confirmPassword.message}</p>}
            </div>
          </div>
        </div>

        <hr className="border-border" />

        {/* Section: Body Metrics */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">2</div>
              <span className="text-sm font-semibold text-foreground">Body Metrics</span>
            </div>
            {/* Units toggle */}
            <div className="flex bg-muted rounded-lg p-0.5">
              {['metric', 'imperial'].map((u) => (
                <button
                  key={`unit-${u}`}
                  type="button"
                  onClick={() => setValue('units', u)}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                    watchUnits === u ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
                  }`}
                >
                  {u === 'metric' ? 'Metric' : 'Imperial'}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-foreground mb-1.5" htmlFor="reg-age">
                Age (years)
              </label>
              <input
                id="reg-age"
                type="number"
                placeholder="28"
                min={16}
                max={100}
                className="input-field"
                {...register('age', {
                  required: 'Age is required',
                  min: { value: 16, message: 'Must be 16 or older' },
                  max: { value: 100, message: 'Enter a valid age' },
                })}
              />
              {errors.age && <p className="mt-1.5 text-xs text-danger font-medium">{errors.age.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold text-foreground mb-1.5" htmlFor="reg-gender">
                Biological Sex
              </label>
              <div className="relative">
                <select
                  id="reg-gender"
                  className="input-field appearance-none pr-8"
                  {...register('gender', { required: 'Please select' })}
                >
                  <option value="female">Female</option>
                  <option value="male">Male</option>
                  <option value="other">Prefer not to say</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-foreground mb-1.5" htmlFor="reg-weight">
                Weight ({watchUnits === 'metric' ? 'kg' : 'lbs'})
              </label>
              <input
                id="reg-weight"
                type="number"
                step="0.1"
                placeholder={watchUnits === 'metric' ? '65.0' : '143'}
                className="input-field"
                {...register('weight', { required: 'Weight is required', min: { value: 30, message: 'Enter a valid weight' } })}
              />
              {errors.weight && <p className="mt-1.5 text-xs text-danger font-medium">{errors.weight.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold text-foreground mb-1.5" htmlFor="reg-height">
                Height ({watchUnits === 'metric' ? 'cm' : 'in'})
              </label>
              <input
                id="reg-height"
                type="number"
                step="0.5"
                placeholder={watchUnits === 'metric' ? '168' : '66'}
                className="input-field"
                {...register('height', { required: 'Height is required', min: { value: 100, message: 'Enter a valid height' } })}
              />
              {errors.height && <p className="mt-1.5 text-xs text-danger font-medium">{errors.height.message}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-foreground mb-1.5" htmlFor="reg-activity">
              Activity Level
            </label>
            <p className="text-xs text-muted-foreground mb-2">Used to calculate your Total Daily Energy Expenditure (TDEE)</p>
            <div className="relative">
              <select
                id="reg-activity"
                className="input-field appearance-none pr-8"
                {...register('activityLevel', { required: 'Select activity level' })}
              >
                {activityOptions.map((o) => (
                  <option key={`activity-${o.value}`} value={o.value}>{o.label}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            </div>
          </div>
        </div>

        <hr className="border-border" />

        {/* Section: Goal */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">3</div>
            <span className="text-sm font-semibold text-foreground">Health Goal</span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {goalOptions.map((g) => (
              <button
                key={`goal-${g.value}`}
                type="button"
                onClick={() => setValue('goalType', g.value)}
                className={`p-3 rounded-xl border-2 text-left transition-all duration-150 ${
                  watchGoal === g.value
                    ? 'border-primary bg-primary-light' :'border-border bg-card hover:border-primary/40'
                }`}
              >
                <p className="text-base mb-1">{g.label.split(' ')[0]}</p>
                <p className="text-xs font-semibold text-foreground leading-tight">{g.label.substring(2)}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{g.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Terms */}
        <p className="text-xs text-muted-foreground text-center">
          By creating an account you agree to our{' '}
          <button type="button" className="text-primary hover:underline font-medium">Terms of Service</button>
          {' '}and{' '}
          <button type="button" className="text-primary hover:underline font-medium">Privacy Policy</button>
        </p>

        {/* Submit */}
        <button
          type="submit"
          disabled={isLoading}
          className="btn-primary w-full py-3 flex items-center justify-center gap-2 text-base"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Creating your account...
            </>
          ) : (
            'Create My Account'
          )}
        </button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <button onClick={onSwitchToLogin} className="text-primary font-semibold hover:underline">
          Sign in
        </button>
      </p>
    </div>
  );
}