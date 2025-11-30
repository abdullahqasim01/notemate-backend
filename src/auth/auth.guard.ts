import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthService } from './auth.service';

/**
 * Guard to protect routes with Firebase authentication
 * Extracts JWT from Authorization header and verifies it
 * Attaches user object to request
 */
@Injectable()
export class AuthGuard implements CanActivate {
  private readonly logger = new Logger(AuthGuard.name);

  constructor(
    private readonly authService: AuthService,
    private readonly reflector: Reflector,
  ) {}

  /**
   * Validate request authentication
   * @param context - Execution context
   * @returns True if authenticated, throws UnauthorizedException otherwise
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check if route is marked as public
    const isPublic = this.reflector.get<boolean>(
      'isPublic',
      context.getHandler(),
    );

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      this.logger.warn('No authorization header found');
      throw new UnauthorizedException('No authorization header');
    }

    // Extract token from "Bearer <token>" format
    const [bearer, token] = authHeader.split(' ');

    if (bearer !== 'Bearer' || !token) {
      this.logger.warn('Invalid authorization header format');
      throw new UnauthorizedException('Invalid authorization header format');
    }

    try {
      // Verify token and attach user to request
      const user = await this.authService.verifyToken(token);
      request.user = user;
      
      return true;
    } catch (error) {
      this.logger.error('Authentication failed:', error.message);
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
