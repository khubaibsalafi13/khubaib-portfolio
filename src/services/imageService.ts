/**
 * Image storage service abstraction.
 * Currently supports local file reader (Base64 data URL) for zero-dependency prototyping.
 * Later will be connected to Supabase Storage bucket 'portfolio-images'
 * (folders: /projects, /client-logos, /testimonials).
 */

export const imageService = {
  /**
   * Resizes and compresses an image (especially for avatars) using HTML Canvas.
   * Keeps storage lightweight (<40KB) and avoids localStorage quota limits.
   */
  async compressAvatar(file: File, maxDim = 320, quality = 0.85): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!file.type.match(/^image\/(jpeg|jpg|png|webp)$/i)) {
        reject(new Error('Please upload a valid image file (JPG, PNG, or WebP).'));
        return;
      }

      // Max input size: 3MB
      if (file.size > 3 * 1024 * 1024) {
        reject(new Error('Image size exceeds 3MB limit.'));
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
          let width = img.width;
          let height = img.height;

          // Scale down proportionally
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

          ctx.drawImage(img, 0, 0, width, height);

          // Attempt WebP or fallback to JPEG
          let outputType = 'image/webp';
          let dataUrl = canvas.toDataURL(outputType, quality);
          if (!dataUrl.startsWith('data:image/webp')) {
            outputType = 'image/jpeg';
            dataUrl = canvas.toDataURL(outputType, quality);
          }

          resolve(dataUrl);
        } catch {
          // If canvas fails, fallback to raw reader result
          resolve(img.src);
        }
      };

      img.onerror = () => reject(new Error('Failed to decode image data.'));
      reader.readAsDataURL(file);
    });
  },

  /**
   * Uploads an image file and returns a usable URL.
   */
  async uploadImage(file: File, folder: 'projects' | 'client-logos' | 'testimonials' | 'profile' = 'projects'): Promise<string> {
    return new Promise((resolve, reject) => {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        reject(new Error('Please upload a valid image file.'));
        return;
      }

      // Max size: 4MB for localStorage safety
      if (file.size > 4 * 1024 * 1024) {
        reject(new Error('Image size exceeds 4MB limit.'));
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          console.info(`[ImageService] Uploaded to mock bucket ${folder}/:`, file.name);
          resolve(reader.result);
        } else {
          reject(new Error('Failed to read image data.'));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read image file.'));
      reader.readAsDataURL(file);
    });
  },

  /**
   * Generates a curated dark-green themed placeholder image URL for testing.
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
