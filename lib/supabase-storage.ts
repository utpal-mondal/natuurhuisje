import { createClient } from '@/utils/supabase/client'

export const supabase = createClient()

export interface UploadResult {
  url: string
  path: string
  error?: string
}

/**
 * Upload house images to Supabase storage
 * @param files - Array of files to upload
 * @param houseId - The house ID for folder structure
 * @param userId - The user ID for security
 * @returns Array of upload results with URLs
 */
export async function uploadHouseImages(
  files: File[],
  houseId: string,
  userId: string
): Promise<UploadResult[]> {
  console.log('uploadHouseImages called with:', { filesCount: files.length, houseId, userId });
  const results: UploadResult[] = []

  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}_${i}.${fileExt}`
    const filePath = `${userId}/${houseId}/${fileName}`

    console.log(`Uploading file ${i + 1}/${files.length}:`, fileName, 'to path:', filePath);

    try {
      const { data, error } = await supabase.storage
        .from('house-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) {
        console.error('Upload error for file', fileName, ':', error);
        results.push({
          url: '',
          path: '',
          error: error.message
        })
        continue
      }

      console.log('Upload successful for file:', fileName);

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('house-images')
        .getPublicUrl(filePath)

      results.push({
        url: publicUrl,
        path: filePath
      })
    } catch (error) {
      console.error('Exception uploading file', fileName, ':', error);
      results.push({
        url: '',
        path: '',
        error: error instanceof Error ? error.message : 'Upload failed'
      })
    }
  }

  console.log('Upload results:', results);
  return results
}

/**
 * Upload room images to Supabase storage
 * @param files - Array of files to upload
 * @param roomId - The room ID for folder structure
 * @param userId - The user ID for security
 * @returns Array of upload results with URLs
 */
export async function uploadRoomImages(
  files: File[],
  roomId: string,
  userId: string
): Promise<UploadResult[]> {
  const results: UploadResult[] = []

  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}_${i}.${fileExt}`
    const filePath = `${userId}/${roomId}/${fileName}`

    try {
      const { data, error } = await supabase.storage
        .from('room-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) {
        results.push({
          url: '',
          path: '',
          error: error.message
        })
        continue
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('room-images')
        .getPublicUrl(filePath)

      results.push({
        url: publicUrl,
        path: filePath
      })
    } catch (error) {
      results.push({
        url: '',
        path: '',
        error: error instanceof Error ? error.message : 'Upload failed'
      })
    }
  }

  return results
}

/**
 * Upload user avatar to Supabase storage
 * @param file - Avatar file to upload
 * @param userId - The user ID
 * @returns Upload result with URL
 */
export async function uploadUserAvatar(
  file: File,
  userId: string
): Promise<UploadResult> {
  const fileExt = file.name.split('.').pop()
  const fileName = `avatar.${fileExt}`
  const filePath = `${userId}/${fileName}`

  try {
    const { data, error } = await supabase.storage
      .from('user-avatars')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true // Allow overwriting avatar
      })

    if (error) {
      return {
        url: '',
        path: '',
        error: error.message
      }
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('user-avatars')
      .getPublicUrl(filePath)

    return {
      url: publicUrl,
      path: filePath
    }
  } catch (error) {
    return {
      url: '',
      path: '',
      error: error instanceof Error ? error.message : 'Upload failed'
    }
  }
}

/**
 * Delete an image from Supabase storage
 * @param bucket - Bucket name ('house-images' or 'room-images')
 * @param path - File path to delete
 * @returns Success status
 */
export async function deleteImage(
  bucket: 'house-images' | 'room-images' | 'user-avatars',
  path: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path])

    if (error) {
      return {
        success: false,
        error: error.message
      }
    }

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Delete failed'
    }
  }
}

/**
 * Validate image file before upload
 * @param file - File to validate
 * @returns Validation result
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  // Check file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'File must be JPEG, PNG, WebP, or GIF'
    }
  }

  return { valid: true }
}
