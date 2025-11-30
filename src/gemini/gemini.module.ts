import { Module } from '@nestjs/common';
import { GeminiService } from './gemini.service';

/**
 * Gemini module
 * Provides AI-powered notes generation and chat services
 */
@Module({
  providers: [GeminiService],
  exports: [GeminiService],
})
export class GeminiModule {}
