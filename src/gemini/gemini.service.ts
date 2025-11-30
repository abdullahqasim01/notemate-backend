import { Injectable, Logger } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { ConfigService } from '../config/config.service';

/**
 * Service for interacting with Google Gemini AI
 * Handles notes generation and chat interactions
 */
@Injectable()
export class GeminiService {
  private readonly logger = new Logger(GeminiService.name);
  private readonly genAI: GoogleGenerativeAI;
  private readonly model: any;

  constructor(private readonly configService: ConfigService) {
    // Initialize Gemini AI with the latest model
    this.genAI = new GoogleGenerativeAI(this.configService.geminiApiKey);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-flash-latest' });
    this.logger.log('Gemini service initialized');
  }

  /**
   * Generate clean, formatted notes from a transcript
   * @param transcript - The full transcript text
   * @returns Formatted notes as a string
   */
  async generateNotes(transcript: string): Promise<string> {
    try {
      this.logger.log('Generating notes from transcript');

      const prompt = `You are an expert note-taker. Given the following transcript, create well-organized, clear, and comprehensive notes. 

Format the notes with:
- Main topics and headings
- Key points and important details
- Action items (if any)
- Summary at the end

Make the notes easy to read and well-structured. Use bullet points and proper formatting.

Transcript:
${transcript}

Generate the notes:`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const notes = response.text();

      this.logger.log('Notes generated successfully');
      
      return notes;
    } catch (error) {
      this.logger.error('Error generating notes:', error);
      throw new Error(`Failed to generate notes: ${error.message}`);
    }
  }

  /**
   * Generate a response to a user question based on context (transcript + notes)
   * @param userMessage - The user's question
   * @param transcript - The transcript text for context
   * @param notes - The notes text for context
   * @param conversationHistory - Previous messages for context (optional)
   * @returns AI-generated response
   */
  async generateChatResponse(
    userMessage: string,
    transcript: string,
    notes: string,
    conversationHistory?: Array<{ role: string; text: string }>,
  ): Promise<string> {
    try {
      this.logger.log('Generating chat response');

      // Build conversation context
      let conversationContext = '';
      if (conversationHistory && conversationHistory.length > 0) {
        conversationContext = conversationHistory
          .map((msg) => `${msg.role}: ${msg.text}`)
          .join('\n');
      }

      const prompt = `You are a helpful AI assistant helping a user understand their recorded audio content.

Context - Transcript:
${transcript}

Context - Notes:
${notes}

${conversationContext ? `Previous conversation:\n${conversationContext}\n` : ''}
User question: ${userMessage}

Provide a helpful, accurate response based on the transcript and notes. If the question cannot be answered from the provided context, politely let the user know.

Response:`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const answer = response.text();

      this.logger.log('Chat response generated successfully');
      
      return answer;
    } catch (error) {
      this.logger.error('Error generating chat response:', error);
      throw new Error(`Failed to generate chat response: ${error.message}`);
    }
  }
}
