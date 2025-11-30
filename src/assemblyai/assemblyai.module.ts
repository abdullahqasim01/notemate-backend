import { Module } from '@nestjs/common';
import { AssemblyAIService } from './assemblyai.service';

/**
 * AssemblyAI module
 * Provides audio transcription services
 */
@Module({
  providers: [AssemblyAIService],
  exports: [AssemblyAIService],
})
export class AssemblyAIModule {}
