/**
 * User interface representing authenticated Firebase user
 * Attached to request object after successful authentication
 */
export interface User {
  /** Firebase user ID */
  uid: string;
  
  /** User's email address */
  email: string;
}
