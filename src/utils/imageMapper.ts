/**
 * Image mapper for local book images
 * This file properly imports all local images for React Native bundling
 */

// Import all local images
const localImages = {
  'image_rsrc7F.jpg': require('../assets/content/images/image_rsrc7F.jpg'),
  'image_rsrcDY.jpg': require('../assets/content/images/image_rsrcDY.jpg'),
  'image_rsrcE2.jpg': require('../assets/content/images/image_rsrcE2.jpg'),
  'image_rsrc111.jpg': require('../assets/content/images/image_rsrc111.jpg'),
  'image_rsrcG9.jpg': require('../assets/content/images/image_rsrcG9.jpg'),
  'image_rsrcGT.jpg': require('../assets/content/images/image_rsrcGT.jpg'),
  'image_rsrcH7.jpg': require('../assets/content/images/image_rsrcH7.jpg'),
  'image_rsrcK2.jpg': require('../assets/content/images/image_rsrcK2.jpg'),
  'image_rsrcV6.jpg': require('../assets/content/images/image_rsrcV6.jpg'),
  'image_rsrcZU.jpg': require('../assets/content/images/image_rsrcZU.jpg'),
  'image_rsrcNV.jpg': require('../assets/content/images/image_rsrcNV.jpg'),
  'image_rsrcRR.jpg': require('../assets/content/images/image_rsrcRR.jpg'),
  'image_rsrcUG.jpg': require('../assets/content/images/image_rsrcUG.jpg'),
  'image_rsrcMM.jpg': require('../assets/content/images/image_rsrcMM.jpg'),
  'image_rsrcND.jpg': require('../assets/content/images/image_rsrcND.jpg'),
  'image_rsrc1CW.jpg': require('../assets/content/images/image_rsrc1CW.jpg'),
  'image_rsrc1E6.jpg': require('../assets/content/images/image_rsrc1E6.jpg'),
  'image_rsrc1EH.jpg': require('../assets/content/images/image_rsrc1EH.jpg'),
  'image_rsrc1F3.jpg': require('../assets/content/images/image_rsrc1F3.jpg'),
  'image_rsrc1GX.jpg': require('../assets/content/images/image_rsrc1GX.jpg'),
  'image_rsrc1HZ.jpg': require('../assets/content/images/image_rsrc1HZ.jpg'),
  'image_rsrc15E.jpg': require('../assets/content/images/image_rsrc15E.jpg'),
  'image_rsrc178.jpg': require('../assets/content/images/image_rsrc178.jpg'),
  'image_rsrc17C.jpg': require('../assets/content/images/image_rsrc17C.jpg'),
  'image_rsrc1M5.jpg': require('../assets/content/images/image_rsrc1M5.jpg'),
  'image_rsrc1S5.jpg': require('../assets/content/images/image_rsrc1S5.jpg'),
  'image_rsrc1WF.jpg': require('../assets/content/images/image_rsrc1WF.jpg'),
  'image_rsrc1WT.jpg': require('../assets/content/images/image_rsrc1WT.jpg'),
  'image_rsrc1X0.jpg': require('../assets/content/images/image_rsrc1X0.jpg'),
  'image_rsrc1X7.jpg': require('../assets/content/images/image_rsrc1X7.jpg'),
  'image_rsrc1XE.jpg': require('../assets/content/images/image_rsrc1XE.jpg'),
  'image_rsrc1XN.jpg': require('../assets/content/images/image_rsrc1XN.jpg'),
  'image_rsrc1XW.jpg': require('../assets/content/images/image_rsrc1XW.jpg'),
  'image_rsrc1Y3.jpg': require('../assets/content/images/image_rsrc1Y3.jpg'),
  'image_rsrc1YA.jpg': require('../assets/content/images/image_rsrc1YA.jpg'),
  'image_rsrc1ZH.jpg': require('../assets/content/images/image_rsrc1ZH.jpg'),
  'image_rsrc244.jpg': require('../assets/content/images/image_rsrc244.jpg'),
  'image_rsrc250.jpg': require('../assets/content/images/image_rsrc250.jpg'),
  'image_rsrc2AV.jpg': require('../assets/content/images/image_rsrc2AV.jpg'),
  'image_rsrc2C1.jpg': require('../assets/content/images/image_rsrc2C1.jpg'),
  'image_rsrc2D9.jpg': require('../assets/content/images/image_rsrc2D9.jpg'),
  'image_rsrc2X8.jpg': require('../assets/content/images/image_rsrc2X8.jpg'),
  'image_rsrc2YN.jpg': require('../assets/content/images/image_rsrc2YN.jpg'),
  'image_rsrc380.jpg': require('../assets/content/images/image_rsrc380.jpg'),
  'image_rsrc3BE.jpg': require('../assets/content/images/image_rsrc3BE.jpg'),
  'image_rsrcET.jpg': require('../assets/content/images/image_rsrcET.jpg'),
};

/**
 * Get local image URI for a given image name
 * @param imageName - The name of the image (e.g., 'image_rsrc7F.jpg')
 * @returns The local image URI or null if not found
 */
export function getLocalImageUri(imageName: string): any | null {
  return localImages[imageName as keyof typeof localImages] || null;
}

/**
 * Check if an image exists locally
 * @param imageName - The name of the image
 * @returns true if image exists locally
 */
export function hasLocalImage(imageName: string): boolean {
  return imageName in localImages;
}

/**
 * Get all available local image names
 * @returns Array of available image names
 */
export function getAvailableImageNames(): string[] {
  return Object.keys(localImages);
}

/**
 * Process HTML content to replace image sources with local image URIs
 * @param htmlContent - The HTML content containing image tags
 * @returns Processed HTML with local image URIs
 */
export function processLocalImages(htmlContent: string): string {
  let processedContent = htmlContent;
  
  // Find all img tags and replace them with local URIs
  const imgTagRegex = /<img([^>]+)src="([^"]+)"([^>]*)>/g;
  
  processedContent = processedContent.replace(imgTagRegex, (match, beforeSrc, srcValue, afterSrc) => {
    // Extract image name from src
    let imageName: string;
    
    if (srcValue.startsWith('http') || srcValue.startsWith('data:')) {
      // Skip URLs and data URIs
      return match;
    } else if (srcValue.includes('/')) {
      // Extract filename from path
      imageName = srcValue.split('/').pop() || srcValue;
    } else {
      // Direct image name
      imageName = srcValue;
    }
    
    // Get local image URI
    const localUri = getLocalImageUri(imageName);
    
    if (localUri) {
      console.log(`✅ Replaced ${imageName} with local URI`);
      return `<img${beforeSrc}src="${localUri}"${afterSrc}>`;
    }
    
    // Return original if no local image found
    console.warn(`⚠️ No local image found for: ${imageName}`);
    return match;
  });
  
  return processedContent;
} 