import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  defaultMacroGoals,
  getMacroGoals,
  setMacroGoals,
} from "@/storage/goals";
import { scopedKey, setStorageScope } from "@/storage/scopedKey";

describe("macro goals storage", () => {
  beforeEach(async () => {
    setStorageScope("test-user");
    await AsyncStorage.clear();
  });

  it("returns default goals when nothing is stored", async () => {
    await expect(getMacroGoals()).resolves.toEqual(defaultMacroGoals);
  });

  it("persists custom goals", async () => {
    const customGoals = {
      calories: 2200,
      protein: 160,
      carbs: 220,
      fat: 70,
    };

    await setMacroGoals(customGoals);
    await expect(getMacroGoals()).resolves.toEqual(customGoals);
  });

  it("merges partial updates with defaults", async () => {
    await AsyncStorage.setItem(
      scopedKey("macroGoals"),
      JSON.stringify({ calories: 1800 }),
    );

    await expect(getMacroGoals()).resolves.toEqual({
      ...defaultMacroGoals,
      calories: 1800,
    });
  });
});