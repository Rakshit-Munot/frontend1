'use client';

import GoogleLoginButton from "@/app/GoogleLoginB";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/AuthContext";

const API_URL = 'http://localhost:8000/api';

const LoginForm = () => {
  const router = useRouter();
  const { setIsAuthenticated, setUser } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<any[]>([]);
  const [success, setSuccess] = useState(false);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [hideAlert, setHideAlert] = useState(false);

  const showAlert = () => {
    setShowSuccessAlert(true);
    setHideAlert(false);

    setTimeout(() => setHideAlert(true), 2500);
    setTimeout(() => setShowSuccessAlert(false), 3000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);
    setSuccess(false);

    try {
      const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        showAlert();
        setEmail('');
        setPassword('');
        setIsAuthenticated(true);
        localStorage.setItem('auth-event', `login-${Date.now()}`);

        // Fetch user info
        const authRes = await fetch(`${API_URL}/auth/check`, { credentials: 'include' });
        const authData = await authRes.json();
        if (authData.authenticated) {
          setUser({
            id: authData.id,
            username: authData.username,
            email: authData.email,
            role: authData.role
          });
        }

        setTimeout(() => router.replace('/'), 3000);
        return;
      }

      const tmpErrors: any[] = [];

      // FastAPI error array
      if (Array.isArray(data) && data[0]?.msg) {
        data.forEach((err) => tmpErrors.push(err));
      } else if (data.detail) {
        tmpErrors.push(data.detail);
      } else {
        for (const [key, value] of Object.entries(data)) {
          if (Array.isArray(value)) {
            value.forEach((val) => tmpErrors.push(val));
          } else {
            tmpErrors.push(value);
          }
        }
      }

      setErrors(tmpErrors);
    } catch (err) {
      console.error('❌ Network error:', err);
      setErrors(['Could not connect to server.']);
    }
  };

  return (
    <>
      {showSuccessAlert && (
        <div className={`fixed top-5 left-1/2 -translate-x-1/2 bg-green-600 text-white px-6 py-3 rounded-xl shadow-2xl z-50 transition-all duration-500 ${
          hideAlert ? 'opacity-0 -translate-y-10' : 'opacity-100 translate-y-0'
        }`}>
          Login successful! Redirecting...
        </div>
      )}

      <div className="min-h-screen flex items-center justify-center bg-black text-white p-4 relative overflow-hidden">
        <img src="/street.jpg" alt="Anime background" className="absolute inset-0 w-full h-full object-cover z-0" draggable={false} />
        <div className="w-full max-w-sm relative z-10 flex flex-col items-center">
          <div className="absolute inset-0 bg-white/10 backdrop-blur-2xl border border-white/30 rounded-2xl shadow-2xl overflow-hidden"></div>
          <div className="relative p-8 z-10 w-full">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 drop-shadow">Welcome Back</h1>
              <p className="text-gray-800 mt-2">Sign in to continue to your account.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="sr-only">Email</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-slate-500" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
                    </svg>
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    autoComplete="username"
                    className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter Your Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="sr-only">Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-slate-500" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" />
                    </svg>
                  </div>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    autoComplete="current-password"
                    className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>

              {errors.length > 0 && (
                <div className="p-3 bg-red-500/20 text-red-300 border border-red-500/30 rounded-lg text-sm">
                  {errors.map((error, index) => (
                    <p key={index}>
                      {typeof error === 'string'
                        ? error
                        : typeof error === 'object' && error !== null && 'msg' in error
                        ? `${Array.isArray(error.loc) ? error.loc.join('.') : 'Error'}: ${error.msg}`
                        : JSON.stringify(error)}
                    </p>
                  ))}
                </div>
              )}

              <button
                type="submit"
                className="w-full flex justify-center py-3 px-4 rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
              >
                Sign In
              </button>
            </form>

            <div className="my-6 flex items-center justify-center">
              <div className="h-px bg-slate-700 w-full"></div>
              <span className="px-3 text-sm text-slate-500">OR</span>
              <div className="h-px bg-slate-700 w-full"></div>
            </div>

            <div className="flex justify-center">
              <GoogleLoginButton />
            </div>

            <p className="mt-8 text-center text-sm font-semibold text-gray-900">
              Not a member?{' '}
              <Link href="/auth/Register" className="font-bold text-blue-600 hover:text-blue-500">
                Sign up now
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default LoginForm;
