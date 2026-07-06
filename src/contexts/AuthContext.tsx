import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { setStorageScope } from "@/storage/scopedKey";
import { getAuthRedirectUri } from "@/utils/authRedirect";
import { createSessionFromUrl } from "@/utils/authSession";
import type { Session, User } from "@supabase/supabase-js";
import * as WebBrowser from "expo-web-browser";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

WebBrowser.maybeCompleteAuthSession();

type OAuthProvider = "google" | "facebook";

export type SignUpResult = {
  email: string;
  needsEmailConfirmation: boolean;
};

type AuthContextValue = {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isConfigured: boolean;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<SignUpResult>;
  signInWithOAuth: (provider: OAuthProvider) => Promise<void>;
  resendConfirmationEmail: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function applyStorageScope(user: User | null) {
  setStorageScope(user?.id ?? null);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(isSupabaseConfigured);

  useEffect(() => {
    if (!supabase) {
      setIsLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      applyStorageScope(data.session?.user ?? null);
      setIsLoading(false);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, nextSession) => {
        setSession(nextSession);
        setUser(nextSession?.user ?? null);
        applyStorageScope(nextSession?.user ?? null);
      },
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    if (!supabase) {
      throw new Error("AUTH_NOT_CONFIGURED");
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      throw error;
    }
  }, []);

  const signUpWithEmail = useCallback(async (email: string, password: string) => {
    if (!supabase) {
      throw new Error("AUTH_NOT_CONFIGURED");
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: getAuthRedirectUri(),
      },
    });

    if (error) {
      throw error;
    }

    return {
      email,
      needsEmailConfirmation: !data.session && Boolean(data.user),
    };
  }, []);

  const resendConfirmationEmail = useCallback(async (email: string) => {
    if (!supabase) {
      throw new Error("AUTH_NOT_CONFIGURED");
    }

    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: {
        emailRedirectTo: getAuthRedirectUri(),
      },
    });

    if (error) {
      throw error;
    }
  }, []);

  const signInWithOAuth = useCallback(async (provider: OAuthProvider) => {
    if (!supabase) {
      throw new Error("AUTH_NOT_CONFIGURED");
    }

    const redirectTo = getAuthRedirectUri();

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo,
        skipBrowserRedirect: true,
      },
    });

    if (error) {
      throw error;
    }

    if (!data.url) {
      throw new Error("OAUTH_URL_MISSING");
    }

    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);

    if (result.type !== "success") {
      throw new Error("OAUTH_CANCELLED");
    }

    const nextSession = await createSessionFromUrl(result.url);

    if (!nextSession) {
      throw new Error("OAUTH_SESSION_MISSING");
    }
  }, []);

  const signOut = useCallback(async () => {
    if (!supabase) {
      return;
    }

    const { error } = await supabase.auth.signOut();
    if (error) {
      throw error;
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      session,
      isLoading,
      isConfigured: isSupabaseConfigured,
      signInWithEmail,
      signUpWithEmail,
      signInWithOAuth,
      resendConfirmationEmail,
      signOut,
    }),
    [
      user,
      session,
      isLoading,
      signInWithEmail,
      signUpWithEmail,
      signInWithOAuth,
      resendConfirmationEmail,
      signOut,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}