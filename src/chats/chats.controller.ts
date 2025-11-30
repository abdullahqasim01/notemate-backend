import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Logger,
} from '@nestjs/common';
import { ChatsService } from './chats.service';
import { AuthGuard } from '../auth/auth.guard';
import { GetUser } from '../auth/get-user.decorator';
import type { User } from '../common/interfaces/user.interface';
import { ChatResponseDto } from '../common/dto/chat-response.dto';
import { ProcessAudioDto } from '../common/dto/process-audio.dto';
import { Chat } from '../common/interfaces/chat.interface';

/**
 * Controller for chat-related endpoints
 * All routes require authentication via Firebase JWT
 */
@Controller('chats')
@UseGuards(AuthGuard)
export class ChatsController {
  private readonly logger = new Logger(ChatsController.name);

  constructor(private readonly chatsService: ChatsService) {}

  /**
   * Create a new chat (empty, before audio upload)
   * POST /chats
   * 
   * @param user - Authenticated user from JWT
   * @returns Chat ID of the created chat
   */
  @Post()
  async createChat(
    @GetUser() user: User,
  ): Promise<ChatResponseDto> {
    this.logger.log(`Creating chat for user: ${user.uid}`);

    const chat = await this.chatsService.createEmptyChat(user.uid);

    return { chatId: chat.id };
  }

  /**
   * Process audio for a chat (start transcription and notes generation)
   * POST /chats/:chatId/process-audio
   * 
   * Client calls this after successfully uploading audio to Filebase
   * 
   * @param chatId - Chat ID from URL parameter
   * @param processAudioDto - Contains fileKey of uploaded audio
   * @param user - Authenticated user from JWT
   * @returns Success status
   */
  @Post(':chatId/process-audio')
  async processAudio(
    @Param('chatId') chatId: string,
    @Body() processAudioDto: ProcessAudioDto,
    @GetUser() user: User,
  ): Promise<{ success: boolean; message?: string }> {
    this.logger.log(`Processing audio for chat ${chatId}, fileKey: ${processAudioDto.fileKey}`);

    await this.chatsService.processAudio(
      chatId,
      user.uid,
      processAudioDto.fileKey,
    );

    return { success: true, message: 'Audio processing started' };
  }

  /**
   * Get chat history (list of chats with id and title only)
   * GET /chats/history
   * 
   * @param user - Authenticated user from JWT
   * @returns Array of chat history items
   */
  @Get('history')
  async getChatHistory(
    @GetUser() user: User,
  ): Promise<Array<{ id: string; title: string }>> {
    this.logger.log(`Getting chat history for user: ${user.uid}`);
    return this.chatsService.getChatHistory(user.uid);
  }

  /**
   * Get all chats for the authenticated user
   * GET /chats
   * 
   * @param user - Authenticated user from JWT
   * @returns Array of chats
   */
  @Get()
  async getChats(@GetUser() user: User): Promise<Chat[]> {
    this.logger.log(`Getting chats for user: ${user.uid}`);
    return this.chatsService.getUserChats(user.uid);
  }

  /**
   * Get a specific chat by ID
   * GET /chats/:chatId
   * 
   * @param chatId - Chat ID from URL parameter
   * @param user - Authenticated user from JWT
   * @returns Chat details including transcript and notes URLs
   */
  @Get(':chatId')
  async getChat(
    @Param('chatId') chatId: string,
    @GetUser() user: User,
  ): Promise<Chat> {
    this.logger.log(`Getting chat ${chatId} for user: ${user.uid}`);
    return this.chatsService.getChat(chatId, user.uid);
  }

  /**
   * Get download URL for transcript
   * GET /chats/:chatId/transcript/download
   * 
   * @param chatId - Chat ID from URL parameter
   * @param user - Authenticated user from JWT
   * @returns Presigned download URL for transcript
   */
  @Get(':chatId/transcript/download')
  async getTranscriptDownloadUrl(
    @Param('chatId') chatId: string,
    @GetUser() user: User,
  ): Promise<{ downloadUrl: string }> {
    this.logger.log(`Getting transcript download URL for chat ${chatId}`);
    const downloadUrl = await this.chatsService.getTranscriptDownloadUrl(chatId, user.uid);
    return { downloadUrl };
  }

  /**
   * Get download URL for notes
   * GET /chats/:chatId/notes/download
   * 
   * @param chatId - Chat ID from URL parameter
   * @param user - Authenticated user from JWT
   * @returns Presigned download URL for notes
   */
  @Get(':chatId/notes/download')
  async getNotesDownloadUrl(
    @Param('chatId') chatId: string,
    @GetUser() user: User,
  ): Promise<{ downloadUrl: string }> {
    this.logger.log(`Getting notes download URL for chat ${chatId}`);
    const downloadUrl = await this.chatsService.getNotesDownloadUrl(chatId, user.uid);
    return { downloadUrl };
  }

  /**
   * Delete a chat
   * DELETE /chats/:chatId
   * 
   * @param chatId - Chat ID from URL parameter
   * @param user - Authenticated user from JWT
   * @returns Success status
   */
  @Delete(':chatId')
  async deleteChat(
    @Param('chatId') chatId: string,
    @GetUser() user: User,
  ): Promise<{ success: boolean }> {
    this.logger.log(`Deleting chat ${chatId} for user: ${user.uid}`);
    await this.chatsService.deleteChat(chatId, user.uid);
    return { success: true };
  }
}
