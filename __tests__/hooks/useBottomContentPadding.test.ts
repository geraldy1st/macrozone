import { TAB_BAR_HEIGHT } from "@/hooks/useBottomContentPadding";

describe("useBottomContentPadding constants", () => {
  it("exports a stable tab bar height used by layout", () => {
    expect(TAB_BAR_HEIGHT).toBe(56);
  });
});
