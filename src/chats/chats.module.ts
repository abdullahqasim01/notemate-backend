import { Module } from '@nestjs/common';
import { ChatsController } from './chats.controller';
import { ChatsService } from './chats.service';
import { FirestoreModule } from '../firestore/firestore.module';
import { AssemblyAIModule } from '../assemblyai/assemblyai.module';
import { FilebaseModule } from '../filebase/filebase.module';
import { AuthModule } from '../auth/auth.module';

/**
 * Chats module
 * Handles chat creation and retrieval operations
 */
@Module({
  imports: [FirestoreModule, AssemblyAIModule, FilebaseModule, AuthModule],
  controllers: [ChatsController],
  providers: [ChatsService],
  exports: [ChatsService],
})
export class ChatsModule {}
