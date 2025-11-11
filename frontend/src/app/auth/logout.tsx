'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../AuthContext';

const LogoutButton = () => {
  const router = useRouter();
  const { logout } = useAuth();

  const [fadeOut, setFadeOut] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    setFadeOut(true); // start fade animation

    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch (err) {
      console.error('Logout failed:', err);
    }

    // Wait for fade animation to complete before clearing context
    setTimeout(() => {
      logout();         // only now clear auth
      router.push('/'); // redirect
    }, 500); // match fade duration
  };

  return (
    <>
      <button
        onClick={handleLogout}
        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-all"
      >
        Logout
      </button>

      {/* Fade overlay spinner */}
      <AnimatePresence>
        {fadeOut && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
            className="fixed inset-0 bg-black/40 flex items-center justify-center z-[9999]"
          >
            <div className="animate-spin w-12 h-12 border-4 border-white/40 border-t-transparent rounded-full"></div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default LogoutButton;
