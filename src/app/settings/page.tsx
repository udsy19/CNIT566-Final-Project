'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon, Monitor, Download, Trash2 } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import TopBar from '@/components/layout/TopBar';
import type { User } from '@/types';

type AuthStatus = 'idle' | 'logging_in' | 'duo_pending' | 'duo_code' | 'completing' | 'completed' | 'error';
type Theme = 'system' | 'light' | 'dark';

export default function SettingsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState<Theme>('system');

  // Brightspace login state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [authStatus, setAuthStatus] = useState<AuthStatus>('idle');
  const [duoCode, setDuoCode] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [polling, setPolling] = useState(false);

  useEffect(() => {
    loadUser();
    const saved = localStorage.getItem('beacon-theme') as Theme | null;
    if (saved) setTheme(saved);
  }, []);

  const pollStatus = useCallback(async () => {
    try {
      const res = await apiFetch('/api/auth/brightspace-status');
      const { data } = await res.json();

      if (data.status === 'duo_code' && data.duoCode) {
        setDuoCode(data.duoCode);
        setAuthStatus('duo_code');
      } else if (data.status === 'completed') {
        setAuthStatus('completed');
        setPolling(false);
        window.location.reload();
      } else if (data.status === 'error') {
        setAuthError(data.error || 'Authentication failed');
        setAuthStatus('error');
        setPolling(false);
      } else {
        setAuthStatus(data.status);
      }
    } catch {
      // Ignore polling errors
    }
  }, []);

  useEffect(() => {
    if (!polling) return;
    const interval = setInterval(pollStatus, 1500);
    return () => clearInterval(interval);
  }, [polling, pollStatus]);

  const loadUser = async () => {
    try {
      const res = await apiFetch('/api/user');
      if (res.ok) {
        const { data } = await res.json();
        setUser(data);
      }
    } catch (err) {
      console.error('Failed to load user:', err);
    }
    setLoading(false);
  };

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;

    setAuthStatus('logging_in');
    setAuthError(null);
    setDuoCode(null);

    try {
      const res = await apiFetch('/api/auth/brightspace-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const { data, error } = await res.json();

      if (error) {
        setAuthError(error);
        setAuthStatus('error');
        return;
      }

      if (data?.duoCode) {
        setDuoCode(data.duoCode);
        setAuthStatus('duo_code');
      } else {
        setAuthStatus(data?.status || 'duo_pending');
      }

      setPolling(true);
    } catch {
      setAuthError('Failed to start authentication');
      setAuthStatus('error');
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Disconnect Brightspace? Your synced data will be preserved.')) return;
    try {
      await apiFetch('/api/auth/brightspace-disconnect', { method: 'POST' });
      loadUser();
    } catch {}
  };

  const handleThemeChange = (t: Theme) => {
    setTheme(t);
    localStorage.setItem('beacon-theme', t);
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    if (t !== 'system') root.classList.add(t);
  };

  const handleClearChat = async () => {
    if (!confirm('Clear all chat history? This cannot be undone.')) return;
    try {
      await apiFetch('/api/ask/history', { method: 'DELETE' });
    } catch {}
  };

  const handleExportData = async () => {
    try {
      const [coursesRes, assignmentsRes] = await Promise.all([
        apiFetch('/api/courses'),
        apiFetch('/api/assignments?upcoming=false'),
      ]);

      const courses = coursesRes.ok ? (await coursesRes.json()).data || [] : [];
      const assignments = assignmentsRes.ok ? (await assignmentsRes.json()).data || [] : [];

      const data = {
        exported_at: new Date().toISOString(),
        courses,
        assignments,
      };

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `beacon-export-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  if (loading) {
    return (
      <>
        <TopBar title="Settings" />
        <div className="p-6 max-w-2xl mx-auto">
          <div className="space-y-4">
            <div className="h-4 bg-muted rounded-full w-1/3 animate-pulse" />
            <div className="h-32 bg-muted rounded-2xl animate-pulse" />
          </div>
        </div>
      </>
    );
  }

  const hasBrightspace = !!user?.brightspace_access_token;
  const isAuthenticating = ['logging_in', 'duo_pending', 'duo_code', 'completing'].includes(authStatus);

  return (
    <>
      <TopBar title="Settings" />
      <div className="p-6 max-w-2xl mx-auto space-y-6">
        {/* Brightspace connection */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 rounded-2xl border border-border bg-background"
        >
          <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-4">Brightspace</p>

          {hasBrightspace ? (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <motion.div
                  className="w-2 h-2 rounded-full bg-success"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                <span className="text-sm text-muted-foreground">Connected</span>
              </div>
              {user?.last_synced_at && (
                <p className="text-xs text-muted-foreground mb-4">
                  Last synced: {new Date(user.last_synced_at).toLocaleString()}
                </p>
              )}
              <motion.button
                onClick={handleDisconnect}
                className="px-5 py-2 rounded-full border border-border text-sm text-muted-foreground hover:text-destructive hover:border-destructive transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Disconnect
              </motion.button>
            </div>
          ) : (
            <div>
              <AnimatePresence mode="wait">
                {isAuthenticating ? (
                  <motion.div
                    key="authenticating"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="text-center py-8"
                  >
                    {authStatus === 'duo_code' && duoCode ? (
                      <>
                        <p className="text-xs font-mono text-muted-foreground mb-3">Duo verification code</p>
                        <motion.div
                          initial={{ scale: 0.8 }}
                          animate={{ scale: 1 }}
                          className="text-6xl font-light tabular-nums tracking-widest mb-4"
                        >
                          {duoCode}
                        </motion.div>
                        <p className="text-sm text-muted-foreground mb-2">
                          Match this code on your phone and approve
                        </p>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                          className="w-5 h-5 border-2 border-foreground/20 border-t-foreground rounded-full mx-auto mt-4"
                        />
                      </>
                    ) : (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="w-6 h-6 border-2 border-foreground/20 border-t-foreground rounded-full mx-auto mb-4"
                        />
                        <p className="text-sm text-muted-foreground">
                          {authStatus === 'logging_in' && 'Signing in to Brightspace...'}
                          {authStatus === 'duo_pending' && 'Waiting for Duo...'}
                          {authStatus === 'completing' && 'Completing authentication...'}
                        </p>
                      </>
                    )}
                  </motion.div>
                ) : (
                  <motion.form
                    key="form"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    onSubmit={handleConnect}
                    className="space-y-4"
                  >
                    <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                      Sign in with your Purdue credentials to connect Brightspace.
                    </p>
                    <div>
                      <label className="block text-xs font-medium mb-1.5">Purdue username</label>
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="pete123"
                        required
                        className="w-full px-5 py-3 text-sm bg-background border border-border rounded-full outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted-foreground/40"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1.5">Password</label>
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="BoilerUp!"
                        required
                        className="w-full px-5 py-3 text-sm bg-background border border-border rounded-full outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted-foreground/40"
                      />
                    </div>
                    {authError && (
                      <p className="text-sm text-destructive">{authError}</p>
                    )}
                    <motion.button
                      type="submit"
                      className="w-full py-3 px-6 rounded-full bg-foreground text-background font-medium hover:opacity-90 transition-opacity"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Connect Brightspace
                    </motion.button>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>
          )}
        </motion.div>

        {/* Theme preferences */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-6 rounded-2xl border border-border bg-background"
        >
          <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-4">Appearance</p>
          <div className="flex gap-2">
            {([
              { key: 'system' as Theme, icon: Monitor, label: 'System' },
              { key: 'light' as Theme, icon: Sun, label: 'Light' },
              { key: 'dark' as Theme, icon: Moon, label: 'Dark' },
            ]).map(({ key, icon: Icon, label }) => (
              <button
                key={key}
                onClick={() => handleThemeChange(key)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm transition-all ${
                  theme === key
                    ? 'bg-foreground text-background font-medium'
                    : 'border border-border text-muted-foreground hover:text-foreground hover:border-foreground/20'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Account */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="p-6 rounded-2xl border border-border bg-background"
        >
          <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-4">Account</p>
          <p className="text-sm">
            <span className="text-muted-foreground">Email: </span>
            <span className="font-medium">{user?.email || 'Unknown'}</span>
          </p>
        </motion.div>

        {/* Data management */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="p-6 rounded-2xl border border-border bg-background"
        >
          <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-4">Data</p>
          <div className="space-y-3">
            <button
              onClick={handleExportData}
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors w-full"
            >
              <Download className="w-4 h-4" />
              Export all data (JSON)
            </button>
            <button
              onClick={handleClearChat}
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-muted-foreground hover:text-destructive hover:bg-muted/50 transition-colors w-full"
            >
              <Trash2 className="w-4 h-4" />
              Clear chat history
            </button>
          </div>
        </motion.div>
      </div>
    </>
  );
}
