import { Module, Global } from '@nestjs/common';
import { FirestoreService } from './firestore.service';

/**
 * Global Firestore module
 * Provides Firestore database access throughout the application
 */
@Global()
@Module({
  providers: [FirestoreService],
  exports: [FirestoreService],
})
export class FirestoreModule {}
