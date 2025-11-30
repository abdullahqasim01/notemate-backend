import { Module } from '@nestjs/common';
import { WebhookController } from './webhook.controller';
import { WebhookService } from './webhook.service';
import { FirestoreModule } from '../firestore/firestore.module';
import { AssemblyAIModule } from '../assemblyai/assemblyai.module';
import { GeminiModule } from '../gemini/gemini.module';
import { FilebaseModule } from '../filebase/filebase.module';

/**
 * Webhook module
 * Handles external webhook events (AssemblyAI)
 */
@Module({
  imports: [
    FirestoreModule,
    AssemblyAIModule,
    GeminiModule,
    FilebaseModule,
  ],
  controllers: [WebhookController],
  providers: [WebhookService],
})
export class WebhookModule {}
