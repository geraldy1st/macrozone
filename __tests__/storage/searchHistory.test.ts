import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  addSearchHistory,
  clearSearchHistory,
  getSearchHistory,
  removeSearchHistoryItem,
} from "@/storage/searchHistory";

jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);

jest.mock("@/storage/scopedKey", () => ({
  scopedKey: (key: string) => `test:${key}`,
}));

describe("searchHistory", () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it("keeps the latest 5 unique queries", async () => {
    await addSearchHistory("alpha");
    await addSearchHistory("beta");
    await addSearchHistory("gamma");
    await addSearchHistory("delta");
    await addSearchHistory("epsilon");
    await addSearchHistory("zeta");
    await addSearchHistory("beta");

    const history = await getSearchHistory();
    expect(history).toEqual(["beta", "zeta", "epsilon", "delta", "gamma"]);
  });

  it("removes a single item", async () => {
    await addSearchHistory("one");
    await addSearchHistory("two");
    const next = await removeSearchHistoryItem("one");
    expect(next).toEqual(["two"]);
  });

  it("clears history", async () => {
    await addSearchHistory("keep");
    await clearSearchHistory();
    expect(await getSearchHistory()).toEqual([]);
  });
});
