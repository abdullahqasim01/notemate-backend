import { Module, Global } from '@nestjs/common';
import { ConfigService } from './config.service';

/**
 * Global configuration module
 * Makes ConfigService available throughout the application
 * without needing to import ConfigModule in every module
 */
@Global()
@Module({
  providers: [ConfigService],
  exports: [ConfigService],
})
export class ConfigModule {}
