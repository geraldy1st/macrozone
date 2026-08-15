import { isExpoGo } from "@/utils/runtime";

jest.mock("expo-constants", () => ({
  appOwnership: "expo",
  executionEnvironment: "storeClient",
}));

describe("isExpoGo", () => {
  it("detects Expo Go via appOwnership / executionEnvironment", () => {
    expect(isExpoGo()).toBe(true);
  });
});
