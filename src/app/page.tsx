// Beacon · CNIT 566 Final Project
// Author: Udaya Tejas

'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { BookOpen, Brain, Zap, BarChart3 } from 'lucide-react';

type Mode = 'signin' | 'signup';

const features = [
  { icon: BookOpen, title: 'All your courses', description: 'Grades, assignments, and content from Brightspace in one place' },
  { icon: Brain, title: 'AI-powered insights', description: 'Daily briefings and natural language queries about your academics' },
  { icon: Zap, title: 'Stay ahead', description: 'Never miss a deadline with smart urgency tracking' },
  { icon: BarChart3, title: 'Grade analytics', description: 'Visualize your performance across all courses' },
];

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [mode, setMode] = useState<Mode>('signin');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    const endpoint = mode === 'signup' ? '/api/auth/signup' : '/api/auth/signin';
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
      credentials: 'include',
    });
    const body = await res.json().catch(() => ({}));

    if (!res.ok) {
      setError(body.error ?? 'Something went wrong. Please try again.');
      setLoading(false);
      return;
    }

    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Animated background blobs */}
      <div className="absolute inset-0 -z-10">
        <motion.div
          className="absolute top-1/4 -left-1/4 w-1/2 h-1/2 rounded-full bg-primary/5 blur-3xl"
          animate={{ x: [0, 50, 0], y: [0, 30, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-1/4 -right-1/4 w-1/2 h-1/2 rounded-full bg-primary/5 blur-3xl"
          animate={{ x: [0, -50, 0], y: [0, -30, 0] }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <div className="max-w-6xl mx-auto px-6 py-12 md:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center min-h-[calc(100vh-10rem)]">
          {/* Left: Feature showcase */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="hidden lg:block"
          >
            <p className="text-sm font-mono text-muted-foreground mb-4">[beacon]</p>
            <h1 className="text-4xl md:text-5xl font-light tracking-tight leading-[1.1] mb-4">
              Your academic data,<br />
              <span className="text-muted-foreground">one dashboard away.</span>
            </h1>
            <p className="text-muted-foreground leading-relaxed mb-10 max-w-md">
              AI-powered insights from Brightspace, unified into a beautiful dashboard built for Purdue students.
            </p>

            <div className="grid grid-cols-2 gap-4">
              {features.map((feature, i) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                  className="p-4 rounded-2xl border border-border bg-background/50"
                >
                  <feature.icon className="w-5 h-5 text-muted-foreground mb-2" />
                  <p className="text-sm font-medium mb-1">{feature.title}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Right: Auth form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="w-full max-w-md mx-auto lg:mx-0"
          >
            {/* Mobile-only branding */}
            <div className="lg:hidden text-center mb-8">
              <p className="text-sm font-mono text-muted-foreground mb-3">[beacon]</p>
              <h1 className="text-3xl font-light tracking-tight leading-[1.1] mb-2">
                Your academic data,<br />
                <span className="text-muted-foreground">one dashboard away.</span>
              </h1>
            </div>

            <div className="p-8 rounded-2xl border border-border bg-background">
              <AnimatePresence mode="wait">
                <motion.div
                  key={mode}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.15 }}
                >
                  <h2 className="text-lg font-light mb-1">
                    {mode === 'signin' ? 'Sign in' : 'Create account'}
                  </h2>
                  <p className="text-sm text-muted-foreground mb-6">
                    {mode === 'signin'
                      ? 'Welcome back to Beacon'
                      : 'Beacon is only for Purdue students — use your @purdue.edu email.'}
                  </p>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label htmlFor="email" className="block text-xs font-medium mb-1.5">
                        Purdue email
                      </label>
                      <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@purdue.edu"
                        required
                        className="w-full px-5 py-3.5 text-sm bg-background border border-border rounded-full outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted-foreground/40"
                      />
                    </div>

                    <div>
                      <label htmlFor="password" className="block text-xs font-medium mb-1.5">
                        Password
                      </label>
                      <input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder={mode === 'signup' ? 'At least 8 characters' : 'Enter your password'}
                        required
                        minLength={mode === 'signup' ? 8 : undefined}
                        className="w-full px-5 py-3.5 text-sm bg-background border border-border rounded-full outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted-foreground/40"
                      />
                    </div>

                    {error && <p className="text-sm text-destructive">{error}</p>}
                    {message && <p className="text-sm text-success">{message}</p>}

                    <motion.button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3.5 px-8 rounded-full bg-foreground text-background font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {loading ? (
                        <span className="flex items-center justify-center gap-2">
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                            className="w-4 h-4 border-2 border-background border-t-transparent rounded-full"
                          />
                          {mode === 'signin' ? 'Signing in…' : 'Creating account…'}
                        </span>
                      ) : (
                        mode === 'signin' ? 'Sign in' : 'Create account'
                      )}
                    </motion.button>
                  </form>

                  <div className="mt-5 space-y-2 text-center">
                    {mode === 'signin' ? (
                      <p className="text-xs text-muted-foreground">
                        Don&apos;t have an account?{' '}
                        <button
                          onClick={() => { setMode('signup'); setError(''); setMessage(''); }}
                          className="text-foreground hover:opacity-70 transition-opacity font-medium"
                        >
                          Sign up
                        </button>
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        Already have an account?{' '}
                        <button
                          onClick={() => { setMode('signin'); setError(''); setMessage(''); }}
                          className="text-foreground hover:opacity-70 transition-opacity font-medium"
                        >
                          Sign in
                        </button>
                      </p>
                    )}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
