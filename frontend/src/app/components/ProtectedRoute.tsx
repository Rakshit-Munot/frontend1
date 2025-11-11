"use client";
import { useAuth } from "../AuthContext";
import { usePathname } from "next/navigation";
import LoginForm  from "../auth/login/page" ;

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loader } = useAuth();
  const pathname = usePathname();

  if (loader) return null; // or a spinner

  // Public auth routes (login, register, reset password, etc.) should bypass protection
  if (pathname.startsWith("/auth")) return children;

  // If not authenticated, show login page
  if (!isAuthenticated) return <LoginForm />;

  // If authenticated, show the requested page
  return <>{children}</>;
}