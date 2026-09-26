import HomeScreen from "@/app/(tabs)/index";
import { fireEvent, render, screen } from "@testing-library/react-native";

const mockPush = jest.fn();

jest.mock("expo-router", () => {
  const { useEffect } = jest.requireActual("react");
  return {
    router: { push: (...args: unknown[]) => mockPush(...args) },
    useFocusEffect: (callback: () => void | (() => void)) => {
      useEffect(() => callback(), [callback]);
    },
  };
});

jest.mock("@/contexts/ThemeContext", () => {
  const colors = new Proxy({}, { get: () => "#123456" });
  return {
    useTheme: () => ({
      colors,
      mode: "dark",
      isDark: true,
      setMode: jest.fn(),
      isReady: true,
    }),
  };
});

jest.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: null, isLoading: false }),
}));

jest.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: "fr" } }),
}));

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));

jest.mock("@/storage/meals", () => ({
  getMeals: jest.fn(async () => []),
}));
jest.mock("@/storage/celebration", () => ({
  consumePendingCelebration: jest.fn(async () => false),
}));
jest.mock("@/storage/profile", () => ({
  getUserProfile: jest.fn(async () => ({ name: "" })),
}));

// Child components are irrelevant to the chip under test.
jest.mock("@/components/AppLogo", () => () => null);
jest.mock("@/components/CopyButton", () => () => null);
jest.mock("@/components/HomeHeader", () => () => null);
jest.mock("@/components/MacroGrid", () => () => null);
jest.mock("@/components/MotivationOverlay", () => () => null);
jest.mock("@/components/RecentMeals", () => () => null);
jest.mock("@/components/ReminderToggle", () => () => null);
jest.mock("@/components/ShareButton", () => () => null);
jest.mock("@/components/TrackingModeSwitch", () => () => null);

describe("Journal screen History chip", () => {
  beforeEach(() => {
    mockPush.mockClear();
  });

  it("renders journal-history-btn exactly once and no all-meals-tab", async () => {
    await render(<HomeScreen />);

    expect(screen.getAllByTestId("journal-history-btn")).toHaveLength(1);
    expect(screen.queryAllByTestId("all-meals-tab")).toHaveLength(0);
  });

  it("opens the meals route when the chip is pressed", async () => {
    await render(<HomeScreen />);

    await fireEvent.press(screen.getByTestId("journal-history-btn"));

    expect(mockPush).toHaveBeenCalledWith("/(tabs)/meals");
  });
});
