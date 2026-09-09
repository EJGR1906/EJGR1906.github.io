import { createContext, type Context } from "react";
import type { Session, User } from "@supabase/supabase-js";

export interface AuthContextValue {
    user: User | null;
    session: Session | null;
    loading: boolean;
    configured: boolean;
    signIn: (email: string, password: string) => Promise<void>;
    signUp: (email: string, password: string) => Promise<{ needsConfirmation: boolean }>;
    signOut: () => Promise<void>;
}

export const AuthContext: Context<AuthContextValue | undefined> = createContext<AuthContextValue | undefined>(undefined);
