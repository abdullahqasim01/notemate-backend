import { Injectable, Logger } from '@nestjs/common';
import { AssemblyAI } from 'assemblyai';
import { ConfigService } from '../config/config.service';

/**
 * Service for interacting with AssemblyAI
 * Handles audio transcription with webhook notifications
 */
@Injectable()
export class AssemblyAIService {
  private readonly logger = new Logger(AssemblyAIService.name);
  private readonly client: AssemblyAI;

  constructor(private readonly configService: ConfigService) {
    // Initialize AssemblyAI client
    this.client = new AssemblyAI({
      apiKey: this.configService.assemblyAiApiKey,
    });
    this.logger.log('AssemblyAI service initialized');
  }

  /**
   * Submit an audio file for transcription with webhook callback
   * @param audioUrl - URL of the audio file to transcribe
   * @param webhookUrl - Webhook URL to receive transcription results
   * @returns Transcription ID for tracking
   */
  async transcribeAudio(
    audioUrl: string,
    webhookUrl: string,
  ): Promise<string> {
    try {
      this.logger.log(`Starting transcription for audio: ${audioUrl}`);
      
      // Submit transcription request with webhook
      const transcript = await this.client.transcripts.submit({
        audio_url: audioUrl,
        webhook_url: webhookUrl,
        webhook_auth_header_name: 'x-webhook-secret',
        webhook_auth_header_value: this.configService.assemblyAiWebhookSecret,
      });

      this.logger.log(`Transcription submitted with ID: ${transcript.id}`);
      
      return transcript.id;
    } catch (error) {
      this.logger.error('Error submitting transcription:', error);
      throw new Error(`Failed to submit transcription: ${error.message}`);
    }
  }

  /**
   * Verify webhook signature/authentication
   * @param webhookSecret - Secret from webhook header
   * @returns True if valid, false otherwise
   */
  verifyWebhookSignature(webhookSecret: string): boolean {
    const expectedSecret = this.configService.assemblyAiWebhookSecret;
    return webhookSecret === expectedSecret;
  }

  /**
   * Get full transcription text from transcript object
   * @param transcriptId - The transcription ID
   * @returns Full transcript text
   */
  async getTranscript(transcriptId: string): Promise<string> {
    try {
      const transcript = await this.client.transcripts.get(transcriptId);
      
      if (transcript.status === 'error') {
        throw new Error(`Transcription failed: ${transcript.error}`);
      }

      if (transcript.status !== 'completed') {
        throw new Error(`Transcription not completed yet. Status: ${transcript.status}`);
      }

      return transcript.text || '';
    } catch (error) {
      this.logger.error(`Error getting transcript ${transcriptId}:`, error);
      throw new Error(`Failed to get transcript: ${error.message}`);
    }
  }
}
