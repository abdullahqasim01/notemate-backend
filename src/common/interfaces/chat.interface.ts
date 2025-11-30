import { Timestamp } from 'firebase-admin/firestore';

/**
 * Chat status enum
 */
export type ChatStatus = 'pending' | 'processing' | 'transcribing' | 'generating_notes' | 'completed' | 'done' | 'failed';

/**
 * Chat interface representing a chat document in Firestore
 */
export interface Chat {
  /** Chat document ID */
  id: string;
  
  /** User ID who owns this chat */
  userId: string;
  
  /** Chat title (optional) */
  title?: string;
  
  /** Current status of the chat */
  status: ChatStatus;
  
  /** URL to the uploaded audio file in Filebase */
  audioUrl: string;
  
  /** URL to the generated transcript file (optional, set after processing) */
  transcriptUrl?: string;
  
  /** URL to the generated notes file (optional, set after processing) */
  notesUrl?: string;
  
  /** AssemblyAI transcription ID for tracking */
  transcriptionId?: string;
  
  /** Timestamp when the chat was created */
  createdAt: Timestamp;
}
