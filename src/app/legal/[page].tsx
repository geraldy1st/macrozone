import { LEGAL_PAGES, type LegalPageId } from "@/data/legalContent";
import { useTheme } from "@/contexts/ThemeContext";
import { useBottomContentPadding } from "@/hooks/useBottomContentPadding";
import { useThemedStyles } from "@/hooks/useThemedStyles";
import type { ThemeColors } from "@/styles/themes";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

function isLegalPageId(value: string | undefined): value is LegalPageId {
  return value === "terms" || value === "privacy" || value === "acknowledgements";
}

export default function LegalPageScreen() {
  const { page } = useLocalSearchParams<{ page: string }>();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const bottomPadding = useBottomContentPadding(24, false);

  const pageId = isLegalPageId(page) ? page : null;
  const content = pageId ? LEGAL_PAGES[pageId] : null;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          testID="legal-back-btn"
        >
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
          {content ? t(content.titleKey) : t("legal.notFoundTitle")}
        </Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: bottomPadding }}
        showsVerticalScrollIndicator={false}
      >
        {!content ? (
          <Text style={[styles.body, { color: colors.textSecondary }]}>
            {t("legal.notFoundMessage")}
          </Text>
        ) : (
          <>
            <Text style={[styles.disclaimer, { color: colors.textSecondary }]}>
              {t("legal.disclaimer")}
            </Text>
            {content.sections.map((section) => (
              <View key={section.heading} style={styles.section}>
                <Text style={[styles.heading, { color: colors.text }]}>
                  {section.heading}
                </Text>
                <Text style={[styles.body, { color: colors.textSecondary }]}>
                  {section.body}
                </Text>
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      paddingTop: 60,
      paddingHorizontal: 20,
    },
    topBar: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 16,
      gap: 8,
    },
    backButton: {
      width: 40,
      height: 40,
      alignItems: "center",
      justifyContent: "center",
    },
    title: {
      flex: 1,
      fontSize: 17,
      fontWeight: "800",
      textAlign: "center",
    },
    disclaimer: {
      fontSize: 13,
      lineHeight: 19,
      fontWeight: "500",
      fontStyle: "italic",
      marginBottom: 20,
    },
    section: {
      marginBottom: 18,
      gap: 8,
    },
    heading: {
      fontSize: 16,
      fontWeight: "800",
    },
    body: {
      fontSize: 14,
      lineHeight: 21,
      fontWeight: "500",
    },
  });
}
