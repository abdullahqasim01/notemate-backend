import { Module } from '@nestjs/common';
import { FilebaseService } from './filebase.service';
import { ConfigModule } from '../config/config.module';

/**
 * Module for Filebase integration
 * Provides S3-compatible IPFS storage services
 */
@Module({
  imports: [ConfigModule],
  providers: [FilebaseService],
  exports: [FilebaseService],
})
export class FilebaseModule {}
