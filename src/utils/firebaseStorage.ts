import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  UploadTaskSnapshot,
} from 'firebase/storage';
import { doc, setDoc } from 'firebase/firestore';
import { storage, db } from './firebase';

export interface UploadResult {
  url: string;
  storageType: 'firebase' | 'server';
  filename: string;
  size: number;
}

/**
 * Directly uploads an image file to Firebase Storage without transforming it into a blob.
 * Passes the original File object directly to Firebase Storage bucket.
 * Records the photo document in Firestore under /biodata/nasir_biodata/photos/{photoId}.
 */
export async function uploadProfileImageToFirebase(
  file: File,
  onProgress?: (percent: number) => void
): Promise<UploadResult> {
  if (!file) {
    throw new Error('No file provided for upload.');
  }

  // Validate image file type
  if (!file.type.startsWith('image/')) {
    throw new Error('Please select an image file (JPEG, PNG, WEBP).');
  }

  // Max 25MB
  if (file.size > 25 * 1024 * 1024) {
    throw new Error('Image size exceeds 25MB limit. Please choose a smaller photo.');
  }

  const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const timestamp = Date.now();
  const photoId = `photo_${timestamp}`;

  const storagePath = `profile/nasir_profile_${timestamp}_${cleanName}`;
  const storageRef = ref(storage, storagePath);

  const metadata = {
    contentType: file.type || 'image/jpeg',
    customMetadata: {
      uploadedBy: 'nasir.developer.bd@gmail.com',
      purpose: 'profile_avatar',
      timestamp: String(timestamp),
    },
  };

  if (onProgress) onProgress(5);

  return new Promise<UploadResult>((resolve, reject) => {
    // Direct upload of File object to Firebase Storage
    const uploadTask = uploadBytesResumable(storageRef, file, metadata);

    uploadTask.on(
      'state_changed',
      (snapshot: UploadTaskSnapshot) => {
        if (snapshot.totalBytes > 0) {
          const percent = Math.round(
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100
          );
          if (onProgress) onProgress(percent);
        }
      },
      (error) => {
        console.error('[Firebase Storage] Direct upload error:', error);
        reject(error);
      },
      async () => {
        try {
          const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
          if (onProgress) onProgress(100);

          // Record photo document in Firestore under /biodata/nasir_biodata/photos/{photoId}
          try {
            await setDoc(doc(db, 'biodata', 'nasir_biodata', 'photos', photoId), {
              url: downloadUrl,
              storagePath,
              size: file.size,
              contentType: file.type || 'image/jpeg',
              uploadedAt: new Date().toISOString(),
              uploader: 'nasir.developer.bd@gmail.com',
            });
            console.log('[Firestore] Persisted photo record to Firestore');
          } catch (fsErr) {
            console.warn('[Firestore] Photo document record notice:', fsErr);
          }

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
}

/**
 * Uploads an image to server persistent storage as a secondary alternative
 */
export async function uploadImageToServerStorage(
  file: File,
  onProgress?: (percent: number) => void
): Promise<UploadResult> {
  if (!file) throw new Error('No file provided');

  const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const timestamp = Date.now();
  const photoId = `photo_${timestamp}`;

  if (onProgress) onProgress(30);

  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.readAsDataURL(file);
  });

  if (onProgress) onProgress(70);

  const res = await fetch('/api/upload-image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      dataUrl,
      filename: cleanName,
    }),
  });

  const data = await res.json();
  if (!res.ok || !data.success || !data.url) {
    throw new Error(data.error || 'Server image storage failed');
  }

  // Persist photo record directly in Firestore
  try {
    await setDoc(doc(db, 'biodata', 'nasir_biodata', 'photos', photoId), {
      url: data.url,
      storagePath: data.url,
      size: file.size,
      contentType: file.type || 'image/jpeg',
      uploadedAt: new Date().toISOString(),
      uploader: 'nasir.developer.bd@gmail.com',
    });
  } catch (fsErr) {
    console.warn('[Firestore] Photo record notice:', fsErr);
  }

  if (onProgress) onProgress(100);

  return {
    url: data.url,
    storageType: 'server',
    filename: data.filename || cleanName,
    size: data.size || file.size,
  };
}
