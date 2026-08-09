import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';

@Injectable()
export class CloudinaryService {
  private readonly logger = new Logger(CloudinaryService.name);

  constructor(private readonly configService: ConfigService) {
    cloudinary.config({
      cloud_name: this.configService.getOrThrow<string>(
        'CLOUDINARY_CLOUD_NAME',
      ),
      api_key: this.configService.getOrThrow<string>('CLOUDINARY_API_KEY'),
      api_secret: this.configService.getOrThrow<string>(
        'CLOUDINARY_API_SECRET',
      ),
    });
  }

  /**
   * Upload a file buffer as an avatar to Cloudinary.
   * Applies face-crop transformation and stores under messmate/avatars.
   */
  async uploadAvatar(
    buffer: Buffer,
    userId: string, // eslint-disable-line @typescript-eslint/no-unused-vars
  ): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'messmate/avatars',
          transformation: [
            { width: 400, height: 400, crop: 'fill', gravity: 'face' },
            { radius: 'max' },
          ],
          resource_type: 'image',
          invalidate: true,
        },
        (error, result) => {
          if (error || !result) {
            this.logger.error('Cloudinary upload failed', error);
            reject(
              error instanceof Error
                ? error
                : new Error('Cloudinary upload returned no result'),
            );
          } else {
            resolve(result);
          }
        },
      );
      uploadStream.end(buffer);
    });
  }

  /**
   * Delete an asset from Cloudinary by its public_id.
   */
  async deleteByPublicId(publicId: string): Promise<void> {
    try {
      await cloudinary.uploader.destroy(publicId, { invalidate: true });
    } catch (error) {
      // Log but don't fail — the DB update is the source of truth
      this.logger.warn(`Failed to delete Cloudinary asset ${publicId}`, error);
    }
  }

  /**
   * Extract the Cloudinary public_id from a secure URL.
   * e.g. https://res.cloudinary.com/<cloud>/image/upload/v123/messmate/avatars/abc.png
   * returns: messmate/avatars/abc
   */
  extractPublicId(cloudinaryUrl: string): string | null {
    try {
      const url = new URL(cloudinaryUrl);
      // Path looks like: /image/upload/v<version>/<public_id>.<ext>
      const parts = url.pathname.split('/');
      // Find the index after "upload" (or after a version segment like v1234567890)
      const uploadIdx = parts.findIndex((p) => p === 'upload');
      if (uploadIdx === -1) return null;

      // Skip version segment if present (starts with 'v' followed by digits)
      let startIdx = uploadIdx + 1;
      if (/^v\d+$/.test(parts[startIdx] ?? '')) {
        startIdx++;
      }

      // Join remaining parts and strip file extension
      const withExt = parts.slice(startIdx).join('/');
      return withExt.replace(/\.[^/.]+$/, '');
    } catch {
      return null;
    }
  }
}
