import { Timestamp } from 'firebase-admin/firestore';

/**
 * Job status types
 */
export type JobStatus = 'pending' | 'processing' | 'transcribing' | 'generating_notes' | 'completed' | 'failed';

/**
 * Job interface for audio processing queue
 */
export interface Job {
  id: string;
  chatId: string;
  audioUrl: string;
  status: JobStatus;
  attempts: number;
  transcriptionId?: string;
  error?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
