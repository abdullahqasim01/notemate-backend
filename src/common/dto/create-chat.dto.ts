import { IsString, IsNotEmpty } from 'class-validator';

/**
 * DTO for creating a new chat
 */
export class CreateChatDto {
  /** URL to the uploaded audio file in UploadThing */
  @IsString()
  @IsNotEmpty()
  audioUrl: string;
}
