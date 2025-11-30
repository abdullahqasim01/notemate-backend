import { Injectable, Logger } from '@nestjs/common';
import { FilebaseService } from '../filebase/filebase.service';
import { FileType } from '../common/dto/signed-url.dto';

/**
 * Service for handling file upload operations
 */
@Injectable()
export class UploadsService {
  private readonly logger = new Logger(UploadsService.name);

  constructor(private readonly filebaseService: FilebaseService) {}

  /**
   * Generate a presigned URL for file upload using Filebase S3
   * @param type - Type of file to upload
   * @param chatId - Optional chat ID for organizing files
   * @returns Upload URL, file key, and public URL
   */
  async generateSignedUrl(
    type: FileType,
    chatId?: string,
  ): Promise<{ uploadUrl: string; fileKey: string; publicUrl: string }> {
    try {
      this.logger.log(`Generating signed URL for type: ${type}, chatId: ${chatId || 'N/A'}`);

      // Generate a unique file key
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(7);
      const extension = type === 'audio' ? '.m4a' : '.txt';
      const fileKey = chatId
        ? `${chatId}/${type}-${timestamp}-${random}${extension}`
        : `${type}-${timestamp}-${random}${extension}`;

      // Determine content type
      const contentType = type === 'audio' ? 'audio/mp4' : 'text/plain';

      // Generate presigned URL from Filebase (1 hour expiration)
      const uploadUrl = await this.filebaseService.generatePresignedUploadUrl(
        fileKey,
        contentType,
        3600,
      );

      // Get public URL
      const publicUrl = this.filebaseService.getPublicUrl(fileKey);

      this.logger.log(`Generated presigned upload URL for file: ${fileKey}`);

      return {
        uploadUrl, // Presigned URL for PUT request
        fileKey,
        publicUrl, // Public URL after upload
      };
    } catch (error) {
      this.logger.error('Error generating signed URL:', error);
      throw error;
    }
  }
}
