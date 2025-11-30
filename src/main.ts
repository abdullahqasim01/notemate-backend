import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import { ConfigService } from './config/config.service';
import * as dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

/**
 * Bootstrap the NestJS application
 */
async function bootstrap() {
  const logger = new Logger('Bootstrap');

  // Create NestJS application
  const app = await NestFactory.create(AppModule);

  // Get configuration service
  const configService = app.get(ConfigService);

  // Enable CORS for mobile app
  app.enableCors({
    origin: true, // Allow all origins in development, restrict in production
    credentials: true,
  });

  // Enable global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip properties that don't have decorators
      forbidNonWhitelisted: true, // Throw error if non-whitelisted properties are present
      transform: true, // Automatically transform payloads to DTO instances
    }),
  );

  // Get port from config
  const port = configService.port;

  // Start the server
  await app.listen(port);

  logger.log(`🚀 Notemate Backend is running on: http://localhost:${port}`);
  logger.log(`📝 Webhook endpoint: http://localhost:${port}/webhook/assemblyai`);
  logger.log(`🔐 Firebase Auth: Enabled`);
  logger.log(`💾 Firestore: Connected`);
}

bootstrap();
