'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import GoogleLoginButton from '@/app/GoogleLoginB';
import { useAuth } from '@/app/AuthContext';

const API_URL = 'https://backend-4-x6ud.onrender.com/api';

const LoginForm = () => {
  const router = useRouter();
  const { setIsAuthenticated, setUser } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<string[]>([]);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);

  const showAlert = () => {
    setShowSuccessAlert(true);
    setTimeout(() => setShowSuccessAlert(false), 3000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);
    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        setIsUnlocked(true);
        showAlert();
        setEmail('');
        setPassword('');
        setIsAuthenticated(true);

        const authRes = await fetch(`${API_URL}/auth/check`, {
          credentials: 'include',
        });
        const authData = await authRes.json();

        if (authData.authenticated) {
          setUser({
            id: authData.id,
            username: authData.username,
            email: authData.email,
            role: authData.role,
          });
        }

        setTimeout(() => router.replace('/'), 3000);
      } else {
        setIsUnlocked(false);
        const tmpErrors: string[] = [];

        if (Array.isArray(data) && data[0]?.msg) {
          data.forEach((err) => tmpErrors.push(err.msg || 'Unknown error'));
        } else if (data.detail) {
          tmpErrors.push(String(data.detail));
        } else {
          for (const value of Object.values(data)) {
            if (Array.isArray(value)) {
              value.forEach((val) => tmpErrors.push(String(val)));
            } else {
              tmpErrors.push(String(value));
            }
          }
        }

        setErrors(tmpErrors);
      }
    } catch (err) {
      setErrors([
        err instanceof Error ? err.message : 'An unexpected error occurred.',
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Success Alert */}
      <AnimatePresence>
        {showSuccessAlert && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.8 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="fixed top-5 left-1/2 -translate-x-1/2 bg-green-600 text-white px-6 py-3 rounded-xl shadow-2xl z-50"
          >
            <div className="flex items-center space-x-2">
              <motion.svg
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </motion.svg>
              <span>Login successful! Redirecting...</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Login UI */}
      <div className="min-h-screen flex items-center justify-center bg-black text-white p-4 relative overflow-hidden">
        {/* Aurora video */}
        <motion.video
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.4 }}
          transition={{ duration: 1.5 }}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          poster="/preview.jpg"
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src="/arora.webm" type="video/webm" />
          <source src="/arora.mp4" type="video/mp4" />
        </motion.video>

        {/* Login Container */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 w-full max-w-sm p-8 rounded-2xl bg-white/5 backdrop-blur-lg shadow-xl border border-white/10"
        >
          {/* Lock Icon */}
          <motion.div
            className="flex justify-center mb-6"
            animate={isUnlocked ? { rotate: -20, y: -10 } : { rotate: 0, y: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          >
            <motion.svg
              width={56}
              height={56}
              viewBox="0 0 56 56"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <radialGradient id="lockBodyGradient" cx="50%" cy="50%" r="70%">
                  <stop offset="0%" stopColor="#a5b4fc" />
                  <stop offset="100%" stopColor="#1e293b" />
                </radialGradient>
                <linearGradient id="shackleGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f1f5f9" />
                  <stop offset="100%" stopColor="#64748b" />
                </linearGradient>
              </defs>
              <motion.path
                d="M16 28V18C16 10.268 22.268 4 30 4C37.732 4 44 10.268 44 18V28"
                stroke="url(#shackleGradient)"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                animate={isUnlocked ? { y: -12, rotate: -25, x: 4 } : { y: 0, rotate: 0, x: 0 }}
              />
              <rect
                x="12"
                y="28"
                width="36"
                height="22"
                rx="6"
                fill="url(#lockBodyGradient)"
                stroke="#64748b"
                strokeWidth="2.5"
              />
              <ellipse cx="30" cy="39.5" rx="2.5" ry="4.5" fill="#334155" opacity="0.4" />
              <ellipse cx="30" cy="38" rx="1.5" ry="2.5" fill="#fff" />
            </motion.svg>
          </motion.div>

          <h1 className="text-2xl font-bold text-center mb-6">Welcome Back</h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative beam-border-circular">
              <input
                type="email"
                name="email"
                autoComplete="username"
                placeholder="Email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-4 pr-4 py-3 rounded-md bg-slate-800/70 text-white placeholder-gray-400 focus:outline-none"
              />
            </div>

            <div className="relative beam-border-circular">
              <input
                type="password"
                name="password"
                autoComplete="current-password"
                placeholder="Password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-4 pr-4 py-3 rounded-md bg-slate-800/70 text-white placeholder-gray-400 focus:outline-none"
              />
            </div>

            <AnimatePresence>
              {errors.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-red-500/20 text-red-300 border border-red-500/30 rounded-md p-2 text-sm"
                >
                  {errors.map((err, idx) => (
                    <div key={`error-${idx}`}>{err}</div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            <motion.button
              type="submit"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              disabled={isLoading}
              className="w-full py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-all"
            >
              {isLoading ? 'Signing In...' : 'Sign In'}
            </motion.button>
          </form>

          <div className="my-6 text-center">
            <div className="text-slate-500 text-sm mb-2">OR</div>
            <GoogleLoginButton />
          </div>

          <p className="mt-4 text-center text-sm text-slate-300">
            Not a member?{' '}
            <Link href="/auth/Register" className="text-blue-400 hover:underline">
              Sign up now
            </Link>
          </p>
        </motion.div>
      </div>
    </>
  );
};

export default LoginForm;
