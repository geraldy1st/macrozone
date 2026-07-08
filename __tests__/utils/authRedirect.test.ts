import {
  AUTH_CALLBACK_PATH,
  AUTH_REDIRECT_SCHEME,
  NATIVE_AUTH_REDIRECT_URI,
  getAuthRedirectUri,
} from "@/utils/authRedirect";
import { Platform } from "react-native";

describe("getAuthRedirectUri", () => {
  const originalOS = Platform.OS;

  afterEach(() => {
    Object.defineProperty(Platform, "OS", {
      configurable: true,
      value: originalOS,
    });
  });

  it("uses the native deep link on mobile platforms", () => {
    Object.defineProperty(Platform, "OS", {
      configurable: true,
      value: "android",
    });

    expect(getAuthRedirectUri()).toBe(NATIVE_AUTH_REDIRECT_URI);
    expect(NATIVE_AUTH_REDIRECT_URI).toBe(
      `${AUTH_REDIRECT_SCHEME}://${AUTH_CALLBACK_PATH}`,
    );
  });
});