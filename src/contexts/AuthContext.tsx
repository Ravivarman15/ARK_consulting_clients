import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type Profile = Tables<"profiles">;

/** Sign-ups on this domain get management access — free, unlimited, dashboard. */
export const MANAGEMENT_DOMAIN = "@thearktuition.com";

export const isManagementEmail = (email: string) =>
  email.trim().toLowerCase().endsWith(MANAGEMENT_DOMAIN);

export interface SignUpDetails {
  email: string;
  password: string;
  fullName: string;
  institutionName: string;
  phone: string;
  location: string;
}

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  /** True until the initial session lookup settles — guards render as unknown. */
  loading: boolean;
  isManagement: boolean;
  /** Management never pays; clients unlock by purchase. */
  hasFullAccess: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (details: SignUpDetails) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  markPaid: (paymentId?: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/**
 * The profile row is written by a database trigger on sign-up, so immediately
 * after signUp() it can lag by a few hundred ms. Retry briefly rather than
 * leaving a freshly registered user without a role.
 */
const fetchProfile = async (id: string, attempt = 0): Promise<Profile | null> => {
  const { data, error } = await supabase.from("profiles").select("*").eq("id", id).maybeSingle();
  if (!error && data) return data as Profile;
  if (attempt < 4) {
    await new Promise((r) => setTimeout(r, 300 * (attempt + 1)));
    return fetchProfile(id, attempt + 1);
  }
  return null;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const userId = session?.user?.id ?? null;

  useEffect(() => {
    let active = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      if (!data.session) setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      if (!active) return;
      setSession(next);
      if (!next) {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!userId) return;
    let active = true;
    setLoading(true);
    fetchProfile(userId).then((p) => {
      if (!active) return;
      setProfile(p);
      setLoading(false);
    });
    // Best-effort activity stamp so the dashboard can show who is active.
    supabase.from("profiles").update({ last_seen_at: new Date().toISOString() }).eq("id", userId).then(() => {});
    return () => {
      active = false;
    };
  }, [userId]);

  const value = useMemo<AuthContextValue>(() => {
    const isManagement = profile?.role === "management";

    return {
      session,
      user: session?.user ?? null,
      profile,
      loading,
      isManagement,
      hasFullAccess: isManagement || profile?.is_paid === true,

      signIn: async (email, password) => {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password,
        });
        return { error: error?.message ?? null };
      },

      signUp: async (details) => {
        const { error } = await supabase.auth.signUp({
          email: details.email.trim().toLowerCase(),
          password: details.password,
          options: {
            // Read back out by the handle_new_user() trigger to build the
            // profile row the management dashboard lists.
            data: {
              full_name: details.fullName.trim(),
              institution_name: details.institutionName.trim(),
              phone: details.phone.trim(),
              location: details.location.trim(),
            },
          },
        });
        if (error) return { error: error.message };
        return { error: null };
      },

      signOut: async () => {
        await supabase.auth.signOut();
        setProfile(null);
      },

      refreshProfile: async () => {
        if (!userId) return;
        setProfile(await fetchProfile(userId));
      },

      markPaid: async (paymentId?: string) => {
        if (!userId) return;
        await supabase
          .from("profiles")
          .update({ is_paid: true, razorpay_payment_id: paymentId ?? null })
          .eq("id", userId);
        setProfile((prev) =>
          prev ? { ...prev, is_paid: true, razorpay_payment_id: paymentId ?? null } : prev
        );
      },
    };
  }, [session, profile, loading, userId]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
};
