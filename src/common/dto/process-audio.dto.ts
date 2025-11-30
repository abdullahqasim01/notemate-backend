import { IsString, IsNotEmpty } from 'class-validator';

/**
 * DTO for processing audio
 */
export class ProcessAudioDto {
  /** File key of the uploaded audio file in Filebase */
  @IsString()
  @IsNotEmpty()
  fileKey: string;
}
