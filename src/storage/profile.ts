import { scopedKey } from "@/storage/scopedKey";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type UserProfile = {
  name: string;
  age: string;
  height: string;
  weight: string;
  photoUri?: string;
};

export const defaultProfile: UserProfile = {
  name: "",
  age: "",
  height: "",
  weight: "",
};

const PROFILE_KEY = "userProfile";

function getProfileKey() {
  return scopedKey(PROFILE_KEY);
}

export async function getUserProfile(): Promise<UserProfile> {
  const data = await AsyncStorage.getItem(getProfileKey());
  return data ? { ...defaultProfile, ...JSON.parse(data) } : defaultProfile;
}

export async function setUserProfile(profile: UserProfile): Promise<void> {
  await AsyncStorage.setItem(getProfileKey(), JSON.stringify(profile));
}