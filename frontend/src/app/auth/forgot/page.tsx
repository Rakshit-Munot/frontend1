"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Head from "next/head";
import Image from "next/image";
import { useRouter } from "next/navigation";

const API_URL = `${process.env.NEXT_PUBLIC_API_URL}/api`;

export default function ForgotPasswordPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [errors, setErrors] = useState<string[]>([]);
  const [status, setStatus] = useState<string | null>(null);

  const [sendingOtp, setSendingOtp] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const isValidEmail = (val: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());

  // Cooldown ticker for Send OTP
  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setInterval(() => setCooldown((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, [cooldown]);

  const handleSendOtp = async () => {
    setErrors([]);
    setStatus(null);
    if (!isValidEmail(email)) {
      setErrors(["Please enter a valid institute email address."]);
      return;
    }
    try {
      setSendingOtp(true);
      setCooldown(30); // 30s cooldown
      // Assumed endpoint for sending OTP
      await fetch(`${API_URL}/auth/forgot-password/otp/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      }).catch(() => {});
      setStatus("If an account exists, an OTP has been sent to your email.");
    } catch (e: unknown) { // FIX: Changed 'any' to 'unknown'
      if (e instanceof Error) {
        setErrors([e.message]);
      } else {
        setErrors(["Failed to send OTP. Please try again."]);
      }
    } finally {
      // small delay so the user perceives progress
      setTimeout(() => setSendingOtp(false), 400);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);
    setStatus(null);

    const tmp: string[] = [];
    if (!isValidEmail(email)) tmp.push("Please enter a valid email.");
    if (!otp || otp.trim().length < 4) tmp.push("Please enter the OTP sent to your email.");
    if (!newPassword) tmp.push("Please enter a new password.");
    if (newPassword && newPassword.length < 6) tmp.push("Password must be at least 6 characters.");
    if (newPassword !== confirmPassword) tmp.push("Passwords do not match.");

    if (tmp.length) {
      setErrors(tmp);
      return;
    }

    try {
      setSubmitting(true);
      // Assumed endpoint for OTP-based password reset
      const resp = await fetch(`${API_URL}/auth/forgot-password/otp/reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: otp.trim(), new_password: newPassword }),
      });

      if (!resp.ok) {
        const data = await resp.json().catch(() => ({}));
        const msgs: string[] = [];
        if (data && typeof data === "object") {
          // FIX: Changed 'any' to 'unknown'
          Object.values(data).forEach((v: unknown) => Array.isArray(v) ? v.forEach((x: unknown) => msgs.push(String(x))) : msgs.push(String(v)));
        }
        setErrors(msgs.length ? msgs : ["Could not reset password. Check OTP and try again."]);
        return;
      }

      setStatus("Password has been updated. Redirecting to login…");
      setTimeout(() => router.push("/auth/login"), 1200);
    } catch (e: unknown) { // FIX: Changed 'any' to 'unknown'
      if (e instanceof Error) {
        setErrors([e.message]);
      } else {
        setErrors(["An unexpected error occurred."]);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Head>
        {process.env.NEXT_PUBLIC_API_URL && (
          <>
            <link rel="preconnect" href={process.env.NEXT_PUBLIC_API_URL} />
            <link rel="dns-prefetch" href={process.env.NEXT_PUBLIC_API_URL} />
          </>
        )}
      </Head>

      <div className="min-h-screen flex flex-col bg-white auth-forgot-page" style={{ fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif' }}>
        <div className="header"><div style={{ margin: 'auto' }}>LNMIIT Employee Laboratory Management Portal</div></div>

        <div className="no-sidebar-body">
          <form className="user-manager-dialog-box" onSubmit={handleReset}>
            <Image src="/LNMIIT-logo.jpg" alt="LNMIIT" width={150} height={75} priority style={{ marginBottom: 12 }} />

            {/* Email */}
            <div className="block text-sm font-medium leading-6 text-gray-900" style={{ width: '400px' }}>
              <label htmlFor="email" style={{ display: 'inline-block', width: '200px' }}>
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
                style={{ display: 'inline-block', width: '200px', height: '36px', marginBottom: '16px' }}
                autoComplete="username"
              />
            </div>

            {/* Send OTP link + OTP input */}
            <div style={{ marginTop: -15 }}>
              <div
                className="underline w-full text-right text-blue-900"
                // FIX: Added 'sendingOtp' to the disabled logic
                style={{ fontWeight: 500, fontSize: 12, cursor: cooldown > 0 || !isValidEmail(email) || sendingOtp ? 'not-allowed' : 'pointer', opacity: cooldown > 0 || !isValidEmail(email) || sendingOtp ? 0.6 : 1 }}
                // FIX: Added 'sendingOtp' to the click guard
                onClick={() => { if (cooldown > 0 || !isValidEmail(email) || sendingOtp) return; handleSendOtp(); }}
              >
                {/* FIX: Show 'Sending...' text */}
                {sendingOtp ? 'Sending…' : (cooldown > 0 ? `Send OTP (in ${cooldown}s)` : 'Send OTP')}
              </div>
              <div className="block text-sm font-medium leading-6 text-gray-900" style={{ width: '400px' }}>
                <label htmlFor="otp" style={{ display: 'inline-block', width: '200px' }}>
                  Enter OTP Received<span style={{ color: 'red' }}>*</span>
                </label>
                {/* FIX: Completed this input */}
                <input
                  id="otp"
                  required
                  className="input-1"
                  placeholder=""
                  type="text"
                  inputMode="numeric"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  style={{ display: 'inline-block', width: '200px', height: '36px', marginBottom: '16px' }}
                />
              </div>
            </div>

            {/* New Password */}
            <div className="block text-sm font-medium leading-6 text-gray-900" style={{ width: '400px' }}>
              <label htmlFor="newPassword" style={{ display: 'inline-block', width: '200px' }}>
                Enter New Password<span style={{ color: 'red' }}>*</span>
              </label>
              {/* FIX: Completed this input */}
              <input
                id="newPassword"
                required
                className="input-1"
                placeholder=""
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                style={{ display: 'inline-block', width: '200px', height: '36px', marginBottom: '16px' }}
                autoComplete="new-password"
              />
            </div>

            {/* Confirm Password */}
            <div className="block text-sm font-medium leading-6 text-gray-900" style={{ width: '400px' }}>
              <label htmlFor="confirmPassword" style={{ display: 'inline-block', width: '200px' }}>
                Confirm New Password<span style={{ color: 'red' }}>*</span>
              </label>
              {/* FIX: Completed this input */}
              <input
                id="confirmPassword"
                required
                className="input-1"
                placeholder=""
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                style={{ display: 'inline-block', width: '200px', height: '36px', marginBottom: '16px' }}
                autoComplete="new-password"
              />
            </div>

            {/* Errors */}
            {errors.length > 0 && (
              <div className="bg-rose-50 text-rose-700 border border-rose-200 rounded-md p-2 text-sm" style={{ width: '400px' }}>
                {errors.map((err, idx) => (<div key={idx}>{err}</div>))}
              </div>
            )}
            {status && (
              <div className="bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md p-2 text-sm" style={{ width: '400px', marginTop: 8 }}>
                {/* FIX: Completed this text */}
                {status}
              </div>
            )}

            {/* Buttons */}
            <div className="320px" style={{ width: '320px', margin: 'auto' }}>
              <button
                type="submit"
                disabled={submitting}
                className="flex w-full justify-center rounded-md bg-gray-800 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-gray-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-800"
                style={{ backgroundColor: 'green', border: '2px solid white', margin: '10px 0 0', boxShadow: 'green 0px 0px 3px', opacity: 1 }}
              >
                {submitting ? 'Setting…' : 'Set New Password'}
              </button>
            </div>
            <div className="320px" style={{ width: '320px', margin: 'auto' }}>
              <button
                type="button"
                onClick={() => router.push('/auth/login')}
                className="flex w-full justify-center rounded-md bg-gray-800 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-gray-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-800"
                style={{ backgroundColor: 'darkblue', border: '2px solid white', margin: '10px 0 0', boxShadow: 'darkblue 0px 0px 3px', opacity: 1 }}
              >
                Move to Login?
              </button>
            </div>
          </form>
        </div>

        {/* FIX: Completed this section */}
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
      </div>

      {/* Hidden link to gently prefetch login */}
      <div style={{ display: 'none' }} aria-hidden>
        {/* FIX: Completed this Link */}
        <Link href="/auth/login" prefetch><span /></Link>
      </div>
    </>
  );
}