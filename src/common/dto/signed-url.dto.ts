import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';

/**
 * File type enum for upload
 */
export enum FileType {
  AUDIO = 'audio',
  VIDEO = 'video',
  TRANSCRIPTION = 'transcription',
  NOTES = 'notes',
}

/**
 * DTO for requesting signed upload URL
 */
export class SignedUrlRequestDto {
  /** Type of file to upload */
  @IsEnum(FileType)
  @IsNotEmpty()
  type: FileType;

  /** Optional chat ID for organizing files */
  @IsString()
  @IsOptional()
  chatId?: string;
}
