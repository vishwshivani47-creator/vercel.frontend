'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { authService } from '@/services/auth.service';
import { extractApiErrorMessage } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Toast } from '@/components/ui/Toast';
import { Bot, Lock, User, Mail, Building, ArrowRight } from 'lucide-react';

const registerSchema = z
  .object({
    username: z.string().min(3, 'Username must be at least 3 characters'),
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    password_confirm: z.string().min(8, 'Confirm password is required'),
    first_name: z.string().optional(),
    last_name: z.string().optional(),
    organization: z.string().optional(),
    role: z.enum(['engineer', 'researcher', 'designer', 'viewer']).default('engineer'),
  })
  .refine((data) => data.password === data.password_confirm, {
    message: 'Passwords do not match',
    path: ['password_confirm'],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: 'engineer',
      organization: 'Humorphic Robotics Lab',
    },
  });

  const onSubmit = async (values: RegisterFormValues) => {
    setIsLoading(true);
    setServerError(null);
    try {
      await authService.register(values);
      router.push('/dashboard');
    } catch (err: any) {
      const msg = extractApiErrorMessage(
        err,
        'Failed to register account. Please check the values and try again.'
      );
      setServerError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="py-16 px-4 flex items-center justify-center min-h-[85vh] relative">
      <div className="w-full max-w-lg space-y-6">
        
        {serverError && (
          <Toast
            type="error"
            title="Registration Error"
            message={serverError}
            onClose={() => setServerError(null)}
          />
        )}

        <Card glow="orange" className="p-8 space-y-6 bg-cyber-card/95 border-humorphic-orange/40 backdrop-blur-2xl">
          <div className="text-center space-y-2">
            <div className="h-12 w-12 rounded-xl bg-cyber-bg border border-humorphic-orange/60 text-humorphic-orange mx-auto flex items-center justify-center shadow-glow mb-3">
              <Bot className="h-6 w-6" />
            </div>
            <span className="text-xs font-mono text-humorphic-orange tracking-widest uppercase block">
              // RECRUITMENT & CAD LICENSING
            </span>
            <h1 className="text-2xl font-display font-bold text-white tracking-wide">
              CREATE ENGINEER PROFILE
            </h1>
            <p className="text-xs text-slate-400 font-sans">
              Register to participate in the autonomous robotics ecosystem.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Username"
                placeholder="e.g. quantum_roboticist"
                error={errors.username?.message}
                leftIcon={<User className="h-4 w-4" />}
                {...register('username')}
              />
              <Input
                label="Communication Email"
                type="email"
                placeholder="engineer@lab.org"
                error={errors.email?.message}
                leftIcon={<Mail className="h-4 w-4" />}
                {...register('email')}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="First Name"
                placeholder="Alex"
                {...register('first_name')}
              />
              <Input
                label="Last Name"
                placeholder="Vance"
                {...register('last_name')}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-mono font-medium text-slate-300 uppercase tracking-wider">
                  Discipline / Role
                </label>
                <select
                  {...register('role')}
                  className="block w-full rounded-md border border-cyber-border bg-cyber-card/90 px-3 py-2 text-sm text-slate-100 shadow-inner backdrop-blur-md focus:border-humorphic-orange focus:outline-none focus:ring-1 focus:ring-humorphic-orange"
                >
                  <option value="engineer">Robotics Engineer</option>
                  <option value="researcher">AI Researcher</option>
                  <option value="designer">3D / CAD Designer</option>
                  <option value="viewer">Lab Guest / Viewer</option>
                </select>
              </div>

              <Input
                label="Organization / Lab"
                placeholder="MIT / Stanford / Humorphic"
                leftIcon={<Building className="h-4 w-4" />}
                {...register('organization')}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Security Key / Password"
                type="password"
                placeholder="Min 8 characters"
                error={errors.password?.message}
                leftIcon={<Lock className="h-4 w-4" />}
                {...register('password')}
              />
              <Input
                label="Confirm Key / Password"
                type="password"
                placeholder="Repeat password"
                error={errors.password_confirm?.message}
                leftIcon={<Lock className="h-4 w-4" />}
                {...register('password_confirm')}
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full mt-2"
              isLoading={isLoading}
              rightIcon={<ArrowRight className="h-4 w-4" />}
            >
              REGISTER CREDENTIALS
            </Button>
          </form>

          <div className="text-center text-xs text-slate-400 pt-2 font-mono">
            Already registered?{' '}
            <Link href="/login" className="text-humorphic-orange hover:underline font-bold">
              Sign In To Workspace
            </Link>
          </div>
        </Card>

      </div>
    </div>
  );
}
