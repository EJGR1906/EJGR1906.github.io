import { createContext, type Context } from "react";
import type { Session, User } from "@supabase/supabase-js";

export interface AuthContextValue {
    user: User | null;
    session: Session | null;
    loading: boolean;
    configured: boolean;
    signIn: (email: string, password: string) => Promise<void>;
    signUp: (email: string, password: string, metadata: { birthDate: string; phone?: string }) => Promise<{ needsConfirmation: boolean }>;
    resetPassword: (email: string) => Promise<void>;
    updatePassword: (password: string) => Promise<void>;
    signOut: () => Promise<void>;
    signInWithGoogle: () => Promise<void>;
}

export const AuthContext: Context<AuthContextValue | undefined> = createContext<AuthContextValue | undefined>(undefined);
