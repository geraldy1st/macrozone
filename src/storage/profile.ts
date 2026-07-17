import { defaultCountryCode } from "@/data/countries";
import { scopedKey } from "@/storage/scopedKey";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type GenderOption = "male" | "female" | "other" | "prefer_not_to_say" | "";

export type UserProfile = {
  name: string;
  /** ISO date YYYY-MM-DD */
  birthDate: string;
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
  birthDate: "",
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

  const parsed = JSON.parse(data) as Partial<UserProfile> & { age?: string };

  return {
    ...defaultProfile,
    ...parsed,
    birthDate: parsed.birthDate ?? "",
  };
}

export async function setUserProfile(profile: UserProfile): Promise<void> {
  await AsyncStorage.setItem(getProfileKey(), JSON.stringify(profile));
}
