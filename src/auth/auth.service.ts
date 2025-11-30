import { Injectable, Logger } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { User } from '../common/interfaces/user.interface';

/**
 * Service for Firebase authentication
 * Handles JWT token verification
 */
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  /**
   * Verify Firebase ID token and return user information
   * @param idToken - Firebase ID token from Authorization header
   * @returns User object with uid and email
   * @throws Error if token is invalid
   */
  async verifyToken(idToken: string): Promise<User> {
    try {
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      
      this.logger.debug(`Token verified for user: ${decodedToken.uid}`);

      return {
        uid: decodedToken.uid,
        email: decodedToken.email || '',
      };
    } catch (error) {
      this.logger.error('Error verifying Firebase token:', error);
      throw new Error('Invalid authentication token');
    }
  }
}
