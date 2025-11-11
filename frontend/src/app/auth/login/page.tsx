"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Head from 'next/head';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/app/AuthContext';

const API_URL = `${process.env.NEXT_PUBLIC_API_URL}/api`;

const LoginForm = () => {
  const router = useRouter();
  const { setIsAuthenticated, setUser } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<string[]>([]);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    if (fadeOut) {
      const timeout = setTimeout(() => {
        router.replace('/');
      }, 500);
      return () => clearTimeout(timeout);
    }
  }, [fadeOut, router]);

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
      
      // FIX: Typed data as unknown
      const data: unknown = await response.json().catch(() => ({}));

      if (!response.ok) {
        const tmp: string[] = [];
        if (data && typeof data === 'object') {
          // FIX: Replaced 'any' with 'Record<string, unknown>' for type-safe access
          const detail = (data as Record<string, unknown>).detail;
          if (Array.isArray(detail)) {
            // FIX: Replaced 'any' with 'unknown'
            detail.forEach((d: unknown) => tmp.push((d as { msg: string })?.msg || String(d)));
          } else {
            // FIX: Replaced 'any' with 'unknown'
            Object.values(data).forEach((v: unknown) => Array.isArray(v) ? v.forEach((x: unknown) => tmp.push(String(x))) : tmp.push(String(v)));
          }
        }
        setErrors(tmp.length ? tmp : ['Invalid email or password.']);
        setIsLoading(false);
        return;
      }

      const authRes = await fetch(`${API_URL}/auth/check`, { credentials: 'include' });
      const authData = await authRes.json().catch(() => ({}));
      if (authData?.authenticated && authData?.user) {
        setUser({ id: authData.user.id, username: authData.user.username, email: authData.user.email, role: authData.user.role });
        setIsAuthenticated(true);
        setFadeOut(true);
        setShowSuccessAlert(true);
      } else {
        setIsAuthenticated(false);
        setUser(null);
        setErrors(['Invalid email or password.']);
      }
    } catch (err: unknown) { // FIX: Changed 'any' to 'unknown'
      // FIX: Added instanceof Error check for type safety
      if (err instanceof Error) {
        setErrors([err.message]);
      } else {
        setErrors(['An unexpected error occurred.']);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Preconnect hints for API/WS to reduce handshake latency */}
      <Head>
        {process.env.NEXT_PUBLIC_API_URL && (
          <>
            <link rel="preconnect" href={process.env.NEXT_PUBLIC_API_URL} />
            <link rel="dns-prefetch" href={process.env.NEXT_PUBLIC_API_URL} />
          </>
        )}
        {process.env.NEXT_PUBLIC_WS_URL && (
          <>
            <link rel="preconnect" href={process.env.NEXT_PUBLIC_WS_URL} />
            <link rel="dns-prefetch" href={process.env.NEXT_PUBLIC_WS_URL} />
          </>
        )}
      </Head>
      {/* ✅ Success Alert */}
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

      {/* Login UI using provided structure/classes */}
      <motion.div
        initial={{ opacity: 1 }}
        animate={{ opacity: fadeOut ? 0 : 1 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="min-h-screen flex flex-col bg-white"
        style={{ fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif' }}
      >
        <div className="header"><div style={{ margin: 'auto' }}>LNMIIT Employee Laboratory Management Portal</div></div>

        <div className="no-sidebar-body">
          <form className="user-manager-dialog-box" onSubmit={handleSubmit}>
            <Image src="/LNMIIT-logo.jpg" alt="LNMIIT" width={150} height={75} priority style={{ marginBottom: 20 }} />

            {/* Email row */}
            <div className="block text-sm font-medium leading-6 text-gray-900" style={{ width: '320px' }}>
              <label htmlFor="email" style={{ display: 'inline-block', width: '120px' }}>
                Email ID<span style={{ color: 'red' }}>*</span>
              </label>
              <input
                id="email"
                required
                className="input-1"
                placeholder="bhawani.sharma@lnmiit.ac.in"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ display: 'inline-block', width: '200px', height: '36px', marginBottom: '20px' }}
                autoComplete="username"
              />
            </div>

            {/* Password row */}
            <div className="block text-sm font-medium leading-6 text-gray-900" style={{ width: '320px' }}>
              <label htmlFor="password" style={{ display: 'inline-block', width: '120px' }}>
                Password<span style={{ color: 'red' }}>*</span>
              </label>
              <input
                id="password"
                required
                className="input-1"
                placeholder=""
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ display: 'inline-block', width: '200px', height: '36px', marginBottom: '20px' }}
                autoComplete="current-password"
              />
            </div>

            {/* Errors */}
            <AnimatePresence>
              {errors.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="bg-rose-50 text-rose-700 border border-rose-200 rounded-md p-2 text-sm"
                  style={{ width: '320px' }}
                >
                  {errors.map((err, idx) => (
                    <div key={idx}>{err}</div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Buttons */}
            <div className="320px" style={{ width: '320px', margin: 'auto' }}>
              <button
                type="submit"
                disabled={isLoading}
                className="flex w-full justify-center rounded-md bg-gray-800 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-gray-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-800"
                style={{ backgroundColor: 'green', border: '2px solid white', margin: '15px 0px 0px', boxShadow: 'green 0px 0px 3px', opacity: 1 }}
              >
                {isLoading ? 'Signing In…' : 'Login'}
              </button>
            </div>
            <div className="320px" style={{ width: '320px', margin: 'auto' }}>
              <button
                type="button"
                onClick={() => router.push('/auth/forgot')}
                className="flex w-full justify-center rounded-md text-sm font-semibold leading-6 text-white shadow-sm"
                style={{ backgroundColor: 'darkblue', border: '2px solid white', margin: '15px 0px 0px', boxShadow: 'darkblue 0px 0px 3px', opacity: 1, padding: '10px 12px' }}
              >
                Forgot Password
              </button>
            </div>
          </form>
        </div>

        <div className="footer">
          <div style={{ display: 'flex', width: '100%', alignItems: 'center', gap: 8 }}>
            <div className="exclamation-mark" aria-hidden>
              <svg aria-hidden="true" focusable="false" data-prefix="fas" data-icon="exclamation" className="svg-inline--fa fa-exclamation" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 512" width="16" height="16">
                <path fill="currentColor" d="M96 64c0-17.7-14.3-32-32-32S32 46.3 32 64l0 256c0 17.7 14.3 32 32 32s32-14.3 32-32L96 64zM64 480a40 40 0 1 0 0-80 40 40 0 1 0 0 80z" />
              </svg>
            </div>
            KINDLY USE INSTITUTE PROVIDED EMAIL ID WHEN REQUIRED
          </div>
        </div>
      </motion.div>

      {/* Hidden links to gently prefetch common routes */}
      <div style={{ display: 'none' }} aria-hidden>
        <Link href="/" prefetch><span /></Link>
        <Link href="/Equipments" prefetch><span /></Link>
      </div>

      {/* Forgot password moved to dedicated page /auth/forgot */}
    </>
  );
};

export default LoginForm;

// FIX: Removed unused helper components TickCooldown and AutoClose