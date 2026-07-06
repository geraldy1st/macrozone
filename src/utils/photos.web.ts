const MAX_WIDTH = 1024;
const JPEG_QUALITY = 0.7;

function loadImage(uri: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Failed to load image"));
    image.src = uri;
  });
}

async function imageToJpeg(uri: string) {
  const image = await loadImage(uri);
  const scale = Math.min(1, MAX_WIDTH / image.width);
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Canvas not supported");
  }

  context.drawImage(image, 0, 0, width, height);

  const dataUrl = canvas.toDataURL("image/jpeg", JPEG_QUALITY);
  const base64 = dataUrl.split(",")[1] ?? "";

  if (base64.length < 100) {
    throw new Error("Failed to encode image");
  }

  return { dataUrl, base64 };
}

export async function prepareImageForUpload(uri: string) {
  const { dataUrl, base64 } = await imageToJpeg(uri);
  return { uri: dataUrl, base64 };
}

export async function saveMealPhoto(tempUri: string, _mealId: string) {
  const { dataUrl } = await imageToJpeg(tempUri);
  return dataUrl;
}

export async function deleteMealPhoto(_photoUri?: string) {}

export async function clearAllMealPhotos() {}