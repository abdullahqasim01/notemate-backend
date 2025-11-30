import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Logger,
} from '@nestjs/common';
import { MessagesService } from './messages.service';
import { AuthGuard } from '../auth/auth.guard';
import { GetUser } from '../auth/get-user.decorator';
import type { User } from '../common/interfaces/user.interface';
import { CreateMessageDto } from '../common/dto/create-message.dto';
import { Message } from '../common/interfaces/message.interface';

/**
 * Controller for message-related endpoints
 * All routes require authentication via Firebase JWT
 */
@Controller('chats/:chatId/messages')
@UseGuards(AuthGuard)
export class MessagesController {
  private readonly logger = new Logger(MessagesController.name);

  constructor(private readonly messagesService: MessagesService) {}

  /**
   * Create a new message (user question) and get AI response
   * POST /chats/:chatId/messages
   * 
   * @param chatId - Chat ID from URL parameter
   * @param createMessageDto - Contains user message text
   * @param user - Authenticated user from JWT
   * @returns Both user and AI messages
   */
  @Post()
  async createMessage(
    @Param('chatId') chatId: string,
    @Body() createMessageDto: CreateMessageDto,
    @GetUser() user: User,
  ): Promise<{ userMessage: Message; aiMessage: Message }> {
    this.logger.log(
      `Creating message in chat ${chatId} for user: ${user.uid}`,
    );

    const result = await this.messagesService.createMessage(
      chatId,
      user.uid,
      createMessageDto.text,
    );

    return result;
  }

  /**
   * Get all messages for a chat
   * GET /chats/:chatId/messages
   * 
   * @param chatId - Chat ID from URL parameter
   * @param user - Authenticated user from JWT
   * @returns Array of messages
   */
  @Get()
  async getMessages(
    @Param('chatId') chatId: string,
    @GetUser() user: User,
  ): Promise<Message[]> {
    this.logger.log(`Getting messages for chat ${chatId} for user: ${user.uid}`);
    return this.messagesService.getMessages(chatId, user.uid);
  }
}
