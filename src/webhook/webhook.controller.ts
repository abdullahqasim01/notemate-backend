import {
  Controller,
  Post,
  Body,
  Headers,
  Logger,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { WebhookService } from './webhook.service';
import { Public } from '../auth/public.decorator';

/**
 * Controller for handling webhook events
 * These endpoints are public (no authentication required)
 */
@Controller('webhook')
export class WebhookController {
  private readonly logger = new Logger(WebhookController.name);

  constructor(private readonly webhookService: WebhookService) {}

  /**
   * Handle AssemblyAI webhook notifications
   * POST /webhook/assemblyai
   * 
   * This endpoint is called by AssemblyAI when transcription is complete
   * No authentication required (uses webhook secret verification)
   * 
   * @param body - Webhook payload from AssemblyAI
   * @param webhookSecret - Secret header for verification
   */
  @Post('assemblyai')
  @Public()
  @HttpCode(HttpStatus.OK)
  async handleAssemblyAIWebhook(
    @Body() body: any,
    @Headers('x-webhook-secret') webhookSecret: string,
  ): Promise<{ success: boolean }> {
    this.logger.log('Received AssemblyAI webhook');

    await this.webhookService.processAssemblyAIWebhook(body, webhookSecret);

    return { success: true };
  }
}
