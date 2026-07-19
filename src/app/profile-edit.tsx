import { useTheme } from "@/contexts/ThemeContext";
import { useToast } from "@/contexts/ToastContext";
import { countries, getCountryByCode } from "@/data/countries";
import { useBottomContentPadding } from "@/hooks/useBottomContentPadding";
import { useThemedStyles } from "@/hooks/useThemedStyles";
import {
  MAX_BIO_LENGTH,
  MAX_NAME_LENGTH,
  MAX_SOCIAL_LINKS,
  formatSocialUrlLabel,
  normalizeSocialUsername,
  socialPlatforms,
  type SocialLink,
  type SocialPlatform,
} from "@/data/socialLinks";
import {
  defaultProfile,
  getUserProfile,
  setUserProfile,
  type GenderOption,
  type UserProfile,
} from "@/storage/profile";
import type { ThemeColors } from "@/styles/themes";
import { formatBirthDateDisplay, parseIsoDate, toIsoDate } from "@/utils/age";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker, {
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const genderOptions: GenderOption[] = [
  "male",
  "female",
  "other",
  "prefer_not_to_say",
];

const DEFAULT_BIRTH_DATE = new Date(1995, 0, 1);

export default function ProfileEditScreen() {
  const { t, i18n } = useTranslation();
  const { colors, isDark } = useTheme();
  const { showToast } = useToast();
  const styles = useThemedStyles(createStyles);
  const insets = useSafeAreaInsets();
  const bottomPadding = useBottomContentPadding(100, false);
  const scrollRef = useRef<ScrollView>(null);
  const [profile, setProfile] = useState<UserProfile>(defaultProfile);
  const [isSaving, setIsSaving] = useState(false);
  const [countryPickerVisible, setCountryPickerVisible] = useState(false);
  const [birthDatePickerVisible, setBirthDatePickerVisible] = useState(false);
  const [iosDraftDate, setIosDraftDate] = useState(DEFAULT_BIRTH_DATE);
  const [linkPlatformPickerVisible, setLinkPlatformPickerVisible] = useState(false);
  const [draftLinkUrl, setDraftLinkUrl] = useState("");
  const [draftLinkPlatform, setDraftLinkPlatform] = useState<SocialPlatform | null>(
    null,
  );
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useFocusEffect(
    useCallback(() => {
      getUserProfile().then(setProfile);
    }, []),
  );

  useEffect(() => {
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const showSub = Keyboard.addListener(showEvent, (event) => {
      setKeyboardHeight(event.endCoordinates.height);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const scrollToSocialInput = () => {
    setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 150);
  };

  const selectedCountry = getCountryByCode(profile.countryCode);
  const birthDateLabel = profile.birthDate
    ? formatBirthDateDisplay(profile.birthDate, i18n.language)
    : t("profile.selectBirthDate");

  const openBirthDatePicker = () => {
    const current = parseIsoDate(profile.birthDate) ?? DEFAULT_BIRTH_DATE;
    setIosDraftDate(current);
    setBirthDatePickerVisible(true);
  };

  const applyBirthDate = (date: Date) => {
    setProfile((current) => ({
      ...current,
      birthDate: toIsoDate(date),
    }));
  };

  const handleBirthDateChange = (event: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === "android") {
      setBirthDatePickerVisible(false);
      if (event.type === "set" && date) {
        applyBirthDate(date);
      }
      return;
    }

    if (date) {
      setIosDraftDate(date);
    }
  };

  const handlePickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]?.uri) {
      setProfile((current) => ({
        ...current,
        photoUri: result.assets[0].uri,
      }));
    }
  };

  const handleCountrySelect = (code: string, dialCode: string) => {
    setProfile((current) => ({
      ...current,
      countryCode: code,
      phoneDialCode: dialCode,
    }));
    setCountryPickerVisible(false);
  };

  const usedPlatforms = new Set(profile.socialLinks.map((link) => link.platform));
  const availablePlatforms = socialPlatforms.filter(
    (platform) => !usedPlatforms.has(platform.id),
  );

  const handleAddSocialLink = () => {
    if (!draftLinkPlatform) {
      return;
    }

    const username = normalizeSocialUsername(draftLinkPlatform, draftLinkUrl);
    if (!username) {
      showToast(t("profile.social.invalidUsername"), "error");
      return;
    }

    if (profile.socialLinks.length >= MAX_SOCIAL_LINKS) {
      showToast(t("profile.social.maxReached", { count: MAX_SOCIAL_LINKS }), "error");
      return;
    }

    const nextLink: SocialLink = {
      platform: draftLinkPlatform,
      url: username,
    };

    setProfile((current) => ({
      ...current,
      socialLinks: [...current.socialLinks, nextLink],
    }));
    setDraftLinkUrl("");
    setDraftLinkPlatform(null);
  };

  const handleRemoveSocialLink = (platform: SocialPlatform) => {
    setProfile((current) => ({
      ...current,
      socialLinks: current.socialLinks.filter((link) => link.platform !== platform),
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);

    try {
      const cleaned: UserProfile = {
        ...profile,
        name: profile.name.trim().slice(0, MAX_NAME_LENGTH),
        bio: profile.bio.trim().slice(0, MAX_BIO_LENGTH),
        socialLinks: profile.socialLinks.slice(0, MAX_SOCIAL_LINKS),
      };
      await setUserProfile(cleaned);
      showToast(t("profile.savedMessage"), "success");
      router.back();
    } catch {
      showToast(t("profile.saveErrorMessage"), "error");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.screen, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? insets.top : 0}
    >
      <ScrollView
        ref={scrollRef}
        style={styles.container}
        contentContainerStyle={{
          paddingBottom: bottomPadding + keyboardHeight * 0.35,
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        automaticallyAdjustKeyboardInsets
      >
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>
            {t("profile.editTitle")}
          </Text>
          <View style={styles.backButton} />
        </View>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <Text style={[styles.sectionLabel, { color: colors.primary }]}>
            {t("profile.personalInfo")}
          </Text>

          <TouchableOpacity style={styles.avatarButton} onPress={handlePickPhoto}>
            {profile.photoUri ? (
              <Image source={{ uri: profile.photoUri }} style={styles.avatar} contentFit="cover" />
            ) : (
              <View style={[styles.avatarPlaceholder, { backgroundColor: colors.surface }]}>
                <Ionicons name="person" size={42} color={colors.textSecondary} />
              </View>
            )}
            <View style={[styles.cameraBadge, { backgroundColor: colors.accent }]}>
              <Ionicons name="camera" size={14} color={colors.background} />
            </View>
          </TouchableOpacity>

          <View style={fieldStyles.field}>
            <View style={styles.labelRow}>
              <Text style={[fieldStyles.label, { color: colors.textSecondary }]}>
                {t("profile.name")}
              </Text>
              <Text style={[styles.counter, { color: colors.textSecondary }]}>
                {profile.name.length}/{MAX_NAME_LENGTH}
              </Text>
            </View>
            <TextInput
              style={[
                fieldStyles.input,
                {
                  backgroundColor: colors.surface,
                  color: colors.text,
                  borderColor: colors.cardBorder,
                },
              ]}
              value={profile.name}
              onChangeText={(name) =>
                setProfile((current) => ({
                  ...current,
                  name: name.slice(0, MAX_NAME_LENGTH),
                }))
              }
              maxLength={MAX_NAME_LENGTH}
              placeholderTextColor={colors.textSecondary}
              testID="profile-name-input"
            />
          </View>

          <View style={fieldStyles.field}>
            <View style={styles.labelRow}>
              <Text style={[fieldStyles.label, { color: colors.textSecondary }]}>
                {t("profile.bio")}
              </Text>
              <Text style={[styles.counter, { color: colors.textSecondary }]}>
                {profile.bio.length}/{MAX_BIO_LENGTH}
              </Text>
            </View>
            <TextInput
              style={[
                fieldStyles.input,
                styles.bioInput,
                {
                  backgroundColor: colors.surface,
                  color: colors.text,
                  borderColor: colors.cardBorder,
                },
              ]}
              value={profile.bio}
              onChangeText={(bio) =>
                setProfile((current) => ({
                  ...current,
                  bio: bio.slice(0, MAX_BIO_LENGTH),
                }))
              }
              maxLength={MAX_BIO_LENGTH}
              multiline
              textAlignVertical="top"
              placeholder={t("profile.bioPlaceholder")}
              placeholderTextColor={colors.textSecondary}
              testID="profile-bio-input"
            />
          </View>

          <View style={fieldStyles.field}>
            <Text style={[fieldStyles.label, { color: colors.textSecondary }]}>
              {t("profile.country")}
            </Text>
            <TouchableOpacity
              style={[
                fieldStyles.input,
                styles.pickerButton,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.cardBorder,
                },
              ]}
              onPress={() => setCountryPickerVisible(true)}
              testID="profile-country-picker"
            >
              <Text style={[styles.pickerText, { color: colors.text }]}>
                {selectedCountry
                  ? `${selectedCountry.flag} ${selectedCountry.name}`
                  : t("profile.selectCountry")}
              </Text>
              <Ionicons name="chevron-down" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={fieldStyles.field}>
            <Text style={[fieldStyles.label, { color: colors.textSecondary }]}>
              {t("profile.gender")}
            </Text>
            <View style={styles.genderRow}>
              {genderOptions.map((option) => {
                const isSelected = profile.gender === option;
                return (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.genderChip,
                      {
                        backgroundColor: isSelected ? colors.accent : colors.surface,
                        borderColor: isSelected ? colors.accent : colors.cardBorder,
                      },
                    ]}
                    onPress={() =>
                      setProfile((current) => ({ ...current, gender: option }))
                    }
                  >
                    <Text
                      style={[
                        styles.genderChipText,
                        { color: isSelected ? colors.background : colors.text },
                      ]}
                    >
                      {t(`profile.genderOptions.${option}`)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={fieldStyles.field}>
            <Text style={[fieldStyles.label, { color: colors.textSecondary }]}>
              {t("profile.phone")}
            </Text>
            <View style={styles.phoneRow}>
              <View
                style={[
                  styles.dialCodeBox,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.cardBorder,
                  },
                ]}
              >
                <Text style={[styles.dialCodeText, { color: colors.text }]}>
                  {selectedCountry?.flag} {profile.phoneDialCode}
                </Text>
              </View>
              <TextInput
                style={[
                  fieldStyles.input,
                  styles.phoneInput,
                  {
                    backgroundColor: colors.surface,
                    color: colors.text,
                    borderColor: colors.cardBorder,
                  },
                ]}
                value={profile.phoneNumber}
                onChangeText={(phoneNumber) =>
                  setProfile((current) => ({ ...current, phoneNumber }))
                }
                keyboardType="phone-pad"
                placeholderTextColor={colors.textSecondary}
                testID="profile-phone-input"
              />
            </View>
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionLabel, { color: colors.primary, marginBottom: 0 }]}>
              {t("profile.health")}
            </Text>
            <TouchableOpacity
              style={[
                styles.visibilityChip,
                {
                  backgroundColor: profile.showHealth ? colors.accent : colors.surface,
                  borderColor: profile.showHealth ? colors.accent : colors.cardBorder,
                },
              ]}
              onPress={() =>
                setProfile((current) => ({
                  ...current,
                  showHealth: !current.showHealth,
                }))
              }
              testID="profile-health-visibility-toggle"
            >
              <Ionicons
                name={profile.showHealth ? "eye-outline" : "eye-off-outline"}
                size={16}
                color={profile.showHealth ? colors.background : colors.textSecondary}
              />
              <Text
                style={[
                  styles.visibilityChipText,
                  {
                    color: profile.showHealth ? colors.background : colors.textSecondary,
                  },
                ]}
              >
                {profile.showHealth
                  ? t("profile.healthVisible")
                  : t("profile.healthHidden")}
              </Text>
            </TouchableOpacity>
          </View>
          <Text style={[styles.sectionHint, { color: colors.textSecondary }]}>
            {t("profile.healthVisibilityHint")}
          </Text>

          <View style={fieldStyles.field}>
            <Text style={[fieldStyles.label, { color: colors.textSecondary }]}>
              {t("profile.birthDate")}
            </Text>
            <TouchableOpacity
              style={[
                fieldStyles.input,
                styles.pickerButton,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.cardBorder,
                },
              ]}
              onPress={openBirthDatePicker}
              testID="profile-birthdate-picker"
            >
              <Text
                style={[
                  styles.pickerText,
                  {
                    color: profile.birthDate ? colors.text : colors.textSecondary,
                  },
                ]}
              >
                {birthDateLabel}
              </Text>
              <Ionicons name="calendar-outline" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ProfileField
            label={t("profile.height")}
            value={profile.height}
            onChangeText={(height) => setProfile((current) => ({ ...current, height }))}
            colors={colors}
            keyboardType="numeric"
            testID="profile-height-input"
          />
          <ProfileField
            label={t("profile.weight")}
            value={profile.weight}
            onChangeText={(weight) => setProfile((current) => ({ ...current, weight }))}
            colors={colors}
            keyboardType="numeric"
            testID="profile-weight-input"
          />
        </View>

        <View
          style={[
            styles.card,
            { backgroundColor: colors.card, borderColor: colors.cardBorder },
          ]}
        >
          <Text style={[styles.sectionLabel, { color: colors.primary }]}>
            {t("profile.social.title")}
          </Text>
          <Text style={[styles.sectionHint, { color: colors.textSecondary }]}>
            {t("profile.social.description", { count: MAX_SOCIAL_LINKS })}
          </Text>

          {profile.socialLinks.map((link) => {
            const platform = socialPlatforms.find((item) => item.id === link.platform);
            if (!platform) {
              return null;
            }

            return (
              <View
                key={link.platform}
                style={[
                  styles.socialEditRow,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.cardBorder,
                  },
                ]}
              >
                <Ionicons name={platform.icon} size={20} color={colors.accent} />
                <View style={styles.socialEditText}>
                  <Text style={[styles.socialEditLabel, { color: colors.text }]}>
                    {t(platform.labelKey)}
                  </Text>
                  <Text
                    style={[styles.socialEditUrl, { color: colors.textSecondary }]}
                    numberOfLines={1}
                  >
                    {formatSocialUrlLabel(link.url)}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => handleRemoveSocialLink(link.platform)}
                  testID={`remove-social-${link.platform}`}
                >
                  <Ionicons name="trash-outline" size={18} color={colors.alert} />
                </TouchableOpacity>
              </View>
            );
          })}

          {profile.socialLinks.length < MAX_SOCIAL_LINKS && availablePlatforms.length > 0 ? (
            <View style={styles.addLinkBlock}>
              <TouchableOpacity
                style={[
                  fieldStyles.input,
                  styles.pickerButton,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.cardBorder,
                  },
                ]}
                onPress={() => setLinkPlatformPickerVisible(true)}
                testID="profile-social-platform-picker"
              >
                <Text style={[styles.pickerText, { color: colors.text }]}>
                  {draftLinkPlatform
                    ? t(
                        socialPlatforms.find((p) => p.id === draftLinkPlatform)?.labelKey ??
                          "profile.social.choosePlatform",
                      )
                    : t("profile.social.choosePlatform")}
                </Text>
                <Ionicons name="chevron-down" size={18} color={colors.textSecondary} />
              </TouchableOpacity>

              <TextInput
                style={[
                  fieldStyles.input,
                  {
                    backgroundColor: colors.surface,
                    color: colors.text,
                    borderColor: colors.cardBorder,
                  },
                ]}
                value={draftLinkUrl}
                onChangeText={setDraftLinkUrl}
                onFocus={scrollToSocialInput}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="default"
                placeholder={
                  draftLinkPlatform
                    ? socialPlatforms.find((p) => p.id === draftLinkPlatform)?.placeholder
                    : t("profile.social.usernamePlaceholder")
                }
                placeholderTextColor={colors.textSecondary}
                testID="profile-social-url-input"
              />

              <TouchableOpacity
                style={[
                  styles.addLinkButton,
                  { backgroundColor: colors.accent },
                  (!draftLinkPlatform || !draftLinkUrl.trim()) && styles.addLinkButtonDisabled,
                ]}
                onPress={handleAddSocialLink}
                disabled={!draftLinkPlatform || !draftLinkUrl.trim()}
                testID="profile-social-add-btn"
              >
                <Text style={[styles.addLinkButtonText, { color: colors.background }]}>
                  {t("profile.social.add")}
                </Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </View>
      </ScrollView>

      <View
        style={[
          styles.footer,
          {
            backgroundColor: colors.background,
            borderTopColor: colors.cardBorder,
            paddingBottom: Math.max(insets.bottom, 12),
          },
        ]}
      >
        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: colors.accent }]}
          onPress={handleSave}
          disabled={isSaving}
          testID="profile-save-btn"
        >
          <Text style={[styles.saveButtonText, { color: colors.background }]}>
            {t("profile.save")}
          </Text>
        </TouchableOpacity>
      </View>

      {birthDatePickerVisible && Platform.OS === "android" ? (
        <DateTimePicker
          value={parseIsoDate(profile.birthDate) ?? DEFAULT_BIRTH_DATE}
          mode="date"
          display="calendar"
          maximumDate={new Date()}
          minimumDate={new Date(1920, 0, 1)}
          onChange={handleBirthDateChange}
        />
      ) : null}

      <Modal
        visible={birthDatePickerVisible && Platform.OS === "ios"}
        transparent
        animationType="slide"
        onRequestClose={() => setBirthDatePickerVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setBirthDatePickerVisible(false)}
        >
          <Pressable
            style={[styles.modalSheet, { backgroundColor: colors.card }]}
            onPress={(event) => event.stopPropagation()}
          >
            <View style={styles.datePickerHeader}>
              <TouchableOpacity onPress={() => setBirthDatePickerVisible(false)}>
                <Text style={[styles.datePickerAction, { color: colors.textSecondary }]}>
                  {t("mealItem.cancel")}
                </Text>
              </TouchableOpacity>
              <Text style={[styles.modalTitle, { color: colors.text, marginBottom: 0 }]}>
                {t("profile.birthDate")}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  applyBirthDate(iosDraftDate);
                  setBirthDatePickerVisible(false);
                }}
                testID="profile-birthdate-confirm"
              >
                <Text style={[styles.datePickerAction, { color: colors.accent }]}>
                  {t("common.ok")}
                </Text>
              </TouchableOpacity>
            </View>
            <DateTimePicker
              value={iosDraftDate}
              mode="date"
              display="spinner"
              maximumDate={new Date()}
              minimumDate={new Date(1920, 0, 1)}
              onChange={handleBirthDateChange}
              themeVariant={isDark ? "dark" : "light"}
              style={styles.iosDatePicker}
            />
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        visible={linkPlatformPickerVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setLinkPlatformPickerVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setLinkPlatformPickerVisible(false)}
        >
          <Pressable
            style={[styles.modalSheet, { backgroundColor: colors.card }]}
            onPress={(event) => event.stopPropagation()}
          >
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {t("profile.social.choosePlatform")}
            </Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              {availablePlatforms.map((platform) => (
                <TouchableOpacity
                  key={platform.id}
                  style={[
                    styles.countryRow,
                    draftLinkPlatform === platform.id && {
                      backgroundColor: colors.surface,
                    },
                  ]}
                  onPress={() => {
                    setDraftLinkPlatform(platform.id);
                    setLinkPlatformPickerVisible(false);
                  }}
                >
                  <View style={styles.platformRow}>
                    <Ionicons name={platform.icon} size={20} color={colors.accent} />
                    <Text style={[styles.countryRowText, { color: colors.text }]}>
                      {t(platform.labelKey)}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        visible={countryPickerVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setCountryPickerVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setCountryPickerVisible(false)}
        >
          <Pressable
            style={[styles.modalSheet, { backgroundColor: colors.card }]}
            onPress={(event) => event.stopPropagation()}
          >
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {t("profile.selectCountry")}
            </Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              {countries.map((country) => (
                <TouchableOpacity
                  key={country.code}
                  style={[
                    styles.countryRow,
                    profile.countryCode === country.code && {
                      backgroundColor: colors.surface,
                    },
                  ]}
                  onPress={() => handleCountrySelect(country.code, country.dialCode)}
                >
                  <Text style={[styles.countryRowText, { color: colors.text }]}>
                    {country.flag} {country.name} ({country.dialCode})
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </KeyboardAvoidingView>
  );
}

function ProfileField({
  label,
  value,
  onChangeText,
  colors,
  keyboardType = "default",
  testID,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  colors: ThemeColors;
  keyboardType?: "default" | "numeric" | "phone-pad";
  testID?: string;
}) {
  return (
    <View style={fieldStyles.field}>
      <Text style={[fieldStyles.label, { color: colors.textSecondary }]}>{label}</Text>
      <TextInput
        style={[
          fieldStyles.input,
          {
            backgroundColor: colors.surface,
            color: colors.text,
            borderColor: colors.cardBorder,
          },
        ]}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        placeholderTextColor={colors.textSecondary}
        testID={testID}
      />
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    screen: {
      flex: 1,
    },
    container: {
      flex: 1,
      paddingTop: 60,
      paddingHorizontal: 20,
    },
    footer: {
      paddingHorizontal: 20,
      paddingTop: 12,
      borderTopWidth: 1,
    },
    topBar: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 20,
    },
    backButton: {
      width: 40,
      height: 40,
      alignItems: "center",
      justifyContent: "center",
    },
    title: {
      fontSize: 24,
      fontWeight: "800",
      letterSpacing: -0.5,
    },
    card: {
      borderRadius: 18,
      borderWidth: 1,
      padding: 20,
      gap: 14,
      marginBottom: 16,
    },
    sectionLabel: {
      fontSize: 14,
      fontWeight: "700",
      textTransform: "uppercase",
      letterSpacing: 0.8,
    },
    sectionHeaderRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
    },
    visibilityChip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      borderWidth: 1,
      borderRadius: 999,
      paddingHorizontal: 10,
      paddingVertical: 6,
    },
    visibilityChipText: {
      fontSize: 12,
      fontWeight: "700",
    },
    sectionHint: {
      fontSize: 13,
      lineHeight: 18,
      marginTop: -6,
    },
    labelRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    counter: {
      fontSize: 12,
      fontWeight: "600",
    },
    bioInput: {
      minHeight: 100,
      textAlignVertical: "top",
    },
    socialEditRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      borderWidth: 1,
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 12,
    },
    socialEditText: {
      flex: 1,
      minWidth: 0,
      gap: 2,
    },
    socialEditLabel: {
      fontSize: 14,
      fontWeight: "700",
    },
    socialEditUrl: {
      fontSize: 12,
      fontWeight: "500",
    },
    addLinkBlock: {
      gap: 10,
      marginTop: 4,
    },
    addLinkButton: {
      padding: 14,
      borderRadius: 12,
      alignItems: "center",
    },
    addLinkButtonDisabled: {
      opacity: 0.5,
    },
    addLinkButtonText: {
      fontSize: 15,
      fontWeight: "700",
    },
    platformRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    avatarButton: {
      alignSelf: "center",
      marginBottom: 4,
    },
    avatar: {
      width: 110,
      height: 110,
      borderRadius: 55,
    },
    avatarPlaceholder: {
      width: 110,
      height: 110,
      borderRadius: 55,
      alignItems: "center",
      justifyContent: "center",
    },
    cameraBadge: {
      position: "absolute",
      right: 4,
      bottom: 4,
      width: 30,
      height: 30,
      borderRadius: 15,
      alignItems: "center",
      justifyContent: "center",
    },
    pickerButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    pickerText: {
      fontSize: 16,
      fontWeight: "600",
    },
    genderRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },
    genderChip: {
      borderWidth: 1,
      borderRadius: 999,
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    genderChipText: {
      fontSize: 13,
      fontWeight: "600",
    },
    phoneRow: {
      flexDirection: "row",
      gap: 10,
    },
    dialCodeBox: {
      borderWidth: 1,
      borderRadius: 10,
      paddingHorizontal: 12,
      justifyContent: "center",
      minWidth: 96,
    },
    dialCodeText: {
      fontSize: 15,
      fontWeight: "600",
    },
    phoneInput: {
      flex: 1,
    },
    saveButton: {
      padding: 16,
      borderRadius: 12,
      alignItems: "center",
      minHeight: 52,
      justifyContent: "center",
    },
    saveButtonText: {
      fontSize: 16,
      fontWeight: "700",
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.45)",
      justifyContent: "flex-end",
    },
    modalSheet: {
      maxHeight: "70%",
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      padding: 20,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: "700",
      marginBottom: 12,
    },
    countryRow: {
      paddingVertical: 14,
      paddingHorizontal: 8,
      borderRadius: 10,
    },
    countryRowText: {
      fontSize: 16,
      fontWeight: "500",
    },
    datePickerHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 8,
    },
    datePickerAction: {
      fontSize: 16,
      fontWeight: "600",
      minWidth: 64,
    },
    iosDatePicker: {
      alignSelf: "center",
    },
  });
}

const fieldStyles = StyleSheet.create({
  field: {
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  input: {
    padding: 14,
    borderRadius: 10,
    fontSize: 16,
    fontWeight: "600",
    borderWidth: 1,
  },
});