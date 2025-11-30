import { SetMetadata } from '@nestjs/common';

/**
 * Decorator to mark a route as public (no authentication required)
 * Use this for webhook endpoints or other public APIs
 */
export const Public = () => SetMetadata('isPublic', true);
