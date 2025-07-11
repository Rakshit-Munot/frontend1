'use client';

import { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

interface GoogleCredentialResponse {
  credential?: string;
}

interface JwtDecoded {
  email: string;
  picture?: string;
  [key: string]: unknown;
}

const API_URL = 'https://backend-4-x6ud.onrender.com/api/auth';

const SignUpForm = () => {
  const router = useRouter();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password1, setPassword1] = useState('');
  const [password2, setPassword2] = useState('');
  const [errors, setErrors] = useState<string[]>([]);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [hideAlert, setHideAlert] = useState(false);
  const [googleFilled, setGoogleFilled] = useState(false);
  const [picture, setPicture] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

  const showAlert = () => {
    setShowSuccessAlert(true);
    setHideAlert(false);
    setTimeout(() => setHideAlert(true), 2500);
    setTimeout(() => setShowSuccessAlert(false), 3000);
  };

  const calculatePasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength += 25;
    if (/[A-Z]/.test(password)) strength += 25;
    if (/[0-9]/.test(password)) strength += 25;
    if (/[^A-Za-z0-9]/.test(password)) strength += 25;
    return strength;
  };

  const handlePasswordChange = (value: string) => {
    setPassword1(value);
    setPasswordStrength(calculatePasswordStrength(value));
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength < 25) return 'from-red-500 to-red-600';
    if (passwordStrength < 50) return 'from-orange-500 to-yellow-500';
    if (passwordStrength < 75) return 'from-yellow-500 to-green-500';
    return 'from-green-500 to-emerald-500';
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength < 25) return 'Weak';
    if (passwordStrength < 50) return 'Fair';
    if (passwordStrength < 75) return 'Good';
    return 'Strong';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);
    setIsLoading(true);

    if (!googleFilled) {
      setErrors(['Please sign in with your LNMIIT Google account first.']);
      setIsLoading(false);
      return;
    }

    if (password1 !== password2) {
      setErrors(['Passwords do not match']);
      setIsLoading(false);
      return;
    }

    const formData = {
      email,
      password: password1,
      picture,
    };

    try {
      const response = await fetch(`${API_URL}/google-signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        showAlert();
        setUsername('');
        setEmail('');
        setPassword1('');
        setPassword2('');
        setGoogleFilled(false);

        setTimeout(() => {
          router.push('/dashboard');
        }, 1000);
      } else {
        const tmpErrors: string[] = [];
        if (data.detail) {
          tmpErrors.push(data.detail);
        } else {
          for (const [key, value] of Object.entries(data)) {
            if (Array.isArray(value)) {
              value.forEach((val) => tmpErrors.push(`${key}: ${val}`));
            } else {
              tmpErrors.push(`${key}: ${value}`);
            }
          }
        }
        setErrors(tmpErrors);
      }
    } catch {
      setErrors(['Could not connect to server.']);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Success Alert */}
      {showSuccessAlert && (
        <div
          className={`fixed top-8 left-1/2 transform -translate-x-1/2 z-50 transition-all duration-500 ${
            hideAlert ? 'opacity-0 -translate-y-4' : 'opacity-100 translate-y-0'
          }`}
        >
          <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-8 py-4 rounded-2xl shadow-2xl border border-green-400/30 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="font-semibold">Registration successful!</span>
            </div>
          </div>
        </div>
      )}

      <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 z-0">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover opacity-40"
            style={{ pointerEvents: 'none' }}
          >
            <source src="/arora.mp4" type="video/mp4" />
            <Image 
              src="/street.jpg" 
              alt="Background" 
              fill
              className="object-cover"
              priority
            />
          </video>
        </div>

        {/* Floating Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl animate-pulse animation-delay-1000"></div>
          <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-pink-500/10 rounded-full blur-2xl animate-float"></div>
          <div className="absolute bottom-1/4 right-1/4 w-24 h-24 bg-cyan-500/10 rounded-full blur-2xl animate-float animation-delay-2000"></div>
        </div>

        {/* Main Form Container */}
        <div className="w-full max-w-md relative z-10 p-6">
          <div className="relative group">
            {/* Glassmorphic Background with Glow */}
            <div className="absolute inset-0 bg-white/10 backdrop-blur-2xl border border-white/20 rounded-3xl shadow-2xl transition-all duration-700 group-hover:bg-white/15 group-hover:border-white/30"></div>
            <div className="absolute -inset-1 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-3xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
            
            <div className="relative p-8 z-10">
              {/* Header */}
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-500 rounded-2xl mb-4 shadow-lg">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                </div>
                <h2 className="text-4xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent mb-2">
                  Join LNMIIT
                </h2>
                <p className="text-gray-400">Create your account to get started</p>
              </div>

              {/* Google Sign In */}
              {!googleFilled && (
                <div className="mb-6">
                  <div className="relative group">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl blur opacity-30 group-hover:opacity-60 transition duration-300"></div>
                    <div className="relative bg-white/5 backdrop-blur-sm border border-white/20 rounded-xl p-4 flex justify-center">
                      <GoogleLogin
                        onSuccess={(response: GoogleCredentialResponse) => {
                          if (!response.credential) {
                            setErrors(['Google sign-in failed']);
                            return;
                          }
                          const decoded: JwtDecoded = jwtDecode(response.credential);
                          const userEmail = decoded.email;
                          if (!userEmail.endsWith('@lnmiit.ac.in')) {
                            setErrors(['Only LNMIIT emails are allowed.']);
                            return;
                          }
                          setEmail(userEmail);
                          setUsername(userEmail.split('@')[0]);
                          setPicture(decoded.picture || '');
                          setGoogleFilled(true);
                        }}
                        onError={() => setErrors(['Google sign-in failed'])}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Google Success Message */}
              {googleFilled && (
                <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-xl backdrop-blur-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-green-400 font-medium">Google account verified</p>
                      <p className="text-xs text-gray-400">{email}</p>
                    </div>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Username Field */}
                <div className="relative group">
                  <label className="block text-sm font-medium text-gray-300 mb-2">Username</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <input
                      value={username}
                      placeholder="Username"
                      type="text"
                      disabled
                      className="w-full h-14 pl-12 pr-4 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-400 backdrop-blur-sm transition-all duration-300 focus:bg-white/10 focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20"
                      required
                    />
                  </div>
                </div>

                {/* Email Field */}
                <div className="relative group">
                  <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                      </svg>
                    </div>
                    <input
                      value={email}
                      placeholder="Email"
                      type="email"
                      disabled
                      className="w-full h-14 pl-12 pr-4 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-400 backdrop-blur-sm transition-all duration-300 focus:bg-white/10 focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20"
                      required
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div className="relative group">
                  <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <input
                      onChange={(e) => handlePasswordChange(e.target.value)}
                      value={password1}
                      placeholder="Enter your password"
                      type="password"
                      className="w-full h-14 pl-12 pr-4 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-400 backdrop-blur-sm transition-all duration-300 focus:bg-white/10 focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20"
                      required
                    />
                  </div>
                  
                  {/* Password Strength Indicator */}
                  {password1 && (
                    <div className="mt-2">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                          <div
                            className={`h-full bg-gradient-to-r ${getPasswordStrengthColor()} transition-all duration-500 rounded-full`}
                            style={{ width: `${passwordStrength}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-400 font-medium">
                          {getPasswordStrengthText()}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Confirm Password Field */}
                <div className="relative group">
                  <label className="block text-sm font-medium text-gray-300 mb-2">Confirm Password</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <input
                      onChange={(e) => setPassword2(e.target.value)}
                      value={password2}
                      placeholder="Re-enter your password"
                      type="password"
                      className="w-full h-14 pl-12 pr-4 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-400 backdrop-blur-sm transition-all duration-300 focus:bg-white/10 focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20"
                      required
                    />
                    {password2 && password1 && (
                      <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                        {password1 === password2 ? (
                          <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Error Messages */}
                {errors.map((error, index) => (
                  <div key={`error_${index}`} className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl backdrop-blur-sm">
                    <div className="flex items-center gap-3">
                      <svg className="w-5 h-5 text-red-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                      <span className="text-red-300 text-sm">{error}</span>
                    </div>
                  </div>
                ))}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={!googleFilled || isLoading}
                  className={`relative w-full h-14 rounded-xl font-semibold text-white transition-all duration-300 ${
                    googleFilled && !isLoading
                      ? 'bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 shadow-lg hover:shadow-xl hover:shadow-purple-500/25 hover:scale-[1.02] active:scale-[0.98]'
                      : 'bg-gray-600 cursor-not-allowed opacity-50'
                  }`}
                >
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl opacity-0 group-hover:opacity-30 blur transition-opacity duration-300"></div>
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    {isLoading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        Creating Account...
                      </>
                    ) : (
                      'Create Account'
                    )}
                  </span>
                </button>

                {/* Login Link */}
                <div className="text-center pt-4">
                  <p className="text-gray-400">
                    Already have an account?{' '}
                    <a 
                      href="/auth/login" 
                      className="font-semibold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent hover:from-purple-300 hover:to-blue-300 transition-all duration-300"
                    >
                      Sign in here
                    </a>
                  </p>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .animation-delay-1000 {
          animation-delay: 1000ms;
        }
        .animation-delay-2000 {
          animation-delay: 2000ms;
        }
        
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-20px);
          }
        }
        
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        
        .group:hover .group-hover\\:animate-pulse {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>
    </>
  );
};

export default SignUpForm;