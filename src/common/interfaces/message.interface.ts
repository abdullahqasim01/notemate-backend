import { Timestamp } from 'firebase-admin/firestore';

/**
 * Message role enum
 */
export type MessageRole = 'user' | 'assistant';

/**
 * Message interface representing a message document in Firestore
 */
export interface Message {
  /** Message document ID */
  id: string;
  
  /** Role of the message sender */
  role: MessageRole;
  
  /** Message text content */
  text: string;
  
  /** Timestamp when the message was created */
  createdAt: Timestamp;
}
