import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { FirestoreService } from '../firestore/firestore.service';
import { AssemblyAIService } from '../assemblyai/assemblyai.service';
import { GeminiService } from '../gemini/gemini.service';
import { FilebaseService } from '../filebase/filebase.service';
import { ConfigService } from '../config/config.service';

/**
 * Service for processing audio jobs from the queue
 * Runs on a cron schedule to process one job at a time
 */
@Injectable()
export class JobProcessorService {
  private readonly logger = new Logger(JobProcessorService.name);
  private activeJobs = 0;
  private readonly MAX_CONCURRENT_JOBS = 5;

  constructor(
    private readonly firestoreService: FirestoreService,
    private readonly assemblyAIService: AssemblyAIService,
    private readonly geminiService: GeminiService,
    private readonly filebaseService: FilebaseService,
    private readonly configService: ConfigService,
  ) { }

  /**
   * Cron job that runs every minute to process pending jobs
   * Processes up to 5 jobs concurrently
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async processJobs() {
    this.logger.log(`Checking for jobs. Active jobs: ${this.activeJobs}`);

    if (this.activeJobs >= this.MAX_CONCURRENT_JOBS) {
      this.logger.debug('Max concurrent jobs reached, skipping...');
      return;
    }

    try {
      // Calculate available slots
      let slots = this.MAX_CONCURRENT_JOBS - this.activeJobs;

      // 1. Prioritize generating notes (heavy task)
      // We claim as many as possible up to slots
      const notesJobs = await this.firestoreService.claimGeneratingNotesJobs(slots);

      if (notesJobs.length > 0) {
        this.logger.log(`Claimed ${notesJobs.length} jobs for notes generation`);
        for (const job of notesJobs) {
          this.activeJobs++;
          // Process in background
          this.processNotesGeneration(job).finally(() => {
            this.activeJobs--;
            this.logger.debug(`Job ${job.id} notes generation finished. Active jobs: ${this.activeJobs}`);
          });
        }
      }

      slots -= notesJobs.length;

      if (slots <= 0) return;

      // 2. Process pending jobs (transcription)
      const pendingJobs = await this.firestoreService.claimPendingJobs(slots);

      if (pendingJobs.length > 0) {
        this.logger.log(`Claimed ${pendingJobs.length} jobs for transcription`);
        for (const job of pendingJobs) {
          this.activeJobs++;
          // Process in background
          this.processTranscription(job).finally(() => {
            this.activeJobs--;
            this.logger.debug(`Job ${job.id} transcription request finished. Active jobs: ${this.activeJobs}`);
          });
        }
      }

      if (notesJobs.length === 0 && pendingJobs.length === 0) {
        this.logger.debug('No jobs to process');
      }
    } catch (error) {
      this.logger.error('Error in job processor:', error);
    }
  }

  /**
   * Get job by status (helper method)
   */
  private async getJobByStatus(status: string): Promise<any | null> {
    try {
      const snapshot = await this.firestoreService['db']
        .collection('jobs')
        .where('status', '==', status)
        .limit(1)
        .get();

      if (snapshot.empty) {
        return null;
      }

      const doc = snapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data(),
      };
    } catch (error) {
      this.logger.error('Error getting job by status:', error);
      return null;
    }
  }

  /**
   * Process transcription for a job
   */
  private async processTranscription(job: any): Promise<void> {
    this.logger.log(`Processing transcription for job: ${job.id}, chat: ${job.chatId}`);

    try {
      // Lock the job by updating status to transcribing
      await this.firestoreService.updateJobStatus(job.id, 'transcribing');

      // Update chat status
      await this.firestoreService.updateChatStatus(job.chatId, 'transcribing');

      // Start transcription
      const webhookUrl = `${this.configService.webhookBaseUrl}/webhook/assemblyai`;
      const transcriptionId = await this.assemblyAIService.transcribeAudio(
        job.audioUrl,
        webhookUrl,
      );

      // Update job and chat with transcription ID
      await this.firestoreService.updateJobTranscriptionId(job.id, transcriptionId);
      await this.firestoreService.updateChat(job.chatId, {
        transcriptionId,
      });

      this.logger.log(`Transcription started: ${transcriptionId} for job: ${job.id}`);
    } catch (error) {
      this.logger.error(`Error processing transcription for job ${job.id}:`, error);

      await this.firestoreService.updateJobStatus(
        job.id,
        'failed',
        error.message,
      );

      await this.firestoreService.updateChatStatus(job.chatId, 'failed');
    }
  }

  /**
   * Process notes generation for a job (after transcription is complete)
   */
  private async processNotesGeneration(job: any): Promise<void> {
    this.logger.log(`Processing notes generation for job: ${job.id}, chat: ${job.chatId}`);

    try {
      // Update chat status
      await this.firestoreService.updateChatStatus(job.chatId, 'generating_notes');

      // Get the full transcript text
      const transcriptText = await this.assemblyAIService.getTranscript(
        job.transcriptionId,
      );

      if (!transcriptText) {
        throw new Error('Transcript text is empty');
      }

      this.logger.log(`Transcript retrieved, length: ${transcriptText.length} characters`);

      // Upload transcript to Filebase
      const transcriptUrl = await this.filebaseService.uploadTranscript(
        job.chatId,
        transcriptText,
      );

      this.logger.log(`Transcript uploaded to: ${transcriptUrl}`);

      // Generate notes using Gemini
      const notes = await this.geminiService.generateNotes(transcriptText);

      this.logger.log(`Notes generated, length: ${notes.length} characters`);

      // Upload notes to Filebase
      const notesUrl = await this.filebaseService.uploadNotes(
        job.chatId,
        notes,
      );

      this.logger.log(`Notes uploaded to: ${notesUrl}`);

      // Extract title from first line of notes (remove markdown heading symbols)
      const title = this.extractTitleFromNotes(notes);

      // Update chat with URLs, title, and status
      await this.firestoreService.updateChatWithResults(
        job.chatId,
        transcriptUrl,
        notesUrl,
      );

      // Update chat title
      if (title) {
        await this.firestoreService.updateChat(job.chatId, { title });
      }

      await this.firestoreService.updateChatStatus(job.chatId, 'done');

      // Mark job as completed
      await this.firestoreService.updateJobStatus(job.id, 'completed');

      this.logger.log(`Job ${job.id} completed successfully`);
    } catch (error) {
      this.logger.error(`Error processing notes generation for job ${job.id}:`, error);

      await this.firestoreService.updateJobStatus(
        job.id,
        'failed',
        error.message,
      );

      await this.firestoreService.updateChatStatus(job.chatId, 'failed');
    }
  }

  /**
   * Extract title from the first line of notes
   * Removes markdown heading symbols (# ## ###) and trims whitespace
   */
  private extractTitleFromNotes(notes: string): string {
    if (!notes) return '';

    // Get first non-empty line
    const lines = notes.split('\n');
    const firstLine = lines.find(line => line.trim().length > 0);

    if (!firstLine) return '';

    // Remove markdown heading symbols and trim
    const title = firstLine.replace(/^#+\s*/, '').trim();

    return title;
  }
}
