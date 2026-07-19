import { defaultCountryCode } from "@/data/countries";
import type { SocialLink } from "@/data/socialLinks";
import { scopedKey } from "@/storage/scopedKey";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type GenderOption = "male" | "female" | "other" | "prefer_not_to_say" | "";

export type UserProfile = {
  name: string;
  bio: string;
  /** ISO date YYYY-MM-DD */
  birthDate: string;
  height: string;
  weight: string;
  photoUri?: string;
  countryCode: string;
  gender: GenderOption;
  phoneDialCode: string;
  phoneNumber: string;
  socialLinks: SocialLink[];
  /** When false, Health section is hidden on the Profile screen. */
  showHealth: boolean;
};

export const defaultProfile: UserProfile = {
  name: "",
  bio: "",
  birthDate: "",
  height: "",
  weight: "",
  countryCode: defaultCountryCode,
  gender: "",
  phoneDialCode: "+33",
  phoneNumber: "",
  socialLinks: [],
  showHealth: true,
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
    bio: parsed.bio ?? "",
    birthDate: parsed.birthDate ?? "",
    socialLinks: Array.isArray(parsed.socialLinks) ? parsed.socialLinks : [],
    showHealth: parsed.showHealth !== false,
  };
}

export async function setUserProfile(profile: UserProfile): Promise<void> {
  await AsyncStorage.setItem(getProfileKey(), JSON.stringify(profile));
}
