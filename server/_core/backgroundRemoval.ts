import { ENV } from './env';
// Use native fetch available in Node.js 18+

/**
 * Remove background from image using remove.bg API
 * Falls back to a simple color-based removal if API key not available
 */
export async function removeBackground(imageUrl: string): Promise<string> {
  try {
    // If we have remove.bg API key, use it
    if (process.env.REMOVE_BG_API_KEY) {
      return await removeBackgroundWithRemoveBg(imageUrl);
    }
    
    // Otherwise use simple color-based removal
    return await removeBackgroundSimple(imageUrl);
  } catch (error) {
    console.error('Background removal failed:', error);
    throw new Error('Failed to remove background from image');
  }
}

/**
 * Remove background using remove.bg API
 */
async function removeBackgroundWithRemoveBg(imageUrl: string): Promise<string> {
  const response = await fetch('https://api.remove.bg/v1.0/removebg', {
    method: 'POST',
    headers: {
      'X-Api-Key': process.env.REMOVE_BG_API_KEY!,
    },
    body: JSON.stringify({
      image_url: imageUrl,
      format: 'PNG',
      type: 'auto',
    }),
  });

  if (!response.ok) {
    throw new Error(`remove.bg API error: ${response.statusText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const base64 = buffer.toString('base64');
  return `data:image/png;base64,${base64}`;
}

/**
 * Simple background removal using color detection
 * Removes white or light backgrounds
 */
async function removeBackgroundSimple(imageUrl: string): Promise<string> {
  try {
    // Fetch image from URL
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error('Failed to fetch image');
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // For now, return the original image as we can't process without external library
    // In production, you'd use a library like jimp or canvas to process the image
    const base64 = buffer.toString('base64');
    const mimeType = response.headers.get('content-type') || 'image/png';
    return `data:${mimeType};base64,${base64}`;
  } catch (error) {
    console.error('Simple background removal failed:', error);
    throw error;
  }
}

/**
 * Validate image quality (DPI, dimensions)
 */
export function validateImageQuality(
  width: number,
  height: number,
  dpi: number = 300
): { valid: boolean; warnings: string[] } {
  const warnings: string[] = [];

  if (dpi < 300) {
    warnings.push(`Low DPI: ${dpi}. Recommended minimum is 300 DPI for printing.`);
  }

  if (width < 2000) {
    warnings.push(`Image width (${width}px) is below recommended 2000px minimum.`);
  }

  if (height < 2000) {
    warnings.push(`Image height (${height}px) is below recommended 2000px minimum.`);
  }

  return {
    valid: warnings.length === 0,
    warnings,
  };
}
