import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { FirestoreService } from '../firestore/firestore.service';
import { AssemblyAIService } from '../assemblyai/assemblyai.service';
import { ConfigService } from '../config/config.service';
import { FilebaseService } from '../filebase/filebase.service';
import { Chat } from '../common/interfaces/chat.interface';

/**
 * Service for managing chats
 * Handles chat creation, retrieval, and audio processing pipeline
 */
@Injectable()
export class ChatsService {
  private readonly logger = new Logger(ChatsService.name);

  constructor(
    private readonly firestoreService: FirestoreService,
    private readonly assemblyAIService: AssemblyAIService,
    private readonly configService: ConfigService,
    private readonly filebaseService: FilebaseService,
  ) {}

  /**
   * Create a new empty chat (before audio upload)
   * @param userId - The authenticated user's ID
   * @returns The created chat with its ID
   */
  async createEmptyChat(userId: string): Promise<Chat> {
    try {
      this.logger.log(`Creating empty chat for user ${userId}`);

      // Create chat document in Firestore with pending status
      const chat = await this.firestoreService.createChat(userId, '');

      this.logger.log(`Empty chat created successfully: ${chat.id}`);
      
      return chat;
    } catch (error) {
      this.logger.error('Error creating empty chat:', error);
      throw error;
    }
  }

  /**
   * Process audio for an existing chat (called by client after upload to Filebase)
   * Creates a job in the queue for background processing
   * @param chatId - The chat ID
   * @param userId - The authenticated user's ID (for authorization)
   * @param fileKey - The Filebase file key of the uploaded audio
   */
  async processAudio(
    chatId: string,
    userId: string,
    fileKey: string,
  ): Promise<void> {
    try {
      this.logger.log(`Processing audio for chat ${chatId}, fileKey: ${fileKey}`);

      // Get and verify chat
      const chat = await this.getChat(chatId, userId);

      // Generate a presigned download URL for the audio (valid for 24 hours)
      const audioUrl = await this.filebaseService.generatePresignedDownloadUrl(
        fileKey,
        24 * 60 * 60,
      );

      // Update chat with audio URL
      await this.firestoreService.updateChat(chatId, {
        audioUrl,
        status: 'pending',
      });

      // Create a job for background processing
      await this.firestoreService.createJob(chatId, audioUrl);

      this.logger.log(`Job created for chat: ${chatId}`);
    } catch (error) {
      this.logger.error(`Error processing audio for chat ${chatId}:`, error);
      throw error;
    }
  }

  /**
   * Get chat history (simplified list with id and title)
   * @param userId - The authenticated user's ID
   * @returns Array of chat history items
   */
  async getChatHistory(
    userId: string,
  ): Promise<Array<{ id: string; title: string }>> {
    try {
      const chats = await this.firestoreService.getChatsByUserId(userId);
      
      // Map to simplified format
      return chats.map((chat) => ({
        id: chat.id,
        title: chat.title || `Chat ${chat.id.substring(0, 8)}`,
      }));
    } catch (error) {
      this.logger.error(`Error getting chat history for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Create a new chat and initiate transcription
   * @param userId - The authenticated user's ID
   * @param audioUrl - URL of the uploaded audio file
   * @returns The created chat with its ID
   */
  async createChat(userId: string, audioUrl: string): Promise<Chat> {
    try {
      this.logger.log(`Creating chat for user ${userId} with audio: ${audioUrl}`);

      // Build webhook URL
      const webhookUrl = `${this.configService.webhookBaseUrl}/webhook/assemblyai`;

      // Submit audio for transcription
      const transcriptionId = await this.assemblyAIService.transcribeAudio(
        audioUrl,
        webhookUrl,
      );

      // Create chat document in Firestore
      const chat = await this.firestoreService.createChat(
        userId,
        audioUrl,
        transcriptionId,
      );

      this.logger.log(`Chat created successfully: ${chat.id}`);
      
      return chat;
    } catch (error) {
      this.logger.error('Error creating chat:', error);
      throw error;
    }
  }

  /**
   * Get all chats for a user
   * @param userId - The authenticated user's ID
   * @returns Array of chats
   */
  async getUserChats(userId: string): Promise<Chat[]> {
    try {
      return await this.firestoreService.getChatsByUserId(userId);
    } catch (error) {
      this.logger.error(`Error getting chats for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Get a single chat by ID
   * @param chatId - The chat ID
   * @param userId - The authenticated user's ID (for authorization)
   * @returns The chat data
   * @throws NotFoundException if chat not found or doesn't belong to user
   */
  async getChat(chatId: string, userId: string): Promise<Chat> {
    try {
      const chat = await this.firestoreService.getChat(chatId);

      if (!chat) {
        throw new NotFoundException(`Chat with ID ${chatId} not found`);
      }

      // Verify the chat belongs to the user
      if (chat.userId !== userId) {
        throw new NotFoundException(`Chat with ID ${chatId} not found`);
      }

      return chat;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Error getting chat ${chatId}:`, error);
      throw error;
    }
  }

  /**
   * Get presigned download URL for transcript
   * @param chatId - The chat ID
   * @param userId - The authenticated user's ID (for authorization)
   * @returns Presigned download URL
   */
  async getTranscriptDownloadUrl(chatId: string, userId: string): Promise<string> {
    try {
      const chat = await this.getChat(chatId, userId);

      if (!chat.transcriptUrl) {
        throw new NotFoundException('Transcript not available for this chat');
      }

      // Extract key from URL (format: chatId/transcript.txt)
      const key = `${chatId}/transcript.txt`;
      
      // Generate presigned URL (valid for 1 hour)
      return await this.filebaseService.generatePresignedDownloadUrl(key, 3600);
    } catch (error) {
      this.logger.error(`Error getting transcript download URL for chat ${chatId}:`, error);
      throw error;
    }
  }

  /**
   * Get presigned download URL for notes
   * @param chatId - The chat ID
   * @param userId - The authenticated user's ID (for authorization)
   * @returns Presigned download URL
   */
  async getNotesDownloadUrl(chatId: string, userId: string): Promise<string> {
    try {
      const chat = await this.getChat(chatId, userId);

      if (!chat.notesUrl) {
        throw new NotFoundException('Notes not available for this chat');
      }

      // Extract key from URL (format: chatId/notes.txt)
      const key = `${chatId}/notes.txt`;
      
      // Generate presigned URL (valid for 1 hour)
      return await this.filebaseService.generatePresignedDownloadUrl(key, 3600);
    } catch (error) {
      this.logger.error(`Error getting notes download URL for chat ${chatId}:`, error);
      throw error;
    }
  }

  /**
   * Delete a chat and all its messages
   * @param chatId - The chat ID
   * @param userId - The authenticated user's ID (for authorization)
   */
  async deleteChat(chatId: string, userId: string): Promise<void> {
    try {
      // Verify chat exists and belongs to user
      await this.getChat(chatId, userId);

      // Delete all files from Filebase (audio, transcript, notes)
      await this.filebaseService.deleteChatFiles(chatId);

      // Delete all messages in the chat
      await this.firestoreService.deleteMessages(chatId);

      // Delete any jobs associated with the chat
      await this.firestoreService.deleteJobsByChat(chatId);

      // Delete the chat
      await this.firestoreService.deleteChat(chatId);

      this.logger.log(`Chat ${chatId} and all associated files deleted successfully`);
    } catch (error) {
      this.logger.error(`Error deleting chat ${chatId}:`, error);
      throw error;
    }
  }
}
