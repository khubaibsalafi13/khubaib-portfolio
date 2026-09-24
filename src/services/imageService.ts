import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

/**
 * Image storage & optimization service.
 * Supports automated client-side WebP compression, aspect-constrained resizing,
 * and direct upload to Supabase Storage bucket 'portfolio-images'.
 * 
 * Target Folders:
 *   - hero/
 *   - projects/
 *   - gallery/
 *   - client-logos/
 */

export interface ImageOptimizationProfile {
  maxDimension: number;
  quality: number;
  format: 'image/webp' | 'image/png' | 'original';
  folder: 'hero' | 'projects' | 'gallery' | 'client-logos';
}

export const IMAGE_PROFILES: Record<'hero' | 'projectCover' | 'projectGallery' | 'clientLogo', ImageOptimizationProfile> = {
  hero: {
    maxDimension: 1600,
    quality: 0.86,
    format: 'image/webp',
    folder: 'hero',
  },
  projectCover: {
    maxDimension: 1600,
    quality: 0.85,
    format: 'image/webp',
    folder: 'projects',
  },
  projectGallery: {
    maxDimension: 1800,
    quality: 0.85,
    format: 'image/webp',
    folder: 'gallery',
  },
  clientLogo: {
    maxDimension: 800,
    quality: 0.90,
    format: 'image/webp',
    folder: 'client-logos',
  },
};

const BUCKET_NAME = 'portfolio-images';

export const imageService = {
  /**
   * Resizes and compresses an avatar image using HTML Canvas.
   * Preserved for Testimonials to keep them lightweight (<35KB).
   */
  async compressAvatar(file: File, maxDim = 360, quality = 0.85): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!file.type.match(/^image\/(jpeg|jpg|png|webp)$/i)) {
        reject(new Error('Please upload a valid image file (JPG, PNG, or WebP).'));
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        reject(new Error('Avatar image size exceeds 5MB limit.'));
        return;
      }

      const img = new Image();
      const reader = new FileReader();

      reader.onload = (e) => {
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('Failed to read image file.'));

      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          let width = img.naturalWidth || img.width;
          let height = img.naturalHeight || img.height;

          // Proportional downscale
          if (width > height) {
            if (width > maxDim) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            }
          } else {
            if (height > maxDim) {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(img.src);
            return;
          }

          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);

          let outputType = 'image/webp';
          let dataUrl = canvas.toDataURL(outputType, quality);
          if (!dataUrl.startsWith('data:image/webp')) {
            outputType = 'image/jpeg';
            dataUrl = canvas.toDataURL(outputType, quality);
          }

          resolve(dataUrl);
        } catch {
          resolve(img.src);
        }
      };

      img.onerror = () => reject(new Error('Failed to decode image data.'));
      reader.readAsDataURL(file);
    });
  },

  /**
   * Optimizes a raster image file to WebP (preserving transparency or scaling down)
   * or keeps SVG untouched.
   */
  async optimizeFile(file: File, profile: ImageOptimizationProfile): Promise<{ blob: Blob; mimeType: string; extension: string }> {
    // 1. Keep SVG vectors untouched for razor-sharp logos
    if (file.type === 'image/svg+xml' || file.name.toLowerCase().endsWith('.svg')) {
      return {
        blob: file,
        mimeType: 'image/svg+xml',
        extension: 'svg',
      };
    }

    if (!file.type.startsWith('image/')) {
      throw new Error('Selected file is not a valid image.');
    }

    // 2. Decode image using HTML5 Image
    return new Promise((resolve, reject) => {
      const objectUrl = URL.createObjectURL(file);
      const img = new Image();

      img.onload = () => {
        try {
          URL.revokeObjectURL(objectUrl);

          let width = img.naturalWidth || img.width;
          let height = img.naturalHeight || img.height;
          const maxDim = profile.maxDimension;

          // Downscale only if larger than target profile
          if (width > maxDim || height > maxDim) {
            if (width >= height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            throw new Error('Canvas 2D context unavailable.');
          }

          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);

          // Attempt WebP export
          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve({
                  blob,
                  mimeType: 'image/webp',
                  extension: 'webp',
                });
              } else {
                // Fallback to JPEG if WebP export is unsupported
                canvas.toBlob(
                  (fallbackBlob) => {
                    if (fallbackBlob) {
                      resolve({
                        blob: fallbackBlob,
                        mimeType: 'image/jpeg',
                        extension: 'jpg',
                      });
                    } else {
                      reject(new Error('Failed to encode optimized image blob.'));
                    }
                  },
                  'image/jpeg',
                  profile.quality
                );
              }
            },
            'image/webp',
            profile.quality
          );
        } catch (err) {
          URL.revokeObjectURL(objectUrl);
          reject(err);
        }
      };

      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error('Failed to load image for optimization.'));
      };

      img.src = objectUrl;
    });
  },

  /**
   * General pipeline: Optimizes an image and uploads to Supabase Storage 'portfolio-images' bucket.
   * Returns a persistent CDN URL.
   */
  async optimizeAndUpload(file: File, profile: ImageOptimizationProfile): Promise<string> {
    // 1. Optimize client-side
    const { blob, mimeType, extension } = await this.optimizeFile(file, profile);

    // 2. Build unique object key
    const sanitizedBase = file.name
      .replace(/\.[^/.]+$/, '')
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .toLowerCase()
      .slice(0, 40);
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 7);
    const filePath = `${profile.folder}/${timestamp}_${sanitizedBase}_${randomSuffix}.${extension}`;

    // 3. Upload to Supabase Storage if configured
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(filePath, blob, {
          contentType: mimeType,
          cacheControl: '31536000', // 1-year immutable cache
          upsert: false,
        });

      if (error) {
        console.error('[ImageService] Supabase Storage upload error:', error);
        throw new Error(
          `Supabase Storage upload failed: ${error.message}. Please ensure the '${BUCKET_NAME}' bucket exists with public read policy.`
        );
      }

      const { data: publicUrlData } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(filePath);

      console.info(`[ImageService] Uploaded optimized ${profile.folder} image:`, publicUrlData.publicUrl);
      return publicUrlData.publicUrl;
    }

    // 4. Fallback for offline dev / prototype environment without Supabase credentials
    console.warn('[ImageService] Supabase not configured. Falling back to local WebP data URL.');
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Failed to read fallback data URL.'));
      reader.readAsDataURL(blob);
    });
  },

  /**
   * Hero Image: 1600px max, WebP ~0.86
   */
  async uploadHeroImage(file: File): Promise<string> {
    return this.optimizeAndUpload(file, IMAGE_PROFILES.hero);
  },

  /**
   * Project Cover: 1600px max, WebP ~0.85
   */
  async uploadProjectCover(file: File): Promise<string> {
    return this.optimizeAndUpload(file, IMAGE_PROFILES.projectCover);
  },

  /**
   * Project Gallery: 1800px max, WebP ~0.85
   */
  async uploadProjectGalleryImage(file: File): Promise<string> {
    return this.optimizeAndUpload(file, IMAGE_PROFILES.projectGallery);
  },

  /**
   * Client Logo: 800px max, WebP or SVG with transparency
   */
  async uploadClientLogo(file: File): Promise<string> {
    return this.optimizeAndUpload(file, IMAGE_PROFILES.clientLogo);
  },

  /**
   * Safely deletes an old replaced object from Supabase Storage.
   * Only deletes if the URL belongs to 'portfolio-images' and Supabase is active.
   */
  async deleteStorageFile(fileUrl?: string): Promise<boolean> {
    if (!fileUrl || !isSupabaseConfigured() || !fileUrl.startsWith('http')) {
      return false;
    }

    try {
      const marker = `/storage/v1/object/public/${BUCKET_NAME}/`;
      const index = fileUrl.indexOf(marker);
      if (index === -1) return false;

      const relativePath = fileUrl.substring(index + marker.length);
      if (!relativePath) return false;

      const { error } = await supabase.storage
        .from(BUCKET_NAME)
        .remove([decodeURIComponent(relativePath)]);

      if (error) {
        console.warn('[ImageService] Failed to delete old storage file:', error.message);
        return false;
      }

      console.info('[ImageService] Deleted old storage object:', relativePath);
      return true;
    } catch (err) {
      console.warn('[ImageService] Storage cleanup skipped:', err);
      return false;
    }
  },

  /**
   * Backwards-compatible generic uploader.
   */
  async uploadImage(
    file: File,
    folder: 'projects' | 'client-logos' | 'testimonials' | 'profile' = 'projects'
  ): Promise<string> {
    switch (folder) {
      case 'profile':
        return this.uploadHeroImage(file);
      case 'client-logos':
        return this.uploadClientLogo(file);
      case 'testimonials':
        return this.compressAvatar(file, 360, 0.85);
      case 'projects':
      default:
        return this.uploadProjectCover(file);
    }
  },

  /**
   * Curated sample presets for project cards.
   */
  getPresetSample(category: string): string {
    const presets: Record<string, string> = {
      branding: 'https://images.unsplash.com/photo-1626785774573-4b799315345d?auto=format&fit=crop&w=1200&q=80',
      graphic: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=1200&q=80',
      digital: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
      ui: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=1200&q=80',
    };
    return presets[category] || presets.branding;
  },
};
