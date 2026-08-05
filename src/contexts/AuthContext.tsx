import { GOOGLE_WEB_CLIENT_ID } from "@/constants/googleAuth";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { touchLastSeen } from "@/services/community";
import { setStorageScope } from "@/storage/scopedKey";
import { getAuthRedirectUri } from "@/utils/authRedirect";
import { createSessionFromUrl } from "@/utils/authSession";
import { deleteUserAccount } from "@/utils/deleteAccount";
import {
  isValidEmail,
  normalizeEmail,
  userHasEmailPasswordAuth,
} from "@/utils/email";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import type { Session, User } from "@supabase/supabase-js";
import * as WebBrowser from "expo-web-browser";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Platform } from "react-native";

/** How often to refresh last_seen_at while the app is open. */
const LAST_SEEN_INTERVAL_MS = 2 * 60 * 1000;

WebBrowser.maybeCompleteAuthSession();

export type OAuthProvider = "google";

export type SignUpResult = {
  email: string;
  sessionCreated: boolean;
};

type AuthContextValue = {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isConfigured: boolean;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<SignUpResult>;
  signInWithOAuth: (provider: OAuthProvider) => Promise<void>;
  /** Native Google Sign-In on iOS/Android; browser OAuth on web. */
  signInWithGoogle: () => Promise<void>;
  resendConfirmationEmail: (email: string) => Promise<void>;
  resetPasswordForEmail: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  changePassword: (
    currentPassword: string,
    newPassword: string,
  ) => Promise<void>;
  /** Secure email update (re-auth with password). Google-only accounts cannot use this. */
  changeEmail: (newEmail: string, currentPassword: string) => Promise<void>;
  canChangeEmailWithPassword: boolean;
  deleteAccount: () => Promise<void>;
  signOut: () => Promise<void>;
};

function isGoogleSignInCancelled(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }

  const code =
    "code" in error && typeof (error as { code: unknown }).code === "string"
      ? (error as { code: string }).code
      : "";
  const message =
    error instanceof Error
      ? error.message.toLowerCase()
      : String(
          "message" in error ? (error as { message: unknown }).message : "",
        ).toLowerCase();

  return (
    code === "SIGN_IN_CANCELLED" ||
    code === "12501" ||
    code === "ERR_REQUEST_CANCELED" ||
    message.includes("cancel") ||
    message.includes("cancelled")
  );
}

async function signOutGoogleSafely() {
  if (Platform.OS === "web") {
    return;
  }

  try {
    if (GoogleSignin.hasPreviousSignIn()) {
      await GoogleSignin.signOut();
    }
  } catch {
    // Best-effort; Supabase session is the source of truth for the app.
  }
}

const AuthContext = createContext<AuthContextValue | null>(null);

function applyStorageScope(user: User | null) {
  setStorageScope(user?.id ?? null);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(isSupabaseConfigured);
  const googleConfiguredRef = useRef(false);

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

  useEffect(() => {
    if (Platform.OS === "web" || !GOOGLE_WEB_CLIENT_ID || googleConfiguredRef.current) {
      return;
    }

    try {
      GoogleSignin.configure({
        webClientId: GOOGLE_WEB_CLIENT_ID,
        offlineAccess: false,
      });
      googleConfiguredRef.current = true;
    } catch {
      // Native module missing (e.g. Expo Go) — signInWithGoogle will surface a clear error.
    }
  }, []);

  // Pseudo-online presence via last_seen_at (not Realtime)
  useEffect(() => {
    if (!user?.id || !isSupabaseConfigured) {
      return;
    }

    void touchLastSeen(user.id);
    const interval = setInterval(() => {
      void touchLastSeen(user.id);
    }, LAST_SEEN_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [user?.id]);

  const signInWithEmail = useCallback(
    async (email: string, password: string) => {
      if (!supabase) {
        throw new Error("AUTH_NOT_CONFIGURED");
      }

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        throw error;
      }
    },
    [],
  );

  const signUpWithEmail = useCallback(
    async (email: string, password: string) => {
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

      if (data.user && data.user.identities?.length === 0) {
        throw new Error("EMAIL_ALREADY_REGISTERED");
      }

      return {
        email,
        sessionCreated: Boolean(data.session),
      };
    },
    [],
  );

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

  const resetPasswordForEmail = useCallback(async (email: string) => {
    if (!supabase) {
      throw new Error("AUTH_NOT_CONFIGURED");
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: getAuthRedirectUri(),
    });

    if (error) {
      throw error;
    }
  }, []);

  const updatePassword = useCallback(async (password: string) => {
    if (!supabase) {
      throw new Error("AUTH_NOT_CONFIGURED");
    }

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      throw error;
    }
  }, []);

  const reauthenticate = useCallback(
    async (password: string) => {
      if (!supabase || !user?.email) {
        throw new Error("AUTH_NOT_CONFIGURED");
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: user.email,
        password,
      });

      if (error) {
        throw error;
      }
    },
    [user?.email],
  );

  const changePassword = useCallback(
    async (currentPassword: string, newPassword: string) => {
      await reauthenticate(currentPassword);
      await updatePassword(newPassword);
    },
    [reauthenticate, updatePassword],
  );

  const changeEmail = useCallback(
    async (newEmail: string, currentPassword: string) => {
      if (!supabase || !user?.email) {
        throw new Error("AUTH_NOT_CONFIGURED");
      }

      if (!userHasEmailPasswordAuth(user)) {
        throw new Error("EMAIL_CHANGE_OAUTH_ONLY");
      }

      const normalized = normalizeEmail(newEmail);
      if (!isValidEmail(normalized)) {
        throw new Error("EMAIL_INVALID");
      }

      if (normalized === normalizeEmail(user.email)) {
        throw new Error("EMAIL_UNCHANGED");
      }

      if (!currentPassword.trim()) {
        throw new Error("EMAIL_PASSWORD_REQUIRED");
      }

      await reauthenticate(currentPassword);

      const { error } = await supabase.auth.updateUser(
        { email: normalized },
        { emailRedirectTo: getAuthRedirectUri() },
      );

      if (error) {
        throw error;
      }
    },
    [reauthenticate, user],
  );

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

    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo, {
      showInRecents: true,
    });

    if (result.type !== "success") {
      throw new Error("OAUTH_CANCELLED");
    }

    const nextSession = await createSessionFromUrl(result.url);

    if (!nextSession) {
      throw new Error("OAUTH_SESSION_MISSING");
    }
  }, []);

  const signInWithGoogle = useCallback(async () => {
    if (!supabase) {
      throw new Error("AUTH_NOT_CONFIGURED");
    }

    // Native module is not available on web — reuse browser OAuth.
    if (Platform.OS === "web") {
      await signInWithOAuth("google");
      return;
    }

    if (!GOOGLE_WEB_CLIENT_ID) {
      throw new Error("GOOGLE_WEB_CLIENT_ID_MISSING");
    }

    try {
      if (!googleConfiguredRef.current) {
        GoogleSignin.configure({
          webClientId: GOOGLE_WEB_CLIENT_ID,
          offlineAccess: false,
        });
        googleConfiguredRef.current = true;
      }

      if (Platform.OS === "android") {
        await GoogleSignin.hasPlayServices({
          showPlayServicesUpdateDialog: true,
        });
      }

      const result = await GoogleSignin.signIn();

      if (result.type !== "success") {
        throw new Error("OAUTH_CANCELLED");
      }

      let idToken = result.data.idToken;

      // Some Android builds return null idToken on the first payload — getTokens() recovers it.
      if (!idToken) {
        const tokens = await GoogleSignin.getTokens();
        idToken = tokens.idToken;
      }

      if (!idToken) {
        throw new Error("OAUTH_SESSION_MISSING");
      }

      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: "google",
        token: idToken,
      });

      if (error) {
        throw error;
      }

      if (!data.session) {
        throw new Error("OAUTH_SESSION_MISSING");
      }
    } catch (error) {
      if (error instanceof Error && error.message === "OAUTH_CANCELLED") {
        throw error;
      }

      if (isGoogleSignInCancelled(error)) {
        throw new Error("OAUTH_CANCELLED");
      }

      throw error;
    }
  }, [signInWithOAuth]);

  const deleteAccount = useCallback(async () => {
    if (!supabase || !session?.access_token) {
      throw new Error("AUTH_NOT_CONFIGURED");
    }

    await deleteUserAccount(session.access_token);
    await signOutGoogleSafely();
    await supabase.auth.signOut();
  }, [session?.access_token]);

  const signOut = useCallback(async () => {
    if (!supabase) {
      return;
    }

    await signOutGoogleSafely();
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw error;
    }
  }, []);

  const canChangeEmailWithPassword = userHasEmailPasswordAuth(user);

  const value = useMemo(
    () => ({
      user,
      session,
      isLoading,
      isConfigured: isSupabaseConfigured,
      signInWithEmail,
      signUpWithEmail,
      signInWithOAuth,
      signInWithGoogle,
      resendConfirmationEmail,
      resetPasswordForEmail,
      updatePassword,
      changePassword,
      changeEmail,
      canChangeEmailWithPassword,
      deleteAccount,
      signOut,
    }),
    [
      user,
      session,
      isLoading,
      signInWithEmail,
      signUpWithEmail,
      signInWithOAuth,
      signInWithGoogle,
      resendConfirmationEmail,
      resetPasswordForEmail,
      updatePassword,
      changePassword,
      changeEmail,
      canChangeEmailWithPassword,
      deleteAccount,
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
