import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { JobProcessorService } from './job-processor.service';
import { FirestoreModule } from '../firestore/firestore.module';
import { AssemblyAIModule } from '../assemblyai/assemblyai.module';
import { GeminiModule } from '../gemini/gemini.module';
import { FilebaseModule } from '../filebase/filebase.module';
import { ConfigModule } from '../config/config.module';

/**
 * Module for job queue processing
 */
import { JobsController } from './jobs.controller';

/**
 * Module for job queue processing
 */
@Module({
  imports: [
    ScheduleModule.forRoot(),
    FirestoreModule,
    AssemblyAIModule,
    GeminiModule,
    FilebaseModule,
    ConfigModule,
  ],
  controllers: [JobsController],
  providers: [JobProcessorService],
  exports: [JobProcessorService],
})
export class JobsModule { }
