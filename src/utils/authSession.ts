import { supabase } from "@/lib/supabase";
import type { Session } from "@supabase/supabase-js";
import * as QueryParams from "expo-auth-session/build/QueryParams";

type EmailOtpType =
  | "signup"
  | "email"
  | "recovery"
  | "invite"
  | "email_change"
  | "magiclink";

function isEmailOtpType(value: string): value is EmailOtpType {
  return [
    "signup",
    "email",
    "recovery",
    "invite",
    "email_change",
    "magiclink",
  ].includes(value);
}

export async function createSessionFromUrl(url: string): Promise<Session | null> {
  if (!supabase) {
    throw new Error("Supabase is not configured");
  }

  const { params, errorCode } = QueryParams.getQueryParams(url);

  if (errorCode) {
    throw new Error(errorCode);
  }

  if (params.code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(
      params.code,
    );

    if (error) {
      throw error;
    }

    return data.session;
  }

  if (params.token_hash && params.type && isEmailOtpType(params.type)) {
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash: params.token_hash,
      type: params.type,
    });

    if (error) {
      throw error;
    }

    return data.session;
  }

  const accessToken = params.access_token;
  const refreshToken = params.refresh_token;

  if (!accessToken) {
    return null;
  }

  const { data, error } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken ?? "",
  });

  if (error) {
    throw error;
  }

  return data.session;
}