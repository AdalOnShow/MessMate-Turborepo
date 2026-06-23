import type { Readable } from 'stream';

/**
 * Local type alias for a Multer uploaded file.
 * Mirrors the Express.Multer.File interface from @types/multer
 * but without relying on the global namespace augmentation.
 */
export interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  stream: Readable;
  destination: string;
  filename: string;
  path: string;
  buffer: Buffer;
}
