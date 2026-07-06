import CopyButton from "@/components/CopyButton";

jest.mock("@/contexts/ThemeContext", () => ({
  useTheme: () => ({
    colors: {
      accent: "#ff6b35",
      background: "#0f0f1a",
      text: "#ffffff",
    },
    mode: "dark",
    isDark: true,
    setMode: jest.fn(),
    isReady: true,
  }),
}));

jest.mock("@/contexts/ToastContext", () => ({
  useToast: () => ({
    showToast: jest.fn(),
  }),
}));

describe("CopyButton module", () => {
  it("loads without referencing undefined theme colors at module scope", () => {
    expect(CopyButton).toBeDefined();
  });
});