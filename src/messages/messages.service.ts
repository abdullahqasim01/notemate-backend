import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { FirestoreService } from '../firestore/firestore.service';
import { GeminiService } from '../gemini/gemini.service';
import { FilebaseService } from '../filebase/filebase.service';
import { Message } from '../common/interfaces/message.interface';

/**
 * Service for managing messages within chats
 * Handles user questions and AI-generated responses
 */
@Injectable()
export class MessagesService {
  private readonly logger = new Logger(MessagesService.name);

  constructor(
    private readonly firestoreService: FirestoreService,
    private readonly geminiService: GeminiService,
    private readonly filebaseService: FilebaseService,
  ) {}

  /**
   * Create a user message and generate an AI response
   * @param chatId - The chat ID
   * @param userId - The authenticated user's ID (for authorization)
   * @param userText - The user's message text
   * @returns Both user and AI messages
   */
  async createMessage(
    chatId: string,
    userId: string,
    userText: string,
  ): Promise<{ userMessage: Message; aiMessage: Message }> {
    try {
      this.logger.log(`Creating message in chat ${chatId} for user ${userId}`);

      // Verify chat exists and belongs to user
      const chat = await this.firestoreService.getChat(chatId);
      if (!chat) {
        throw new NotFoundException(`Chat with ID ${chatId} not found`);
      }

      if (chat.userId !== userId) {
        throw new NotFoundException(`Chat with ID ${chatId} not found`);
      }

      // Check if chat processing is complete
      if (chat.status !== 'done' && chat.status !== 'completed') {
        throw new BadRequestException(
          'Chat is still processing. Please wait for transcription to complete.',
        );
      }

      // Check if transcript and notes are available
      if (!chat.transcriptUrl || !chat.notesUrl) {
        throw new BadRequestException(
          'Transcript or notes not available for this chat.',
        );
      }

      // Save user message
      const userMessage = await this.firestoreService.createMessage(
        chatId,
        'user',
        userText,
      );

      // Generate presigned download URLs for transcript and notes
      const transcriptKey = `${chatId}/transcript.txt`;
      const notesKey = `${chatId}/notes.txt`;
      
      const [transcriptUrl, notesUrl] = await Promise.all([
        this.filebaseService.generatePresignedDownloadUrl(transcriptKey, 3600),
        this.filebaseService.generatePresignedDownloadUrl(notesKey, 3600),
      ]);

      // Download transcript and notes for context
      const [transcript, notes] = await Promise.all([
        this.filebaseService.downloadTextFile(transcriptUrl),
        this.filebaseService.downloadTextFile(notesUrl),
      ]);

      // Get previous messages for conversation context
      const previousMessages = await this.firestoreService.getMessages(chatId);
      
      // Filter out the just-created user message and format for Gemini
      const conversationHistory = previousMessages
        .filter((msg) => msg.id !== userMessage.id)
        .map((msg) => ({
          role: msg.role,
          text: msg.text,
        }));

      // Generate AI response using Gemini
      const aiResponseText = await this.geminiService.generateChatResponse(
        userText,
        transcript,
        notes,
        conversationHistory,
      );

      // Save AI response message
      const assistantMessage = await this.firestoreService.createMessage(
        chatId,
        'assistant',
        aiResponseText,
      );

      this.logger.log(`AI response created for chat ${chatId}`);
      
      return {
        userMessage,
        aiMessage: assistantMessage,
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      this.logger.error(`Error creating message in chat ${chatId}:`, error);
      throw error;
    }
  }

  /**
   * Get all messages for a chat
   * @param chatId - The chat ID
   * @param userId - The authenticated user's ID (for authorization)
   * @returns Array of messages
   */
  async getMessages(chatId: string, userId: string): Promise<Message[]> {
    try {
      // Verify chat exists and belongs to user
      const chat = await this.firestoreService.getChat(chatId);
      if (!chat) {
        throw new NotFoundException(`Chat with ID ${chatId} not found`);
      }

      if (chat.userId !== userId) {
        throw new NotFoundException(`Chat with ID ${chatId} not found`);
      }

      return await this.firestoreService.getMessages(chatId);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Error getting messages for chat ${chatId}:`, error);
      throw error;
    }
  }
}
