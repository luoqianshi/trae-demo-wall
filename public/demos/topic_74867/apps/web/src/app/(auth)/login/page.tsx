'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, ArrowRight, TreePine } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/stores/auth-store';
import { ApiError } from '@/lib/api-client';
import { isValidEmail } from '@echolife/shared';

interface FormErrors {
  email?: string;
  password?: string;
}

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);

  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [errors, setErrors] = React.useState<FormErrors>({});
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  const validate = (): boolean => {
    const next: FormErrors = {};
    if (!email) {
      next.email = '请输入邮箱';
    } else if (!isValidEmail(email)) {
      next.email = '邮箱格式不正确';
    }
    if (!password) {
      next.password = '请输入密码';
    } else if (password.length < 8) {
      next.password = '密码至少 8 位';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    if (!validate()) return;

    setLoading(true);
    try {
      await login(email, password);
      router.push('/');
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : '登录失败，请稍后重试';
      setSubmitError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Logo & heading */}
      <div className="mb-10 text-center">
        {/* Breathing seedling */}
        <motion.div
          animate={{ scale: [1, 1.05, 1], opacity: [0.9, 1, 0.9] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-3xl liquid-glass-strong"
        >
          <TreePine className="h-8 w-8 text-life-green" />
        </motion.div>

        <h1 className="text-3xl font-display font-semibold tracking-tight text-text">
          EchoLife
        </h1>
        <p className="mt-3 text-sm text-text-muted leading-relaxed">
          你的数字生命正在等待苏醒
        </p>
      </div>

      {/* Liquid Glass Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
        className="liquid-glass-strong p-8"
      >
        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          <Input
            label="邮箱"
            type="email"
            placeholder="you@example.com"
            icon={Mail}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={errors.email}
            autoComplete="email"
            disabled={loading}
            className="liquid-glass-input border-0 focus:border-0"
          />

          <div className="relative">
            <Input
              label="密码"
              type={showPassword ? 'text' : 'password'}
              placeholder="输入你的密码"
              icon={Lock}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={errors.password}
              autoComplete="current-password"
              disabled={loading}
              className="liquid-glass-input border-0 focus:border-0"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3.5 top-[34px] text-text-muted transition-colors hover:text-text"
              aria-label={showPassword ? '隐藏密码' : '显示密码'}
              tabIndex={-1}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>

          {submitError && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="rounded-xl border border-error/30 bg-error/10 px-4 py-2.5 text-sm text-error"
            >
              {submitError}
            </motion.div>
          )}

          <motion.div whileTap={{ scale: 0.98 }}>
            <Button
              type="submit"
              size="lg"
              loading={loading}
              className="w-full h-12 text-base font-medium"
            >
              {!loading && <ArrowRight className="h-4 w-4" />}
              进入 EchoLife
            </Button>
          </motion.div>
        </form>

        <div className="mt-6 text-center text-sm text-text-muted">
          还没有数字生命？{' '}
          <Link
            href="/register"
            className="font-medium text-accent transition-colors hover:text-accent-hover"
          >
            开始生长
          </Link>
        </div>
      </motion.div>

      {/* Footer tagline */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="mt-8 text-center text-xs text-text-subtle"
      >
        时间是树 · 记忆是叶 · 时墨是生命
      </motion.p>
    </motion.div>
  );
}
