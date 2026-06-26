import { Directory, File, Paths } from "expo-file-system";
import * as ImageManipulator from "expo-image-manipulator";

const MEAL_PHOTOS_DIR = new Directory(Paths.document, "meal-photos");

function toFileUri(uri: string): string {
  if (uri.startsWith("file://") || uri.startsWith("content://")) {
    return uri;
  }

  if (uri.startsWith("/")) {
    return `file://${uri}`;
  }

  return uri;
}

async function ensurePhotosDirectory() {
  if (MEAL_PHOTOS_DIR.exists) {
    try {
      MEAL_PHOTOS_DIR.list();
      return;
    } catch {
      MEAL_PHOTOS_DIR.delete();
    }
  }

  const legacyEntry = new File(Paths.document, "meal-photos");
  if (legacyEntry.exists) {
    legacyEntry.delete();
  }

  MEAL_PHOTOS_DIR.create({ intermediates: true, idempotent: true });
}

async function normalizeImageUri(uri: string): Promise<string> {
  const fileUri = toFileUri(uri);

  if (fileUri.startsWith("file://")) {
    const file = new File(fileUri);
    if (file.exists) {
      return fileUri;
    }
  }

  const cacheFile = new File(Paths.cache, `meal-upload-${Date.now()}.jpg`);
  const source = new File(fileUri);
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
    uri: toFileUri(result.uri),
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

  if (!source.exists) {
    throw new Error("Source photo not found");
  }

  if (destination.exists) {
    destination.delete();
  }

  source.copy(destination);

  if (!destination.exists || destination.size === 0) {
    const bytes = await source.bytes();
    destination.create({ overwrite: true });
    destination.write(bytes);
  }

  if (!destination.exists || destination.size === 0) {
    throw new Error("Failed to save meal photo");
  }

  return destination.uri;
}

export async function deleteMealPhoto(photoUri?: string) {
  if (!photoUri) {
    return;
  }

  const file = new File(toFileUri(photoUri));
  if (file.exists) {
    file.delete();
  }
}

export async function clearAllMealPhotos() {
  if (MEAL_PHOTOS_DIR.exists) {
    MEAL_PHOTOS_DIR.delete();
  }
}