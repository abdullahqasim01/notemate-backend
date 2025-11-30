import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';

/**
 * Authentication module
 * Provides Firebase authentication services and guards
 */
@Module({
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
