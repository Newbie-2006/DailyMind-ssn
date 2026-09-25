/**
 * Turns a chosen photo into a data URL that is small enough to keep in
 * localStorage. Phone cameras produce files far larger than the whole quota,
 * so the image is scaled down and re-encoded before it is ever stored.
 */
const MAX_EDGE = 1200;
const QUALITY = 0.72;

export async function fileToStorableImage(file: File): Promise<string> {
  const original = await readAsDataUrl(file);

  try {
    const image = await loadImage(original);
    const scale = Math.min(1, MAX_EDGE / Math.max(image.width, image.height));

    // Already small enough, and re-encoding would only lose quality.
    if (scale === 1 && original.length < 400_000) return original;

    const canvas = document.createElement('canvas');
    canvas.width = Math.round(image.width * scale);
    canvas.height = Math.round(image.height * scale);

    const context = canvas.getContext('2d');
    if (!context) return original;

    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', QUALITY);
  } catch {
    // A format the canvas cannot decode still deserves to be saved as-is.
    return original;
  }
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('That image could not be read.'));
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('That image could not be opened.'));
    image.src = src;
  });
}
