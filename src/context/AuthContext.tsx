import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { AuthChangeEvent, Session } from "@supabase/supabase-js";
import { isSupabaseConfigured, supabase } from "../database/supabaseClient";
import { setActiveUser } from "../database/persistence";
import { migrateLocalDataToCloud } from "../services/migrationService";
import { getBirthDate, syncUserSettingsFromCloud } from "../services/settingsService";
import { getUserSettings, saveUserSettings } from "../repositories/userSettingsRepository";
import { clearStoredAppPage } from "../navigation/appPage";
import { AuthContext, type AuthContextValue } from "./authContextValue";
import { shouldSkipProfileHydration, type AuthSessionEvent } from "./authSession";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [profileComplete, setProfileComplete] = useState(false);
  const sessionRef = useRef<Session | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      return;
    }

    let mounted = true;

    const clearSession = () => {
      sessionRef.current = null;
      setSession(null);
      setActiveUser(null);
      setProfileComplete(false);
      clearStoredAppPage();
      if (mounted) setLoading(false);
    };

    const hydrateProfile = async (nextSession: Session) => {
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
          if (mounted) setProfileComplete(Boolean(metadata.birthDate));
        } else if (mounted) {
          setProfileComplete(Boolean(existingSettings.birthDate));
        }
        await syncUserSettingsFromCloud();
      } catch (error) {
        console.error("No se pudieron migrar los datos locales a Supabase", error);
        if (mounted && getBirthDate()) setProfileComplete(true);
      }
    };

    const applySession = async (event: AuthSessionEvent, nextSession: Session | null) => {
      if (!mounted) return;

      if (!nextSession?.user) {
        clearSession();
        return;
      }

      const previousUserId = sessionRef.current?.user.id ?? null;
      const nextUserId = nextSession.user.id;
      const skipHydration = shouldSkipProfileHydration(event, previousUserId, nextUserId);

      sessionRef.current = nextSession;
      setSession(nextSession);
      setActiveUser(nextUserId);

      if (skipHydration) return;

      if (previousUserId && previousUserId !== nextUserId) {
        setProfileComplete(false);
      }

      await hydrateProfile(nextSession);
      if (mounted) setLoading(false);
    };

    void supabase.auth.getSession().then(({ data }) => applySession("BOOTSTRAP", data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((event: AuthChangeEvent, nextSession) => {
      window.setTimeout(() => {
        void applySession(event, nextSession);
      }, 0);
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
    profileComplete,
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
    async completeProfile(birthDate, phone) {
      const normalizedPhone = phone?.trim() || "";
      const { error } = await supabase.auth.updateUser({
        data: { birthDate, phone: normalizedPhone },
      });
      if (error) throw error;
      await saveUserSettings({
        baseCurrency: "USD",
        theme: "light",
        birthDate,
        phone: normalizedPhone,
      });
      setProfileComplete(true);
    },
    async signOut() {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      clearStoredAppPage();
    },
    async signInWithGoogle() {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (error) throw error;
    },
  }), [loading, profileComplete, session]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
