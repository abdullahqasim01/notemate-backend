import {
  Controller,
  Post,
  Query,
  UseGuards,
  Logger,
} from '@nestjs/common';
import { UploadsService } from './uploads.service';
import { AuthGuard } from '../auth/auth.guard';
import { FileType } from '../common/dto/signed-url.dto';

/**
 * Controller for upload-related endpoints
 * Handles signed URL generation for file uploads
 */
@Controller('uploads')
@UseGuards(AuthGuard)
export class UploadsController {
  private readonly logger = new Logger(UploadsController.name);

  constructor(private readonly uploadsService: UploadsService) {}

  /**
   * Generate a signed URL for file upload
   * POST /uploads/sign-url?type=audio&chatId=xyz
   * 
   * @param type - Type of file to upload
   * @param chatId - Optional chat ID
   * @returns Signed upload URL and public URL
   */
  @Post('sign-url')
  async getSignedUrl(
    @Query('type') type: string,
    @Query('chatId') chatId?: string,
  ): Promise<{ uploadUrl: string; fileKey: string; publicUrl: string }> {
    this.logger.log(`Generating signed URL for type: ${type}`);

    // Validate and convert type
    const fileType = type as FileType;
    if (!Object.values(FileType).includes(fileType)) {
      throw new Error(`Invalid file type: ${type}`);
    }

    return this.uploadsService.generateSignedUrl(fileType, chatId);
  }
}
