import type { ThemeColors } from "@/styles/themes";
import {
  createEmptyIngredient,
  type CalorieScope,
  type RecipeData,
  type RecipeIngredient,
} from "@/types/recipe";
import { Ionicons } from "@expo/vector-icons";
import type { RefObject } from "react";
import { useTranslation } from "react-i18next";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

type StructuredRecipeFormProps = {
  value: RecipeData;
  onChange: (next: RecipeData) => void;
  colors: ThemeColors;
  disabled?: boolean;
  notesInputRef?: RefObject<TextInput | null>;
  onNotesFocus?: () => void;
  testIDPrefix?: string;
};

export default function StructuredRecipeForm({
  value,
  onChange,
  colors,
  disabled,
  notesInputRef,
  onNotesFocus,
  testIDPrefix = "recipe",
}: StructuredRecipeFormProps) {
  const { t } = useTranslation();
  const styles = createStyles(colors);

  const patch = (partial: Partial<RecipeData>) => {
    onChange({ ...value, ...partial });
  };

  const updateIngredient = (
    id: string,
    field: keyof RecipeIngredient,
    text: string,
  ) => {
    patch({
      ingredients: value.ingredients.map((item) =>
        item.id === id ? { ...item, [field]: text } : item,
      ),
    });
  };

  const removeIngredient = (id: string) => {
    patch({
      ingredients: value.ingredients.filter((item) => item.id !== id),
    });
  };

  const addIngredient = () => {
    patch({
      ingredients: [...value.ingredients, createEmptyIngredient()],
    });
  };

  const setScope = (calorieScope: CalorieScope) => {
    patch({ calorieScope });
  };

  return (
    <View style={styles.wrap} testID={`${testIDPrefix}-form`}>
      <Text style={[styles.sectionLabel, { color: colors.text }]}>
        {t("recipe.sectionTitle")}
      </Text>
      <Text style={[styles.hint, { color: colors.textSecondary }]}>
        {t("recipe.sectionHint")}
      </Text>

      <View style={styles.row}>
        <View style={styles.half}>
          <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
            {t("recipe.prepTime")}
          </Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.cardBorder }]}
            keyboardType="number-pad"
            value={
              value.prepTimeMinutes != null && value.prepTimeMinutes > 0
                ? String(value.prepTimeMinutes)
                : ""
            }
            onChangeText={(text) => {
              const n = parseInt(text.replace(/\D/g, ""), 10);
              patch({
                prepTimeMinutes: Number.isFinite(n) && n > 0 ? n : undefined,
              });
            }}
            placeholder="0"
            placeholderTextColor={colors.textSecondary}
            editable={!disabled}
            testID={`${testIDPrefix}-prep-time`}
          />
        </View>
        <View style={styles.half}>
          <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
            {t("recipe.cookTime")}
          </Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.cardBorder }]}
            keyboardType="number-pad"
            value={
              value.cookTimeMinutes != null && value.cookTimeMinutes > 0
                ? String(value.cookTimeMinutes)
                : ""
            }
            onChangeText={(text) => {
              const n = parseInt(text.replace(/\D/g, ""), 10);
              patch({
                cookTimeMinutes: Number.isFinite(n) && n > 0 ? n : undefined,
              });
            }}
            placeholder="0"
            placeholderTextColor={colors.textSecondary}
            editable={!disabled}
            testID={`${testIDPrefix}-cook-time`}
          />
        </View>
      </View>

      <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
        {t("recipe.servings")}
      </Text>
      <TextInput
        style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.cardBorder }]}
        keyboardType="number-pad"
        value={String(value.servings || 1)}
        onChangeText={(text) => {
          const n = parseInt(text.replace(/\D/g, ""), 10);
          patch({ servings: Number.isFinite(n) && n > 0 ? n : 1 });
        }}
        placeholder="1"
        placeholderTextColor={colors.textSecondary}
        editable={!disabled}
        testID={`${testIDPrefix}-servings`}
      />

      <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
        {t("recipe.calorieScope")}
      </Text>
      <View style={styles.scopeRow}>
        <TouchableOpacity
          style={[
            styles.scopeChip,
            {
              borderColor: colors.cardBorder,
              backgroundColor:
                value.calorieScope === "per_serving"
                  ? colors.accent
                  : colors.surface,
            },
          ]}
          onPress={() => setScope("per_serving")}
          disabled={disabled}
          testID={`${testIDPrefix}-scope-serving`}
        >
          <Text
            style={[
              styles.scopeChipText,
              {
                color:
                  value.calorieScope === "per_serving"
                    ? colors.background
                    : colors.text,
              },
            ]}
          >
            {t("recipe.scopePerServing")}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.scopeChip,
            {
              borderColor: colors.cardBorder,
              backgroundColor:
                value.calorieScope === "whole_dish"
                  ? colors.accent
                  : colors.surface,
            },
          ]}
          onPress={() => setScope("whole_dish")}
          disabled={disabled}
          testID={`${testIDPrefix}-scope-whole`}
        >
          <Text
            style={[
              styles.scopeChipText,
              {
                color:
                  value.calorieScope === "whole_dish"
                    ? colors.background
                    : colors.text,
              },
            ]}
          >
            {t("recipe.scopeWholeDish")}
          </Text>
        </TouchableOpacity>
      </View>
      <Text style={[styles.hint, { color: colors.textSecondary }]}>
        {t("recipe.calorieScopeHint")}
      </Text>

      <Text style={[styles.fieldLabel, { color: colors.textSecondary, marginTop: 12 }]}>
        {t("recipe.ingredients")}
      </Text>

      {value.ingredients.map((item) => (
        <View key={item.id} style={styles.ingredientRow}>
          <TextInput
            style={[
              styles.input,
              styles.ingredientName,
              {
                backgroundColor: colors.surface,
                color: colors.text,
                borderColor: colors.cardBorder,
              },
            ]}
            value={item.name}
            onChangeText={(text) => updateIngredient(item.id, "name", text)}
            placeholder={t("recipe.ingredientName")}
            placeholderTextColor={colors.textSecondary}
            editable={!disabled}
          />
          <TextInput
            style={[
              styles.input,
              styles.ingredientQty,
              {
                backgroundColor: colors.surface,
                color: colors.text,
                borderColor: colors.cardBorder,
              },
            ]}
            value={item.quantity}
            onChangeText={(text) => updateIngredient(item.id, "quantity", text)}
            placeholder={t("recipe.quantity")}
            placeholderTextColor={colors.textSecondary}
            editable={!disabled}
          />
          <TextInput
            style={[
              styles.input,
              styles.ingredientUnit,
              {
                backgroundColor: colors.surface,
                color: colors.text,
                borderColor: colors.cardBorder,
              },
            ]}
            value={item.unit}
            onChangeText={(text) => updateIngredient(item.id, "unit", text)}
            placeholder={t("recipe.unit")}
            placeholderTextColor={colors.textSecondary}
            editable={!disabled}
          />
          <TouchableOpacity
            onPress={() => removeIngredient(item.id)}
            disabled={disabled}
            hitSlop={8}
            accessibilityLabel={t("recipe.removeIngredient")}
          >
            <Ionicons name="close-circle" size={22} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      ))}

      <TouchableOpacity
        style={[styles.addRowBtn, { borderColor: colors.cardBorder }]}
        onPress={addIngredient}
        disabled={disabled}
        testID={`${testIDPrefix}-add-ingredient`}
      >
        <Ionicons name="add" size={18} color={colors.accent} />
        <Text style={[styles.addRowText, { color: colors.accent }]}>
          {t("recipe.addIngredient")}
        </Text>
      </TouchableOpacity>

      <Text style={[styles.fieldLabel, { color: colors.textSecondary, marginTop: 12 }]}>
        {t("recipe.notes")}
      </Text>
      <TextInput
        ref={notesInputRef}
        style={[
          styles.input,
          styles.notes,
          {
            backgroundColor: colors.surface,
            color: colors.text,
            borderColor: colors.cardBorder,
          },
        ]}
        value={value.notes ?? ""}
        onChangeText={(text) => patch({ notes: text })}
        onFocus={onNotesFocus}
        placeholder={t("recipe.notesPlaceholder")}
        placeholderTextColor={colors.textSecondary}
        multiline
        editable={!disabled}
        testID={`${testIDPrefix}-notes`}
      />
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    wrap: {
      marginTop: 16,
      gap: 8,
    },
    sectionLabel: {
      fontSize: 16,
      fontWeight: "800",
    },
    hint: {
      fontSize: 12,
      lineHeight: 17,
      fontWeight: "500",
      marginBottom: 4,
    },
    fieldLabel: {
      fontSize: 12,
      fontWeight: "700",
      textTransform: "uppercase",
      letterSpacing: 0.4,
      marginTop: 4,
    },
    input: {
      padding: 12,
      borderRadius: 10,
      fontSize: 15,
      borderWidth: 1,
      marginTop: 4,
    },
    row: {
      flexDirection: "row",
      gap: 10,
    },
    half: {
      flex: 1,
    },
    scopeRow: {
      flexDirection: "row",
      gap: 8,
      marginTop: 6,
    },
    scopeChip: {
      flex: 1,
      borderWidth: 1,
      borderRadius: 10,
      paddingVertical: 10,
      paddingHorizontal: 8,
      alignItems: "center",
    },
    scopeChipText: {
      fontSize: 12,
      fontWeight: "700",
      textAlign: "center",
    },
    ingredientRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      marginTop: 4,
    },
    ingredientName: {
      flex: 1.4,
      marginTop: 0,
    },
    ingredientQty: {
      flex: 0.7,
      marginTop: 0,
    },
    ingredientUnit: {
      flex: 0.7,
      marginTop: 0,
    },
    addRowBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      alignSelf: "flex-start",
      borderWidth: 1,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 8,
      marginTop: 6,
    },
    addRowText: {
      fontSize: 14,
      fontWeight: "700",
    },
    notes: {
      minHeight: 90,
      textAlignVertical: "top",
    },
  });
}
