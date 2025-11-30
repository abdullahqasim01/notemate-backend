import { Module } from '@nestjs/common';
import { MessagesController } from './messages.controller';
import { MessagesService } from './messages.service';
import { FirestoreModule } from '../firestore/firestore.module';
import { GeminiModule } from '../gemini/gemini.module';
import { FilebaseModule } from '../filebase/filebase.module';
import { AuthModule } from '../auth/auth.module';

/**
 * Messages module
 * Handles message creation and chat interactions
 */
@Module({
  imports: [FirestoreModule, GeminiModule, FilebaseModule, AuthModule],
  controllers: [MessagesController],
  providers: [MessagesService],
})
export class MessagesModule {}
