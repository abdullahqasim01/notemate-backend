import { Injectable } from '@nestjs/common';

/**
 * Configuration service for accessing environment variables
 * Provides type-safe access to all required configuration values
 */
@Injectable()
export class ConfigService {
  /**
   * Get Firebase project ID from environment variables
   */
  get firebaseProjectId(): string {
    return this.getEnvVar('FIREBASE_PROJECT_ID');
  }

  /**
   * Get Firebase client email from environment variables
   */
  get firebaseClientEmail(): string {
    return this.getEnvVar('FIREBASE_CLIENT_EMAIL');
  }

  /**
   * Get Firebase private key from environment variables
   * Handles escaped newlines in the private key
   */
  get firebasePrivateKey(): string {
    const key = this.getEnvVar('FIREBASE_PRIVATE_KEY');
    // Replace escaped newlines with actual newlines
    return key.replace(/\\n/g, '\n');
  }

  /**
   * Get UploadThing token from environment variables
   */
  get uploadThingToken(): string {
    return this.getEnvVar('UPLOADTHING_TOKEN');
  }

  /**
   * Get Filebase access key ID from environment variables
   */
  get filebaseAccessKeyId(): string {
    return this.getEnvVar('FILEBASE_ACCESS_KEY_ID');
  }

  /**
   * Get Filebase secret access key from environment variables
   */
  get filebaseSecretAccessKey(): string {
    return this.getEnvVar('FILEBASE_SECRET_ACCESS_KEY');
  }

  /**
   * Get Filebase bucket name from environment variables
   */
  get filebaseBucketName(): string {
    return this.getEnvVar('FILEBASE_BUCKET_NAME');
  }

  /**
   * Get AssemblyAI API key from environment variables
   */
  get assemblyAiApiKey(): string {
    return this.getEnvVar('ASSEMBLYAI_API_KEY');
  }

  /**
   * Get AssemblyAI webhook secret from environment variables
   */
  get assemblyAiWebhookSecret(): string {
    return this.getEnvVar('ASSEMBLYAI_WEBHOOK_SECRET');
  }

  /**
   * Get Gemini API key from environment variables
   */
  get geminiApiKey(): string {
    return this.getEnvVar('GEMINI_API_KEY');
  }

  /**
   * Get the base URL for webhooks
   * Defaults to localhost in development
   */
  get webhookBaseUrl(): string {
    return process.env.WEBHOOK_BASE_URL || 'http://localhost:3000';
  }

  /**
   * Get port number for the application
   * Defaults to 3000
   */
  get port(): number {
    return parseInt(process.env.PORT || '3000', 10);
  }

  /**
   * Helper method to get environment variable or throw error if not found
   */
  private getEnvVar(key: string): string {
    const value = process.env[key];
    if (!value) {
      throw new Error(`Environment variable ${key} is not defined`);
    }
    return value;
  }
}
