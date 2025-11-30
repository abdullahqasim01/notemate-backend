import { Injectable, Logger } from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { ConfigService } from '../config/config.service';

/**
 * Service for interacting with Filebase (S3-compatible IPFS storage)
 * Handles file uploads, presigned URLs, and file retrieval
 */
@Injectable()
export class FilebaseService {
  private readonly logger = new Logger(FilebaseService.name);
  private readonly s3Client: S3Client;
  private readonly bucketName: string;

  constructor(private readonly configService: ConfigService) {
    // Initialize S3 client for Filebase
    this.s3Client = new S3Client({
      endpoint: 'https://s3.filebase.com',
      region: 'us-east-1',
      credentials: {
        accessKeyId: this.configService.filebaseAccessKeyId,
        secretAccessKey: this.configService.filebaseSecretAccessKey,
      },
    });

    this.bucketName = this.configService.filebaseBucketName;
    this.logger.log('Filebase service initialized');
  }

  /**
   * Generate a presigned URL for uploading a file
   * @param key - File key/path in the bucket
   * @param contentType - MIME type of the file
   * @param expiresIn - URL expiration time in seconds (default: 1 hour)
   * @returns Presigned URL for PUT request
   */
  async generatePresignedUploadUrl(
    key: string,
    contentType: string,
    expiresIn: number = 3600,
  ): Promise<string> {
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        ContentType: contentType,
        ACL: 'public-read', // Make uploaded file publicly readable
      });

      const presignedUrl = await getSignedUrl(this.s3Client, command, {
        expiresIn,
      });

      this.logger.log(`Generated presigned upload URL for key: ${key}`);
      return presignedUrl;
    } catch (error) {
      this.logger.error(`Error generating presigned upload URL for ${key}:`, error);
      throw error;
    }
  }

  /**
   * Generate a presigned URL for downloading a file
   * @param key - File key/path in the bucket
   * @param expiresIn - URL expiration time in seconds (default: 1 hour)
   * @returns Presigned URL for GET request
   */
  async generatePresignedDownloadUrl(
    key: string,
    expiresIn: number = 3600,
  ): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      const presignedUrl = await getSignedUrl(this.s3Client, command, {
        expiresIn,
      });

      this.logger.log(`Generated presigned download URL for key: ${key}`);
      return presignedUrl;
    } catch (error) {
      this.logger.error(`Error generating presigned download URL for ${key}:`, error);
      throw error;
    }
  }

  /**
   * Upload a text file directly to Filebase
   * @param key - File key/path in the bucket
   * @param content - Text content to upload
   * @returns Public URL of the uploaded file
   */
  async uploadTextFile(key: string, content: string): Promise<string> {
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: content,
        ContentType: 'text/plain',
        ACL: 'public-read', // Make file publicly readable
      });

      await this.s3Client.send(command);
      this.logger.log(`Text file uploaded: ${key}`);

      // Return the public URL (or generate presigned download URL)
      return this.getPublicUrl(key);
    } catch (error) {
      this.logger.error(`Error uploading text file ${key}:`, error);
      throw error;
    }
  }

  /**
   * Upload transcript text file
   * @param chatId - The chat ID
   * @param transcriptContent - Transcript text content
   * @returns URL of the uploaded transcript file
   */
  async uploadTranscript(
    chatId: string,
    transcriptContent: string,
  ): Promise<string> {
    const key = `${chatId}/transcript.txt`;
    return this.uploadTextFile(key, transcriptContent);
  }

  /**
   * Upload notes text file
   * @param chatId - The chat ID
   * @param notesContent - Notes text content
   * @returns URL of the uploaded notes file
   */
  async uploadNotes(chatId: string, notesContent: string): Promise<string> {
    const key = `${chatId}/notes.txt`;
    return this.uploadTextFile(key, notesContent);
  }

  /**
   * Get public URL for a file
   * @param key - File key/path in the bucket
   * @returns Public URL
   */
  getPublicUrl(key: string): string {
    return `https://${this.bucketName}.s3.filebase.com/${key}`;
  }

  /**
   * Download text content from a URL
   * @param url - URL of the text file
   * @returns Text content of the file
   */
  async downloadTextFile(url: string): Promise<string> {
    try {
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const content = await response.text();
      this.logger.log(`Downloaded file from: ${url}`);

      return content;
    } catch (error) {
      this.logger.error(`Error downloading file from ${url}:`, error);
      throw new Error(`Failed to download file: ${error.message}`);
    }
  }

  /**
   * Delete a file from Filebase
   * @param key - File key/path in the bucket
   */
  async deleteFile(key: string): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      await this.s3Client.send(command);
      this.logger.log(`File deleted: ${key}`);
    } catch (error) {
      this.logger.error(`Error deleting file ${key}:`, error);
      throw error;
    }
  }

  /**
   * Delete all files in a chat folder (audio, transcript, notes)
   * @param chatId - The chat ID
   */
  async deleteChatFiles(chatId: string): Promise<void> {
    try {
      // List all objects with the chatId prefix
      const listCommand = new ListObjectsV2Command({
        Bucket: this.bucketName,
        Prefix: `${chatId}/`,
      });

      const listResponse = await this.s3Client.send(listCommand);

      if (!listResponse.Contents || listResponse.Contents.length === 0) {
        this.logger.log(`No files found for chat ${chatId}`);
        return;
      }

      // Delete all objects
      const deleteCommand = new DeleteObjectsCommand({
        Bucket: this.bucketName,
        Delete: {
          Objects: listResponse.Contents.map((obj) => ({ Key: obj.Key })),
        },
      });

      await this.s3Client.send(deleteCommand);
      this.logger.log(`Deleted ${listResponse.Contents.length} files for chat ${chatId}`);
    } catch (error) {
      this.logger.error(`Error deleting files for chat ${chatId}:`, error);
      throw error;
    }
  }
}
