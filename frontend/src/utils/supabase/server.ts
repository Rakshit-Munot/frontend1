import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const createClient = async () => {
  const cookieStore = cookies();

  return createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() {
          // @ts-expect-error: cookieStore.getAll is not recognized in current TS types
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              // @ts-expect-error: cookieStore.set may not support CookieOptions typing
              cookieStore.set(name, value, options as CookieOptions)
            );
          } catch {
            // Can be ignored in Server Component context
          }
        },
      },
    }
  );
};
