'use client';

import { GoogleLogin } from '@react-oauth/google';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { useAuth } from './AuthContext'; // ✅ import the context

export default function GoogleLoginButton() {
  const router = useRouter();
  const { setIsAuthenticated } = useAuth(); // ✅ use context

  const handleLogin = async (response: any) => {
    try {
      const token = response.credential;

      const res = await axios.post(
        'http://localhost:8000/api/auth/google-login',
        { token },
        { withCredentials: true }
      );
      alert("✅ Google login successful: " + res.data.email);
      setIsAuthenticated(true);
      localStorage.setItem('auth-event', `login-${Date.now()}`);
      router.replace('/');

      // alert("✅ Google login successful: " + res.data.email);

      // setIsAuthenticated(true); // ✅ IMPORTANT: update global auth state
      // router.replace('/'); // or wherever you want

    } catch (error: any) {
      alert("❌ Google login failed: " + (error.response?.data?.detail || error.message));
    }
  };

  return (
    <GoogleLogin
      onSuccess={handleLogin}
      onError={() => alert("Google login failed")}
    />
  );
}
