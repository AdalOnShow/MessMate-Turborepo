import { BadRequestException } from '@nestjs/common';
import type { Request } from 'express';

type MulterFileFilterCallback = (error: Error | null, acceptFile: boolean) => void;

/**
 * Multer memory storage options with:
 * - memory storage (buffer available for Cloudinary upload)
 * - MIME type filter: jpeg, png, webp only
 * - 5 MB max file size
 */
export const avatarUploadOptions = {
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB
  },
  fileFilter(
    _req: Request,
    file: Express.Multer.File,
    callback: MulterFileFilterCallback,
  ) {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.mimetype)) {
      callback(
        new BadRequestException(
          `Invalid file type. Allowed types: ${allowed.join(', ')}`,
        ),
        false,
      );
    } else {
      callback(null, true);
    }
  },
};

