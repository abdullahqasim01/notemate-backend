import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { Firestore, Timestamp } from 'firebase-admin/firestore';
import { ConfigService } from '../config/config.service';
import { Chat, ChatStatus } from '../common/interfaces/chat.interface';
import { Message, MessageRole } from '../common/interfaces/message.interface';
import { Job, JobStatus } from '../common/interfaces/job.interface';

/**
 * Service for interacting with Firestore database
 * Handles all CRUD operations for chats and messages
 */
@Injectable()
export class FirestoreService implements OnModuleInit {
  private readonly logger = new Logger(FirestoreService.name);
  private db: Firestore;

  constructor(private readonly configService: ConfigService) {}

  /**
   * Initialize Firebase Admin SDK and Firestore on module initialization
   */
  async onModuleInit() {
    try {
      // Initialize Firebase Admin if not already initialized
      if (!admin.apps.length) {
        admin.initializeApp({
          credential: admin.credential.cert({
            projectId: this.configService.firebaseProjectId,
            clientEmail: this.configService.firebaseClientEmail,
            privateKey: this.configService.firebasePrivateKey,
          }),
        });
        this.logger.log('Firebase Admin initialized successfully');
      }

      this.db = admin.firestore();
      this.logger.log('Firestore connection established');
    } catch (error) {
      this.logger.error('Failed to initialize Firebase Admin:', error);
      throw error;
    }
  }

  /**
   * Create a new chat document in Firestore
   * @param userId - The Firebase user ID
   * @param audioUrl - URL to the uploaded audio file
   * @param transcriptionId - Optional AssemblyAI transcription ID
   * @returns The created chat with its ID
   */
  async createChat(
    userId: string,
    audioUrl: string,
    transcriptionId?: string,
  ): Promise<Chat> {
    try {
      const chatRef = this.db.collection('chats').doc();
      const chatData: Omit<Chat, 'id'> = {
        userId,
        status: 'processing' as ChatStatus,
        audioUrl,
        createdAt: Timestamp.now(),
        ...(transcriptionId && { transcriptionId }),
      };

      await chatRef.set(chatData);
      this.logger.log(`Chat created: ${chatRef.id} for user: ${userId}`);

      return {
        id: chatRef.id,
        ...chatData,
      };
    } catch (error) {
      this.logger.error('Error creating chat:', error);
      throw error;
    }
  }

  /**
   * Get a single chat by ID
   * @param chatId - The chat document ID
   * @returns The chat data or null if not found
   */
  async getChat(chatId: string): Promise<Chat | null> {
    try {
      const chatDoc = await this.db.collection('chats').doc(chatId).get();

      if (!chatDoc.exists) {
        return null;
      }

      return {
        id: chatDoc.id,
        ...chatDoc.data(),
      } as Chat;
    } catch (error) {
      this.logger.error(`Error getting chat ${chatId}:`, error);
      throw error;
    }
  }

  /**
   * Get all chats for a specific user
   * @param userId - The Firebase user ID
   * @returns Array of chats ordered by creation date (newest first)
   */
  async getChatsByUserId(userId: string): Promise<Chat[]> {
    try {
      const snapshot = await this.db
        .collection('chats')
        .where('userId', '==', userId)
        .get();

      // Sort in memory to avoid composite index requirement
      const chats = snapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data(),
      })) as Chat[];

      return chats.sort((a, b) => {
        const aTime = a.createdAt?.toMillis?.() || 0;
        const bTime = b.createdAt?.toMillis?.() || 0;
        return bTime - aTime; // Newest first
      });
    } catch (error) {
      this.logger.error(`Error getting chats for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Update a chat with transcript and notes URLs
   * @param chatId - The chat document ID
   * @param transcriptUrl - URL to the transcript file
   * @param notesUrl - URL to the notes file
   */
  async updateChatWithResults(
    chatId: string,
    transcriptUrl: string,
    notesUrl: string,
  ): Promise<void> {
    try {
      await this.db.collection('chats').doc(chatId).update({
        transcriptUrl,
        notesUrl,
        status: 'done' as ChatStatus,
      });

      this.logger.log(`Chat ${chatId} updated with results`);
    } catch (error) {
      this.logger.error(`Error updating chat ${chatId}:`, error);
      throw error;
    }
  }

  /**
   * Update chat status
   * @param chatId - The chat document ID
   * @param status - The new status
   */
  async updateChatStatus(chatId: string, status: ChatStatus): Promise<void> {
    try {
      await this.db.collection('chats').doc(chatId).update({ status });
      this.logger.log(`Chat ${chatId} status updated to ${status}`);
    } catch (error) {
      this.logger.error(`Error updating chat status ${chatId}:`, error);
      throw error;
    }
  }

  /**
   * Update chat fields
   * @param chatId - The chat document ID
   * @param updates - Object with fields to update
   */
  async updateChat(
    chatId: string,
    updates: Partial<Omit<Chat, 'id'>>,
  ): Promise<void> {
    try {
      await this.db.collection('chats').doc(chatId).update(updates);
      this.logger.log(`Chat ${chatId} updated with fields: ${Object.keys(updates).join(', ')}`);
    } catch (error) {
      this.logger.error(`Error updating chat ${chatId}:`, error);
      throw error;
    }
  }

  /**
   * Find a chat by transcription ID
   * @param transcriptionId - The AssemblyAI transcription ID
   * @returns The chat data or null if not found
   */
  async getChatByTranscriptionId(
    transcriptionId: string,
  ): Promise<Chat | null> {
    try {
      const snapshot = await this.db
        .collection('chats')
        .where('transcriptionId', '==', transcriptionId)
        .limit(1)
        .get();

      if (snapshot.empty) {
        return null;
      }

      const doc = snapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data(),
      } as Chat;
    } catch (error) {
      this.logger.error(
        `Error getting chat by transcription ID ${transcriptionId}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Create a new message in a chat
   * @param chatId - The chat document ID
   * @param role - The message role (user or assistant)
   * @param text - The message text
   * @returns The created message with its ID
   */
  async createMessage(
    chatId: string,
    role: MessageRole,
    text: string,
  ): Promise<Message> {
    try {
      const messageRef = this.db
        .collection('chats')
        .doc(chatId)
        .collection('messages')
        .doc();

      const messageData: Omit<Message, 'id'> = {
        role,
        text,
        createdAt: Timestamp.now(),
      };

      await messageRef.set(messageData);
      this.logger.log(
        `Message created in chat ${chatId}: ${messageRef.id} (${role})`,
      );

      return {
        id: messageRef.id,
        ...messageData,
      };
    } catch (error) {
      this.logger.error(`Error creating message in chat ${chatId}:`, error);
      throw error;
    }
  }

  /**
   * Get all messages for a chat
   * @param chatId - The chat document ID
   * @returns Array of messages ordered by creation date (oldest first)
   */
  async getMessages(chatId: string): Promise<Message[]> {
    try {
      const snapshot = await this.db
        .collection('chats')
        .doc(chatId)
        .collection('messages')
        .orderBy('createdAt', 'asc')
        .get();

      return snapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data(),
      })) as Message[];
    } catch (error) {
      this.logger.error(`Error getting messages for chat ${chatId}:`, error);
      throw error;
    }
  }

  // ============================================================================
  // JOB OPERATIONS
  // ============================================================================

  /**
   * Create a new job for audio processing
   * @param chatId - The chat ID this job belongs to
   * @param audioUrl - URL to the audio file
   * @returns The created job with its ID
   */
  async createJob(chatId: string, audioUrl: string): Promise<Job> {
    try {
      const jobRef = this.db.collection('jobs').doc();
      const jobData: Omit<Job, 'id'> = {
        chatId,
        audioUrl,
        status: 'pending' as JobStatus,
        attempts: 0,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      await jobRef.set(jobData);
      this.logger.log(`Job created: ${jobRef.id} for chat: ${chatId}`);

      return {
        id: jobRef.id,
        ...jobData,
      };
    } catch (error) {
      this.logger.error('Error creating job:', error);
      throw error;
    }
  }

  /**
   * Get a single pending job (for processing)
   * @returns The first pending job or null
   */
  async getPendingJob(): Promise<Job | null> {
    try {
      const snapshot = await this.db
        .collection('jobs')
        .where('status', '==', 'pending')
        .limit(1)
        .get();

      if (snapshot.empty) {
        return null;
      }

      const doc = snapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data(),
      } as Job;
    } catch (error) {
      this.logger.error('Error getting pending job:', error);
      throw error;
    }
  }

  /**
   * Update job status
   * @param jobId - The job ID
   * @param status - The new status
   * @param error - Optional error message if failed
   */
  async updateJobStatus(
    jobId: string,
    status: JobStatus,
    error?: string,
  ): Promise<void> {
    try {
      const updates: any = {
        status,
        updatedAt: Timestamp.now(),
      };

      if (error) {
        updates.error = error;
      }

      if (status === 'processing') {
        updates.attempts = admin.firestore.FieldValue.increment(1);
      }

      await this.db.collection('jobs').doc(jobId).update(updates);
      this.logger.log(`Job ${jobId} status updated to ${status}`);
    } catch (error) {
      this.logger.error(`Error updating job status ${jobId}:`, error);
      throw error;
    }
  }

  /**
   * Get a job by transcription ID
   * @param transcriptionId - The AssemblyAI transcription ID
   * @returns The job or null
   */
  async getJobByTranscriptionId(transcriptionId: string): Promise<Job | null> {
    try {
      const snapshot = await this.db
        .collection('jobs')
        .where('transcriptionId', '==', transcriptionId)
        .limit(1)
        .get();

      if (snapshot.empty) {
        return null;
      }

      const doc = snapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data(),
      } as Job;
    } catch (error) {
      this.logger.error('Error getting job by transcription ID:', error);
      throw error;
    }
  }

  /**
   * Update job with transcription ID
   * @param jobId - The job ID
   * @param transcriptionId - The transcription ID
   */
  async updateJobTranscriptionId(
    jobId: string,
    transcriptionId: string,
  ): Promise<void> {
    try {
      await this.db.collection('jobs').doc(jobId).update({
        transcriptionId,
        updatedAt: Timestamp.now(),
      });
      this.logger.log(`Job ${jobId} updated with transcription ID: ${transcriptionId}`);
    } catch (error) {
      this.logger.error(`Error updating job transcription ID ${jobId}:`, error);
      throw error;
    }
  }

  /**
   * Delete a chat
   * @param chatId - The chat ID
   */
  async deleteChat(chatId: string): Promise<void> {
    try {
      await this.db.collection('chats').doc(chatId).delete();
      this.logger.log(`Chat ${chatId} deleted`);
    } catch (error) {
      this.logger.error(`Error deleting chat ${chatId}:`, error);
      throw error;
    }
  }

  /**
   * Delete all messages in a chat
   * @param chatId - The chat ID
   */
  async deleteMessages(chatId: string): Promise<void> {
    try {
      const messagesSnapshot = await this.db
        .collection('chats')
        .doc(chatId)
        .collection('messages')
        .get();

      const batch = this.db.batch();
      messagesSnapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });

      await batch.commit();
      this.logger.log(`Deleted ${messagesSnapshot.size} messages from chat ${chatId}`);
    } catch (error) {
      this.logger.error(`Error deleting messages for chat ${chatId}:`, error);
      throw error;
    }
  }

  /**
   * Delete all jobs associated with a chat
   * @param chatId - The chat ID
   */
  async deleteJobsByChat(chatId: string): Promise<void> {
    try {
      const jobsSnapshot = await this.db
        .collection('jobs')
        .where('chatId', '==', chatId)
        .get();

      const batch = this.db.batch();
      jobsSnapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });

      await batch.commit();
      this.logger.log(`Deleted ${jobsSnapshot.size} jobs for chat ${chatId}`);
    } catch (error) {
      this.logger.error(`Error deleting jobs for chat ${chatId}:`, error);
      throw error;
    }
  }
}
