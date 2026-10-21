import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  UploadTaskSnapshot,
} from 'firebase/storage';
import { storage } from './firebase';

export interface UploadResult {
  url: string;
  storageType: 'firebase' | 'base64';
  filename: string;
  size: number;
}

/**
 * Uploads a profile image to Firebase Storage under the 'profile/' folder.
 * Returns the public download URL. If Firebase Storage encounters a permission or
 * network issue, falls back gracefully to a high-fidelity local data URL so the
 * user's profile picture update is never lost.
 */
export async function uploadProfileImageToFirebase(
  file: File,
  onProgress?: (percent: number) => void
): Promise<UploadResult> {
  if (!file) {
    throw new Error('No file provided for upload.');
  }

  // Validate image file
  if (!file.type.startsWith('image/')) {
    throw new Error('Please select an image file (JPEG, PNG, WEBP).');
  }

  // Max 10MB
  if (file.size > 10 * 1024 * 1024) {
    throw new Error('Image size exceeds 10MB limit. Please choose a smaller photo.');
  }

  const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const timestamp = Date.now();
  const storagePath = `profile/nasir_profile_${timestamp}_${cleanName}`;
  const storageRef = ref(storage, storagePath);

  const metadata = {
    contentType: file.type || 'image/jpeg',
    customMetadata: {
      uploadedBy: 'admin',
      purpose: 'profile_avatar',
      timestamp: String(timestamp),
    },
  };

  try {
    return await new Promise<UploadResult>((resolve, reject) => {
      const uploadTask = uploadBytesResumable(storageRef, file, metadata);

      uploadTask.on(
        'state_changed',
        (snapshot: UploadTaskSnapshot) => {
          const progress = Math.round(
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100
          );
          if (onProgress) {
            onProgress(progress);
          }
        },
        (error) => {
          console.warn('[Firebase Storage] Direct upload error:', error);
          reject(error);
        },
        async () => {
          try {
            const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
            if (onProgress) onProgress(100);
            resolve({
              url: downloadUrl,
              storageType: 'firebase',
              filename: cleanName,
              size: file.size,
            });
          } catch (urlErr) {
            reject(urlErr);
          }
        }
      );
    });
  } catch (firebaseErr: any) {
    console.warn(
      '[Firebase Storage] Direct upload failed, falling back to local base64:',
      firebaseErr?.message || firebaseErr
    );

    // Fallback: convert file to optimized base64 data URL
    return new Promise<UploadResult>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          if (onProgress) onProgress(100);
          resolve({
            url: reader.result,
            storageType: 'base64',
            filename: cleanName,
            size: file.size,
          });
        } else {
          reject(new Error('Failed to encode image to data URL'));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read image file'));
      reader.readAsDataURL(file);
    });
  }
}
