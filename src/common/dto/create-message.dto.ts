import { IsString, IsNotEmpty } from 'class-validator';

/**
 * DTO for creating a new message in a chat
 */
export class CreateMessageDto {
  /** Message text from the user */
  @IsString()
  @IsNotEmpty()
  text: string;
}
