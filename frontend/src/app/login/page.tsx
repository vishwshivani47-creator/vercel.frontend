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
import { Bot, Lock, User, ArrowRight, ShieldCheck } from 'lucide-react';

const loginSchema = z.object({
  username: z.string().min(1, 'Username or email is required'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (values: LoginFormValues) => {
    setIsLoading(true);
    setServerError(null);
    try {
      await authService.login(values);
      router.push('/dashboard');
    } catch (err: any) {
      const msg = extractApiErrorMessage(
        err,
        'Invalid credentials provided. Please check your username and password.'
      );
      setServerError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const fillCredentials = (user: string, pass: string) => {
    setValue('username', user);
    setValue('password', pass);
  };

  return (
    <div className="py-20 px-4 flex items-center justify-center min-h-[80vh] relative">
      <div className="w-full max-w-md space-y-6">
        
        {serverError && (
          <Toast
            type="error"
            title="Authentication Error"
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
              // SECURE ACCESS GATEWAY
            </span>
            <h1 className="text-2xl font-display font-bold text-white tracking-wide">
              LOGIN TO HUMORPHIC LAB
            </h1>
            <p className="text-xs text-slate-400 font-sans">
              Enter your engineer credentials to access telemetry and 3D assets.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Username or Email"
              placeholder="e.g. cybernaut"
              error={errors.username?.message}
              leftIcon={<User className="h-4 w-4" />}
              {...register('username')}
            />

            <Input
              label="Security Key / Password"
              type="password"
              placeholder="••••••••••••"
              error={errors.password?.message}
              leftIcon={<Lock className="h-4 w-4" />}
              {...register('password')}
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full mt-2"
              isLoading={isLoading}
              rightIcon={<ArrowRight className="h-4 w-4" />}
            >
              INITIALIZE SESSION
            </Button>
          </form>

          {/* Quick Fill Demo Credentials */}
          <div className="pt-4 border-t border-white/10 space-y-2 text-center">
            <span className="text-[11px] font-mono text-slate-400 block">
              QUICK DEMO CREDENTIALS:
            </span>
            <div className="flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => fillCredentials('admin', 'Humorphic2026!')}
                className="text-[11px] font-mono px-2.5 py-1 rounded bg-white/5 border border-white/10 hover:border-humorphic-orange hover:text-white text-slate-300 transition-colors"
              >
                ADMIN USER
              </button>
              <button
                type="button"
                onClick={() => fillCredentials('cybernaut', 'RoboPass2026!')}
                className="text-[11px] font-mono px-2.5 py-1 rounded bg-white/5 border border-white/10 hover:border-humorphic-gold hover:text-white text-slate-300 transition-colors"
              >
                RESEARCHER USER
              </button>
            </div>
          </div>

          <div className="text-center text-xs text-slate-400 pt-2 font-mono">
            New engineer to the lab?{' '}
            <Link href="/register" className="text-humorphic-orange hover:underline font-bold">
              Register New Profile
            </Link>
          </div>
        </Card>

      </div>
    </div>
  );
}
