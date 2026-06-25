import MealItem from "@/components/MealItem";
import { clearAllMeals, getMeals, Meal } from "@/storage/meals";
import { globalStyles } from "@/styles/global";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function AllMealsScreen() {
  const { t } = useTranslation();
  const [meals, setMeals] = useState<Meal[]>([]);

  const loadMeals = async () => {
    const data = await getMeals();
    setMeals(data);
  };

  const handleClearAll = async () => {
    await clearAllMeals();
    loadMeals();
  };

  useFocusEffect(
    useCallback(() => {
      loadMeals();
    }, []),
  );

  return (
    <ScrollView style={globalStyles.container}>
      <View style={globalStyles.header}>
        <Text style={globalStyles.title}>{t("allMeals.title")}</Text>
        <TouchableOpacity onPress={handleClearAll}>
          <Text style={styles.clearButton}>{t("allMeals.clearAll")}</Text>
        </TouchableOpacity>
      </View>
      <View style={{ marginTop: 30 }}>
        {meals.length === 0 ? (
          <Text style={globalStyles.empty}>{t("allMeals.noMeals")}</Text>
        ) : (
          meals.map((meal) => (
            <MealItem
              key={meal.id}
              id={meal.id}
              name={meal.name}
              calories={meal.calories}
              protein={meal.protein}
              carbs={meal.carbs}
              fat={meal.fat}
              photoUri={meal.photoUri}
              onDelete={loadMeals}
            />
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  clearButton: {
    color: "red",
    fontSize: 16,
  },
});