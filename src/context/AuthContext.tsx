import { useEffect, useMemo, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { isSupabaseConfigured, supabase } from "../database/supabaseClient";
import { setActiveUser } from "../database/persistence";
import { migrateLocalDataToCloud } from "../services/migrationService";
import { syncUserSettingsFromCloud } from "../services/settingsService";
import { getUserSettings, saveUserSettings } from "../repositories/userSettingsRepository";
import { AuthContext, type AuthContextValue } from "./authContextValue";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(isSupabaseConfigured);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      return;
    }

    let mounted = true;
    const applySession = async (nextSession: Session | null) => {
      if (!mounted) return;
      setSession(nextSession);
      setActiveUser(nextSession?.user.id ?? null);
      if (nextSession?.user.id) {
        try {
          await migrateLocalDataToCloud(nextSession.user.id);
          const existingSettings = await getUserSettings();
          if (!existingSettings) {
            const metadata = nextSession.user.user_metadata as { birthDate?: string; phone?: string };
            await saveUserSettings({
              baseCurrency: "USD",
              theme: "light",
              birthDate: metadata.birthDate ?? "",
              phone: metadata.phone ?? "",
            });
          }
          await syncUserSettingsFromCloud();
        } catch (error) {
          console.error("No se pudieron migrar los datos locales a Supabase", error);
        }
      }
      if (mounted) setLoading(false);
    };

    void supabase.auth.getSession().then(({ data }) => applySession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      void applySession(nextSession);
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
      setActiveUser(null);
    };
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    user: session?.user ?? null,
    session,
    loading,
    configured: isSupabaseConfigured,
    async signIn(email, password) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    },
    async signUp(email, password, metadata) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin,
          data: metadata,
        },
      });
      if (error) throw error;
      return { needsConfirmation: !data.session };
    },
    async resetPassword(email) {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin,
      });
      if (error) throw error;
    },
    async updatePassword(password) {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
    },
    async signOut() {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    },
    async signInWithGoogle() {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
    },
  }), [loading, session]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}