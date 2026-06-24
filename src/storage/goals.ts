import AsyncStorage from "@react-native-async-storage/async-storage";

export type MacroGoals = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

export const defaultMacroGoals: MacroGoals = {
  calories: 2000,
  protein: 150,
  carbs: 250,
  fat: 65,
};

const GOALS_KEY = "macroGoals";

export const getMacroGoals = async (): Promise<MacroGoals> => {
  const data = await AsyncStorage.getItem(GOALS_KEY);
  return data ? { ...defaultMacroGoals, ...JSON.parse(data) } : defaultMacroGoals;
};

export const setMacroGoals = async (goals: MacroGoals): Promise<void> => {
  await AsyncStorage.setItem(GOALS_KEY, JSON.stringify(goals));
};