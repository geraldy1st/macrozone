import { File, Paths } from "expo-file-system";
import * as ImageManipulator from "expo-image-manipulator";

const MEAL_PHOTOS_DIR = new File(Paths.document, "meal-photos");

async function ensurePhotosDirectory() {
  if (!MEAL_PHOTOS_DIR.exists) {
    MEAL_PHOTOS_DIR.create({ intermediates: true });
  }
}

async function normalizeImageUri(uri: string): Promise<string> {
  if (uri.startsWith("file://")) {
    return uri;
  }

  const cacheFile = new File(Paths.cache, `meal-upload-${Date.now()}.jpg`);
  const source = new File(uri);
  source.copy(cacheFile);
  return cacheFile.uri;
}

export async function prepareImageForUpload(uri: string) {
  const normalizedUri = await normalizeImageUri(uri);
  const result = await ImageManipulator.manipulateAsync(
    normalizedUri,
    [{ resize: { width: 1024 } }],
    {
      compress: 0.7,
      format: ImageManipulator.SaveFormat.JPEG,
      base64: true,
    },
  );

  if (!result.base64 || result.base64.length < 100) {
    throw new Error("Failed to encode image");
  }

  return {
    uri: result.uri,
    base64: result.base64,
  };
}

export async function saveMealPhoto(
  tempUri: string,
  mealId: string,
): Promise<string> {
  await ensurePhotosDirectory();
  const normalizedUri = await normalizeImageUri(tempUri);
  const destination = new File(MEAL_PHOTOS_DIR, `${mealId}.jpg`);
  const source = new File(normalizedUri);
  source.copy(destination);
  return destination.uri;
}

export async function deleteMealPhoto(photoUri?: string) {
  if (!photoUri) {
    return;
  }

  const file = new File(photoUri);
  if (file.exists) {
    file.delete();
  }
}

export async function clearAllMealPhotos() {
  if (MEAL_PHOTOS_DIR.exists) {
    MEAL_PHOTOS_DIR.delete();
  }
}