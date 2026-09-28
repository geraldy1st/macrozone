import MainTabBar from "@/components/MainTabBar";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { fireEvent, render, screen } from "@testing-library/react-native";

jest.mock("@/contexts/ThemeContext", () => ({
  useTheme: () => ({
    colors: {
      primary: "#00c2a8",
      textSecondary: "#8888aa",
      background: "#0f0f1a",
      cardBorder: "#222233",
      accent: "#ff6b35",
    },
    mode: "dark",
    isDark: true,
    setMode: jest.fn(),
    isReady: true,
  }),
}));

jest.mock("@/components/TabProfileIcon", () => {
  const { View } = jest.requireActual("react-native");
  return function MockTabProfileIcon() {
    return <View testID="mock-tab-profile-icon" />;
  };
});

jest.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));

const ROUTE_NAMES = ["index", "add-meals", "community", "profile", "meals"];
const TAB_ORDER = [
  "home-tab",
  "all-meals-tab",
  "add-meals-tab",
  "community-tab",
  "profile-tab",
];

function buildProps(currentRoute: string) {
  const routes = ROUTE_NAMES.map((name) => ({ key: `${name}-key`, name }));
  const emit = jest.fn(() => ({ defaultPrevented: false }));
  const navigate = jest.fn();
  const props = {
    state: {
      index: ROUTE_NAMES.indexOf(currentRoute),
      routes,
      key: "tabs-key",
      routeNames: ROUTE_NAMES,
      type: "tab",
      stale: false,
      history: [],
      preloadedRouteKeys: [],
    },
    navigation: { emit, navigate },
    descriptors: {},
    insets: { top: 0, right: 0, bottom: 0, left: 0 },
  } as unknown as BottomTabBarProps;
  return { props, emit, navigate };
}

function selectedOf(testID: string) {
  return screen.getByTestId(testID).props.accessibilityState?.selected;
}

describe("MainTabBar", () => {
  it("renders the tabs in visual order with History between Journal and Add", async () => {
    const { props } = buildProps("index");
    await render(<MainTabBar {...props} />);

    const ids = screen
      .getAllByTestId(/^(home|all-meals|add-meals|community|profile)-tab$/)
      .map((node) => node.props.testID as string);

    expect(ids).toEqual(TAB_ORDER);
  });

  it("renders exactly one all-meals-tab with the translated History label", async () => {
    const { props } = buildProps("index");
    await render(<MainTabBar {...props} />);

    expect(screen.getAllByTestId("all-meals-tab")).toHaveLength(1);
    const tab = screen.getByTestId("all-meals-tab");
    expect(tab.props.accessibilityRole).toBe("button");
    expect(tab.props.accessibilityLabel).toBe("tabs.allMeals");
    expect(screen.getByText("tabs.allMeals")).toBeTruthy();
  });

  it("emits tabPress and navigates to meals when History is pressed", async () => {
    const { props, emit, navigate } = buildProps("index");
    await render(<MainTabBar {...props} />);

    await fireEvent.press(screen.getByTestId("all-meals-tab"));

    expect(emit).toHaveBeenCalledWith({
      type: "tabPress",
      target: "meals-key",
      canPreventDefault: true,
    });
    expect(navigate).toHaveBeenCalledWith("meals");
  });

  it("does not navigate when the tabPress event is prevented", async () => {
    const { props, emit, navigate } = buildProps("index");
    emit.mockReturnValue({ defaultPrevented: true });
    await render(<MainTabBar {...props} />);

    await fireEvent.press(screen.getByTestId("all-meals-tab"));

    expect(emit).toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();
  });

  it("marks only History as selected when the meals route is focused", async () => {
    const { props } = buildProps("meals");
    await render(<MainTabBar {...props} />);

    expect(selectedOf("all-meals-tab")).toBe(true);
    expect(selectedOf("home-tab")).toBe(false);
    expect(selectedOf("community-tab")).toBe(false);
    expect(selectedOf("profile-tab")).toBe(false);
  });

  it("marks only Journal as selected when the index route is focused", async () => {
    const { props } = buildProps("index");
    await render(<MainTabBar {...props} />);

    expect(selectedOf("home-tab")).toBe(true);
    expect(selectedOf("all-meals-tab")).toBe(false);
  });
});
