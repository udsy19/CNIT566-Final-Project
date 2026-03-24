'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { BookOpen, Brain, Zap, BarChart3 } from 'lucide-react';

type Mode = 'signin' | 'signup' | 'forgot';

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

    const supabase = createClient();

    if (mode === 'forgot') {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/dashboard`,
      });
      if (error) {
        setError(error.message);
      } else {
        setMessage('Check your email for a password reset link.');
      }
      setLoading(false);
      return;
    }

    if (mode === 'signup') {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setError(error.message);
      } else {
        setMessage('Check your email to confirm your account.');
      }
      setLoading(false);
      return;
    }

    // Sign in
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push('/dashboard');
    }
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
                    {mode === 'signin' && 'Sign in'}
                    {mode === 'signup' && 'Create account'}
                    {mode === 'forgot' && 'Reset password'}
                  </h2>
                  <p className="text-sm text-muted-foreground mb-6">
                    {mode === 'signin' && 'Welcome back to Beacon'}
                    {mode === 'signup' && 'Get started with Beacon'}
                    {mode === 'forgot' && "We'll send you a reset link"}
                  </p>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label htmlFor="email" className="block text-xs font-medium mb-1.5">
                        Email address
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

                    {mode !== 'forgot' && (
                      <div>
                        <label htmlFor="password" className="block text-xs font-medium mb-1.5">
                          Password
                        </label>
                        <input
                          id="password"
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Enter your password"
                          required
                          className="w-full px-5 py-3.5 text-sm bg-background border border-border rounded-full outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted-foreground/40"
                        />
                      </div>
                    )}

                    {error && (
                      <p className="text-sm text-destructive">{error}</p>
                    )}
                    {message && (
                      <p className="text-sm text-success">{message}</p>
                    )}

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
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            className="w-4 h-4 border-2 border-background border-t-transparent rounded-full"
                          />
                          {mode === 'signin' ? 'Signing in...' : mode === 'signup' ? 'Creating...' : 'Sending...'}
                        </span>
                      ) : (
                        <>
                          {mode === 'signin' && 'Sign in'}
                          {mode === 'signup' && 'Create account'}
                          {mode === 'forgot' && 'Send reset link'}
                        </>
                      )}
                    </motion.button>

                    {mode !== 'forgot' && (
                      <>
                        <div className="relative my-4">
                          <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-border" />
                          </div>
                          <div className="relative flex justify-center text-xs">
                            <span className="px-3 bg-background text-muted-foreground">or</span>
                          </div>
                        </div>

                        <motion.button
                          type="button"
                          onClick={async () => {
                            const supabase = createClient();
                            await supabase.auth.signInWithOAuth({
                              provider: 'google',
                              options: { redirectTo: `${window.location.origin}/auth/callback` },
                            });
                          }}
                          className="w-full py-3.5 px-8 rounded-full border border-border font-medium hover:bg-muted/50 transition-colors flex items-center justify-center gap-3"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <svg className="w-4 h-4" viewBox="0 0 24 24">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                          </svg>
                          Continue with Google
                        </motion.button>
                      </>
                    )}
                  </form>

                  <div className="mt-5 space-y-2 text-center">
                    {mode === 'signin' && (
                      <>
                        <button
                          onClick={() => { setMode('forgot'); setError(''); setMessage(''); }}
                          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                        >
                          Forgot password?
                        </button>
                        <p className="text-xs text-muted-foreground">
                          Don&apos;t have an account?{' '}
                          <button
                            onClick={() => { setMode('signup'); setError(''); setMessage(''); }}
                            className="text-foreground hover:opacity-70 transition-opacity font-medium"
                          >
                            Sign up
                          </button>
                        </p>
                      </>
                    )}
                    {mode === 'signup' && (
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
                    {mode === 'forgot' && (
                      <button
                        onClick={() => { setMode('signin'); setError(''); setMessage(''); }}
                        className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                      >
                        Back to sign in
                      </button>
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
