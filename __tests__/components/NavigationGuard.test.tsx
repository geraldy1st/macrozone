import NavigationGuard from "@/components/NavigationGuard";
import { getOnboardingState } from "@/storage/onboarding";
import { render, waitFor } from "@testing-library/react-native";

const mockReplace = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => ({ replace: mockReplace }),
  useSegments: () => ["welcome"],
}));

jest.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    user: null,
    isLoading: false,
  }),
}));

jest.mock("@/storage/onboarding", () => ({
  getOnboardingState: jest.fn(),
}));

const mockedGetOnboardingState = getOnboardingState as jest.MockedFunction<
  typeof getOnboardingState
>;

describe("NavigationGuard", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("redirects guests from welcome to home tabs", async () => {
    mockedGetOnboardingState.mockResolvedValue("guest");

    render(<NavigationGuard />);

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/(tabs)");
    });
  });

  it("keeps unauthenticated users on welcome when onboarding is pending", async () => {
    mockedGetOnboardingState.mockResolvedValue("pending");

    render(<NavigationGuard />);

    await waitFor(() => {
      expect(mockedGetOnboardingState).toHaveBeenCalled();
    });

    expect(mockReplace).not.toHaveBeenCalled();
  });
});