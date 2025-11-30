import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { FirestoreService } from '../firestore/firestore.service';
import { AssemblyAIService } from '../assemblyai/assemblyai.service';
import { GeminiService } from '../gemini/gemini.service';
import { FilebaseService } from '../filebase/filebase.service';

/**
 * Service for handling webhook events
 * Processes AssemblyAI transcription completion
 */
@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);

  constructor(
    private readonly firestoreService: FirestoreService,
    private readonly assemblyAIService: AssemblyAIService,
    private readonly geminiService: GeminiService,
    private readonly filebaseService: FilebaseService,
  ) {}

  /**
   * Process AssemblyAI webhook notification
   * Simply marks the job for processing - actual work done by job processor
   * @param webhookPayload - Webhook payload from AssemblyAI
   * @param webhookSecret - Secret from webhook header for verification
   */
  async processAssemblyAIWebhook(
    webhookPayload: any,
    webhookSecret: string,
  ): Promise<void> {
    try {
      // Verify webhook signature
      const isValid =
        this.assemblyAIService.verifyWebhookSignature(webhookSecret);

      if (!isValid) {
        this.logger.warn('Invalid webhook signature');
        throw new BadRequestException('Invalid webhook signature');
      }

      this.logger.log('Processing AssemblyAI webhook');

      // Extract transcription ID from webhook payload
      const transcriptId = webhookPayload.transcript_id;
      const status = webhookPayload.status;

      if (!transcriptId) {
        throw new BadRequestException('Missing transcript_id in webhook payload');
      }

      this.logger.log(`Webhook received for transcript: ${transcriptId}, status: ${status}`);

      // Only process completed transcriptions
      if (status !== 'completed') {
        this.logger.log(`Transcription ${transcriptId} is not completed yet, status: ${status}`);
        return;
      }

      // Find the job by transcription ID
      const job = await this.firestoreService.getJobByTranscriptionId(
        transcriptId,
      );

      if (!job) {
        this.logger.warn(`No job found for transcription ID: ${transcriptId}`);
        throw new BadRequestException(`Job not found for transcription ID: ${transcriptId}`);
      }

      this.logger.log(`Found job ${job.id} for transcription ${transcriptId}`);

      // Update job status to generating_notes (job processor will pick it up)
      await this.firestoreService.updateJobStatus(job.id, 'generating_notes');

      this.logger.log(`Job ${job.id} marked for notes generation`);
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error('Error processing AssemblyAI webhook:', error);
      throw error;
    }
  }
}
