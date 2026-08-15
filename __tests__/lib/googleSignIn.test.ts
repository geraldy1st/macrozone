import { getNativeGoogleSignin } from "@/lib/googleSignIn";

jest.mock("@/utils/runtime", () => ({
  isExpoGo: () => true,
}));

describe("getNativeGoogleSignin", () => {
  it("does not load the native module inside Expo Go", () => {
    expect(getNativeGoogleSignin()).toBeNull();
  });
});
