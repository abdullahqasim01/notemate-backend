import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from './config/config.module';
import { FirestoreModule } from './firestore/firestore.module';
import { AuthModule } from './auth/auth.module';
import { AuthGuard } from './auth/auth.guard';
import { FilebaseModule } from './filebase/filebase.module';
import { AssemblyAIModule } from './assemblyai/assemblyai.module';
import { GeminiModule } from './gemini/gemini.module';
import { ChatsModule } from './chats/chats.module';
import { MessagesModule } from './messages/messages.module';
import { WebhookModule } from './webhook/webhook.module';
import { UploadsModule } from './uploads/uploads.module';
import { JobsModule } from './jobs/jobs.module';

/**
 * Main application module
 * Imports all feature modules and sets up global authentication
 */
@Module({
  imports: [
    // Global configuration
    ConfigModule,
    
    // Database
    FirestoreModule,
    
    // Authentication
    AuthModule,
    
    // External services
    FilebaseModule,
    AssemblyAIModule,
    GeminiModule,
    
    // Feature modules
    ChatsModule,
    MessagesModule,
    WebhookModule,
    UploadsModule,
    JobsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Global authentication guard
    // All routes require auth except those marked with @Public()
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
  ],
})
export class AppModule {}
