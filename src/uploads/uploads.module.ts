import { Module } from '@nestjs/common';
import { UploadsController } from './uploads.controller';
import { UploadsService } from './uploads.service';
import { FilebaseModule } from '../filebase/filebase.module';
import { AuthModule } from '../auth/auth.module';

/**
 * Uploads module
 * Handles signed URL generation for file uploads
 */
@Module({
  imports: [FilebaseModule, AuthModule],
  controllers: [UploadsController],
  providers: [UploadsService],
})
export class UploadsModule {}
