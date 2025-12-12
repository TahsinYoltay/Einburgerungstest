import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import ImageResizer from '@bam.tech/react-native-image-resizer';
import { firebaseAuth, firebaseStorage } from '../config/firebase';
import * as RNFS from '@dr.pogodin/react-native-fs';

export type AvatarUploadProgressCallback = (progress: number) => void;

export type AvatarUpdateResult =
  | { status: 'success'; photoURL: string }
  | { status: 'cancelled' };

export class AvatarServiceError extends Error {
  code:
    | 'not_authenticated'
    | 'permission'
    | 'picker_failed'
    | 'resize_failed'
    | 'upload_failed'
    | 'profile_update_failed'
    | 'delete_failed';

  constructor(
    code: AvatarServiceError['code'],
    message: string,
    public cause?: unknown
  ) {
    super(message);
    this.code = code;
  }
}

const AVATAR_SIZE = 512;
const AVATAR_JPEG_QUALITY = 80;
const AVATAR_UPLOAD_MAX_BYTES = 5 * 1024 * 1024;

const avatarStoragePath = (uid: string) => `user_uploads/avatars/${uid}/avatar.jpg`;

async function ensureAuthenticatedUser() {
  const user = firebaseAuth.currentUser;
  if (!user || user.isAnonymous) {
    throw new AvatarServiceError(
      'not_authenticated',
      'Avatar updates require an authenticated user.'
    );
  }
  return user;
}

async function resizeToSquareCover(inputUri: string): Promise<string> {
  try {
    const resized = await ImageResizer.createResizedImage(
      inputUri,
      AVATAR_SIZE,
      AVATAR_SIZE,
      'JPEG',
      AVATAR_JPEG_QUALITY,
      0,
      undefined,
      false,
      { mode: 'cover' }
    );
    return resized.path;
  } catch (error) {
    throw new AvatarServiceError('resize_failed', 'Failed to resize image.', error);
  }
}

async function safeUnlink(path: string) {
  try {
    const exists = await RNFS.exists(path);
    if (exists) {
      await RNFS.unlink(path);
    }
  } catch {
    // Ignore cleanup errors
  }
}

async function uploadAvatarFile(options: {
  uid: string;
  localPath: string;
  onProgress?: AvatarUploadProgressCallback;
}): Promise<string> {
  const reference = firebaseStorage.ref(avatarStoragePath(options.uid));

  try {
    const stat = await RNFS.stat(options.localPath);
    if (stat.size > AVATAR_UPLOAD_MAX_BYTES) {
      throw new AvatarServiceError(
        'upload_failed',
        'Avatar image is too large to upload.'
      );
    }
  } catch (error) {
    if (error instanceof AvatarServiceError) {
      throw error;
    }
    // Non-fatal: if stat fails, attempt upload anyway.
  }

  try {
    const task = reference.putFile(options.localPath, {
      contentType: 'image/jpeg',
      cacheControl: 'public,max-age=31536000',
    });

    if (options.onProgress) {
      task.on('state_changed', snapshot => {
        if (!snapshot.totalBytes) return;
        options.onProgress!(snapshot.bytesTransferred / snapshot.totalBytes);
      });
    }

    await task;
    return await reference.getDownloadURL();
  } catch (error) {
    throw new AvatarServiceError('upload_failed', 'Failed to upload avatar.', error);
  }
}

function withCacheBust(url: string): string {
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}v=${Date.now()}`;
}

async function setUserPhotoURL(photoURL: string | null) {
  const user = await ensureAuthenticatedUser();
  try {
    await user.updateProfile({ photoURL });
    await user.reload();
  } catch (error) {
    throw new AvatarServiceError(
      'profile_update_failed',
      'Failed to update profile photo URL.',
      error
    );
  }
}

class AvatarService {
  async updateAvatarFromLibrary(options?: {
    onProgress?: AvatarUploadProgressCallback;
  }): Promise<AvatarUpdateResult> {
    const user = await ensureAuthenticatedUser();

    const pickerResponse = await launchImageLibrary({
      mediaType: 'photo',
      selectionLimit: 1,
      includeExtra: false,
    });

    if (pickerResponse.didCancel) return { status: 'cancelled' };
    if (pickerResponse.errorCode) {
      throw new AvatarServiceError(
        pickerResponse.errorCode === 'permission' ? 'permission' : 'picker_failed',
        pickerResponse.errorMessage || 'Failed to pick an image.'
      );
    }

    const asset = pickerResponse.assets?.[0];
    const inputUri = asset?.uri;
    if (!inputUri) {
      throw new AvatarServiceError('picker_failed', 'No image was selected.');
    }

    const resizedPath = await resizeToSquareCover(inputUri);
    try {
      const downloadUrl = await uploadAvatarFile({
        uid: user.uid,
        localPath: resizedPath,
        onProgress: options?.onProgress,
      });
      const photoURL = withCacheBust(downloadUrl);
      await setUserPhotoURL(photoURL);
      return { status: 'success', photoURL };
    } finally {
      await safeUnlink(resizedPath);
    }
  }

  async updateAvatarFromCamera(options?: {
    onProgress?: AvatarUploadProgressCallback;
  }): Promise<AvatarUpdateResult> {
    const user = await ensureAuthenticatedUser();

    const pickerResponse = await launchCamera({
      mediaType: 'photo',
      saveToPhotos: false,
      cameraType: 'front',
      includeExtra: false,
    });

    if (pickerResponse.didCancel) return { status: 'cancelled' };
    if (pickerResponse.errorCode) {
      throw new AvatarServiceError(
        pickerResponse.errorCode === 'permission' ? 'permission' : 'picker_failed',
        pickerResponse.errorMessage || 'Failed to take a photo.'
      );
    }

    const asset = pickerResponse.assets?.[0];
    const inputUri = asset?.uri;
    if (!inputUri) {
      throw new AvatarServiceError('picker_failed', 'No photo was captured.');
    }

    const resizedPath = await resizeToSquareCover(inputUri);
    try {
      const downloadUrl = await uploadAvatarFile({
        uid: user.uid,
        localPath: resizedPath,
        onProgress: options?.onProgress,
      });
      const photoURL = withCacheBust(downloadUrl);
      await setUserPhotoURL(photoURL);
      return { status: 'success', photoURL };
    } finally {
      await safeUnlink(resizedPath);
    }
  }

  async removeAvatar(): Promise<void> {
    const user = await ensureAuthenticatedUser();
    const reference = firebaseStorage.ref(avatarStoragePath(user.uid));

    await setUserPhotoURL(null);

    try {
      await reference.delete();
    } catch {
      // Non-fatal: profile photoURL already cleared.
    }
  }
}

export const avatarService = new AvatarService();
