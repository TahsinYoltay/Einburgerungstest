import { Platform } from 'react-native';
import { firebaseImageService } from '../services/FirebaseImageService';
import { chapter1Html } from '../assets/content/ChaptersV2/chapter1Html';
import { chapter2Html } from '../assets/content/ChaptersV2/chapter2Html';
import { chapter3Html } from '../assets/content/ChaptersV2/chapter3Html';
import { chapter4Html } from '../assets/content/ChaptersV2/chapter4Html';
import { chapter5Html } from '../assets/content/ChaptersV2/chapter5Html';
import { processLocalImages, hasLocalImage } from '../utils/imageMapper';

export interface ContentData {
  chapterId: string;
  title: string;
  htmlContent: string;
}

export interface SectionData {
  id: string;
  title: string;
  htmlContent: string;
  chapterId: string;
}

// Image mapping for Firebase Storage paths
export const FIREBASE_IMAGE_PATHS: Record<string, string> = {
  // Chapter 1 - Early Britain & History
  'image_rsrcDY.jpg': 'assets/bookImages/image_rsrcDY.jpg',
  'image_rsrcE2.jpg': 'assets/bookImages/image_rsrcE2.jpg',
  'image_rsrc111.jpg': 'assets/bookImages/image_rsrc111.jpg',

  // Historical figures and artifacts
  'image_rsrcG9.jpg': 'assets/bookImages/image_rsrcG9.jpg', // Stonehenge
  'image_rsrcGT.jpg': 'assets/bookImages/image_rsrcGT.jpg', // Anglo-Saxon helmet
  'image_rsrcH7.jpg': 'assets/bookImages/image_rsrcH7.jpg', // Bayeux Tapestry
  'image_rsrcK2.jpg': 'assets/bookImages/image_rsrcK2.jpg', // York Minster
  'image_rsrc7F.jpg': 'assets/bookImages/image_rsrc7F.jpg', // Westminster Abbey

  // Tudors and Historical Figures
  'image_rsrcV6.jpg': 'assets/bookImages/image_rsrcV6.jpg', // Henry VIII
  'image_rsrcZU.jpg': 'assets/bookImages/image_rsrcZU.jpg', // Elizabeth I
  'image_rsrcNV.jpg': 'assets/bookImages/image_rsrcNV.jpg', // Shakespeare
  'image_rsrcRR.jpg': 'assets/bookImages/image_rsrcRR.jpg', // Oliver Cromwell
  'image_rsrcUG.jpg': 'assets/bookImages/image_rsrcUG.jpg', // Battle of Trafalgar
  'image_rsrcMM.jpg': 'assets/bookImages/image_rsrcMM.jpg', // Union Flag
  'image_rsrcND.jpg': 'assets/bookImages/image_rsrcND.jpg', // Union Flag crosses
  'image_rsrc1CW.jpg': 'assets/bookImages/image_rsrc1CW.jpg', // Welsh flag
  'image_rsrc1E6.jpg': 'assets/bookImages/image_rsrc1E6.jpg', // Clifton Suspension Bridge

  // 20th Century
  'image_rsrc1EH.jpg': 'assets/bookImages/image_rsrc1EH.jpg', // WWI trenches
  'image_rsrc1F3.jpg': 'assets/bookImages/image_rsrc1F3.jpg', // Winston Churchill
  'image_rsrc1GX.jpg': 'assets/bookImages/image_rsrc1GX.jpg', // RAF
  'image_rsrc1HZ.jpg': 'assets/bookImages/image_rsrc1HZ.jpg', // Margaret Thatcher

  // Culture and traditions
  'image_rsrc15E.jpg': 'assets/bookImages/image_rsrc15E.jpg', // Christmas meal
  'image_rsrc178.jpg': 'assets/bookImages/image_rsrc178.jpg', // Diwali
  'image_rsrc17C.jpg': 'assets/bookImages/image_rsrc17C.jpg', // Cenotaph

  // Sports and Culture
  'image_rsrc1M5.jpg': 'assets/bookImages/image_rsrc1M5.jpg', // Cricket
  'image_rsrc1S5.jpg': 'assets/bookImages/image_rsrc1S5.jpg', // Royal Albert Hall
  'image_rsrc1WF.jpg': 'assets/bookImages/image_rsrc1WF.jpg', // Tate Modern

  // Government and Democracy
  'image_rsrc1WT.jpg': 'assets/bookImages/image_rsrc1WT.jpg', // Emmeline Pankhurst
  'image_rsrc1X0.jpg': 'assets/bookImages/image_rsrc1X0.jpg',
  'image_rsrc1X7.jpg': 'assets/bookImages/image_rsrc1X7.jpg',
  'image_rsrc1XE.jpg': 'assets/bookImages/image_rsrc1XE.jpg',
  'image_rsrc1XN.jpg': 'assets/bookImages/image_rsrc1XN.jpg',
  'image_rsrc1XW.jpg': 'assets/bookImages/image_rsrc1XW.jpg',
  'image_rsrc1Y3.jpg': 'assets/bookImages/image_rsrc1Y3.jpg',
  'image_rsrc1YA.jpg': 'assets/bookImages/image_rsrc1YA.jpg',
  'image_rsrc1ZH.jpg': 'assets/bookImages/image_rsrc1ZH.jpg',
  'image_rsrc244.jpg': 'assets/bookImages/image_rsrc244.jpg',
  'image_rsrc250.jpg': 'assets/bookImages/image_rsrc250.jpg',
  'image_rsrc2AV.jpg': 'assets/bookImages/image_rsrc2AV.jpg',
  'image_rsrc2C1.jpg': 'assets/bookImages/image_rsrc2C1.jpg',
  'image_rsrc2D9.jpg': 'assets/bookImages/image_rsrc2D9.jpg',
  'image_rsrc2X8.jpg': 'assets/bookImages/image_rsrc2X8.jpg',
  'image_rsrc2YN.jpg': 'assets/bookImages/image_rsrc2YN.jpg',
  'image_rsrc380.jpg': 'assets/bookImages/image_rsrc380.jpg',
  'image_rsrc3BE.jpg': 'assets/bookImages/image_rsrc3BE.jpg',
};

/**
 * Load chapter content by ID
 */
export async function loadChapterContent(chapterId: string): Promise<string | null> {
  try {
    console.log(`Loading chapter content for: ${chapterId}`);
    const htmlContent = await getHTMLContent(chapterId);
    
    if (!htmlContent) {
      console.log(`No content found for chapter ${chapterId}`);
      return null;
    }

    // Process Firebase images
    const processedContent = await processFirebaseImages(htmlContent);
    return processedContent;
  } catch (error) {
    console.error(`Error loading chapter content for ${chapterId}:`, error);
    return null;
  }
}

/**
 * Load section content (now simplified to load full chapter as one section)
 */
export async function loadSectionContent(chapterId: string, sectionId: string): Promise<SectionData | null> {
  try {
    console.log(`Loading section content for: ${chapterId}/${sectionId}`);
    
    // Since we now have one section per chapter, we just load the full chapter
    const htmlContent = await getHTMLContent(chapterId);
    
    if (!htmlContent) {
      console.log(`No content found for chapter ${chapterId}`);
      return null;
    }

    // Process Firebase images
    const processedContent = await processFirebaseImages(htmlContent);
    
    // Get chapter title from chapters.json
    const chapterTitles: Record<string, string> = {
      '1': 'The Values and Principles of the UK',
      '2': 'What is the UK?',
      '3': 'A Long and Illustrious History',
      '4': 'A Modern, Thriving Society',
      '5': 'The UK Government, the Law and Your Role',
    };

    return {
      id: sectionId,
      title: chapterTitles[chapterId] || `Chapter ${chapterId}`,
      htmlContent: processedContent,
      chapterId: chapterId,
    };
  } catch (error) {
    console.error(`Error loading section content for ${chapterId}/${sectionId}:`, error);
    return null;
  }
}

/**
 * Get HTML content from TypeScript files
 */
async function getHTMLContent(chapterId: string): Promise<string | null> {
  try {
    console.log(`Loading HTML content for chapter ${chapterId}`);
    
    const htmlContentMap: Record<string, string> = {
      '1': chapter1Html,
      '2': chapter2Html,
      '3': chapter3Html,
      '4': chapter4Html,
      '5': chapter5Html,
    };

    const htmlContent = htmlContentMap[chapterId];
    
    if (htmlContent) {
      console.log(`✅ Found HTML content for chapter ${chapterId}, length: ${htmlContent.length} characters`);
      return htmlContent;
    }

    console.log(`❌ No content found for chapter ${chapterId}`);
    return null;
  } catch (error) {
    console.error(`Error loading HTML content for chapter ${chapterId}:`, error);
    return null;
  }
}

/**
 * Process content to replace image sources with local images
 * Uses local images as primary source, Firebase as fallback
 */
async function processFirebaseImages(htmlContent: string): Promise<string> {
  try {
    console.log(`📊 Processing images for content with ${htmlContent.length} characters`);
    
    // First, try to use local images (most reliable approach)
    const processedWithLocalImages = processLocalImages(htmlContent);
    
    // Check if we successfully processed any images
    const originalImageCount = (htmlContent.match(/<img[^>]+>/g) || []).length;
    const processedImageCount = (processedWithLocalImages.match(/<img[^>]+>/g) || []).length;
    
    console.log(`📊 Found ${originalImageCount} images in content`);
    
    if (processedWithLocalImages !== htmlContent) {
      console.log(`🎉 Successfully processed images using local assets`);
      return processedWithLocalImages;
    }
    
    // If local processing didn't change anything, fall back to Firebase
    console.log('🔄 Local image processing did not change content, trying Firebase fallback...');
    return await processFirebaseImagesAsFallback(htmlContent);

  } catch (error) {
    console.error('❌ Error processing images, falling back to Firebase:', error);
    
    // Fallback to Firebase approach
    return await processFirebaseImagesAsFallback(htmlContent);
  }
}

/**
 * Fallback method to use Firebase images if local images fail
 */
async function processFirebaseImagesAsFallback(htmlContent: string): Promise<string> {
  try {
    console.log('🔄 Using Firebase images as fallback...');
    
    // Find all existing img tags and extract image names
    const imgTagRegex = /<img[^>]+src="([^"]+)"[^>]*>/g;
    const imagesToReplace = new Set<string>();
    let match;

    // Extract image names from existing img tags
    while ((match = imgTagRegex.exec(htmlContent)) !== null) {
      const srcValue = match[1];
      
      let imageName: string;
      
      if (srcValue.startsWith('http') || srcValue.startsWith('../../assets')) {
        continue;
      } else if (srcValue.includes('/')) {
        imageName = srcValue.split('/').pop() || srcValue;
      } else {
        imageName = srcValue;
      }
      
      if (FIREBASE_IMAGE_PATHS[imageName]) {
        imagesToReplace.add(imageName);
      }
    }

    if (imagesToReplace.size === 0) {
      console.log('No images to process with Firebase fallback');
      return htmlContent;
    }

    console.log(`Loading ${imagesToReplace.size} images from Firebase Storage as fallback:`, Array.from(imagesToReplace));
    
    // Get Firebase paths for the images we found
    const firebasePaths = Array.from(imagesToReplace)
      .map(imageName => FIREBASE_IMAGE_PATHS[imageName])
      .filter(Boolean);

    // Download all needed image URLs from Firebase
    const imageResults = await firebaseImageService.getMultipleImageUrls(firebasePaths);
    
    // Create a mapping from image name to Firebase URL
    const imageUrlMap: Record<string, string> = {};
    Object.entries(FIREBASE_IMAGE_PATHS).forEach(([imageName, firebasePath]) => {
      if (imageResults.successful[firebasePath]) {
        imageUrlMap[imageName] = imageResults.successful[firebasePath];
      } else if (imageResults.fromCache[firebasePath]) {
        imageUrlMap[imageName] = imageResults.fromCache[firebasePath];
      }
    });

    console.log('Firebase fallback image URLs loaded:', imageUrlMap);

    let processedContent = htmlContent;

    // Replace existing img tags with Firebase URLs
    Object.entries(imageUrlMap).forEach(([imageName, firebaseUrl]) => {
      const patterns = [
        new RegExp(`src="([^"]*/)?(${imageName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})"`, 'g'),
        new RegExp(`src='([^']*/)?(${imageName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})'`, 'g')
      ];
      
      patterns.forEach(pattern => {
        processedContent = processedContent.replace(pattern, `src="${firebaseUrl}"`);
      });
      
      console.log(`✅ Replaced ${imageName} with Firebase URL (fallback)`);
    });

    // Log failed images
    const failedCount = Object.keys(imageResults.failed).length;
    if (failedCount > 0) {
      console.warn(`⚠️ Failed to load ${failedCount} images from Firebase fallback:`, imageResults.failed);
    } else {
      console.log(`🎉 Successfully processed ${imagesToReplace.size} images with Firebase fallback`);
    }

    return processedContent;

  } catch (error) {
    console.error('❌ Error processing Firebase fallback images:', error);
    return htmlContent; // Return original content if everything fails
  }
}

/**
 * Validate that content files exist (placeholder for future use)
 */
export async function validateContentFiles(): Promise<boolean> {
  // Since we're using TypeScript imports, we can assume they exist if the app builds
  return true;
} 