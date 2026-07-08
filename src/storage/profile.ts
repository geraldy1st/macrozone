import { defaultCountryCode } from "@/data/countries";
import { scopedKey } from "@/storage/scopedKey";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type GenderOption = "male" | "female" | "other" | "prefer_not_to_say" | "";

export type UserProfile = {
  name: string;
  age: string;
  height: string;
  weight: string;
  photoUri?: string;
  countryCode: string;
  gender: GenderOption;
  phoneDialCode: string;
  phoneNumber: string;
};

export const defaultProfile: UserProfile = {
  name: "",
  age: "",
  height: "",
  weight: "",
  countryCode: defaultCountryCode,
  gender: "",
  phoneDialCode: "+33",
  phoneNumber: "",
};

const PROFILE_KEY = "userProfile";

function getProfileKey() {
  return scopedKey(PROFILE_KEY);
}

export async function getUserProfile(): Promise<UserProfile> {
  const data = await AsyncStorage.getItem(getProfileKey());

  if (!data) {
    return defaultProfile;
  }

  return { ...defaultProfile, ...JSON.parse(data) };
}

export async function setUserProfile(profile: UserProfile): Promise<void> {
  await AsyncStorage.setItem(getProfileKey(), JSON.stringify(profile));
}