'use client';

import { GoogleLogin } from '@react-oauth/google';
import { useRouter } from 'next/navigation';
import type { CredentialResponse } from '@react-oauth/google';
import axios, { type AxiosError } from 'axios';
import { useAuth } from './AuthContext';

export default function GoogleLoginButton() {
  const router = useRouter();
  const { setIsAuthenticated } = useAuth();

 const handleLogin = async (response: CredentialResponse) => {
  try {
    const token = response.credential;

    if (!token) {
      alert("❌ No token received from Google.");
      return;
    }

    const res = await axios.post(
      'https://backend-4-x6ud.onrender.com//api/auth/google-login',
      { token },
      { withCredentials: true }
    );

    alert("✅ Google login successful: " + res.data.email);
    setIsAuthenticated(true);
    localStorage.setItem('auth-event', `login-${Date.now()}`);
    router.replace('/');
  } catch (error) {
    const err = error as AxiosError<{ detail?: string }>;
    alert("❌ Google login failed: " + (err.response?.data?.detail || err.message));
  }
};


  return (
    <GoogleLogin
      onSuccess={handleLogin}
      onError={() => alert("Google login failed")}
    />
  );
}
