# Notemate Backend

A comprehensive NestJS backend for the Notemate application, featuring audio transcription, AI-powered note generation, and intelligent chat capabilities.

## 🚀 Features

- **Firebase Authentication**: Secure JWT-based authentication using Firebase Auth
- **Audio Processing**: Automated transcription using AssemblyAI
- **AI Notes Generation**: Smart note creation using Google Gemini AI
- **Chat Interface**: Context-aware conversations about your transcripts
- **File Storage**: Reliable file storage with UploadThing
- **Real-time Updates**: Webhook-based processing pipeline

## 📋 Tech Stack

- **Framework**: NestJS (TypeScript)
- **Database**: Firestore (Firebase)
- **Authentication**: Firebase Auth (JWT verification)
- **File Storage**: UploadThing
- **Transcription**: AssemblyAI
- **AI**: Google Gemini API

## 🏗️ Architecture

### Modules

- **AuthModule**: Firebase authentication and JWT verification
- **ChatsModule**: Chat creation and management
- **MessagesModule**: Message handling and AI responses
- **WebhookModule**: AssemblyAI webhook processing
- **FirestoreModule**: Database operations
- **UploadThingModule**: File upload/download
- **AssemblyAIModule**: Audio transcription
- **GeminiModule**: AI notes generation and chat

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd notemate-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   
   Copy `.env.example` to `.env` and fill in your credentials:
   ```bash
   cp .env.example .env
   ```

   Required environment variables:
   - `FIREBASE_PROJECT_ID`: Your Firebase project ID
   - `FIREBASE_CLIENT_EMAIL`: Firebase service account email
   - `FIREBASE_PRIVATE_KEY`: Firebase service account private key
   - `UPLOADTHING_TOKEN`: UploadThing API token
   - `ASSEMBLYAI_API_KEY`: AssemblyAI API key
   - `ASSEMBLYAI_WEBHOOK_SECRET`: Secret for webhook verification
   - `GEMINI_API_KEY`: Google Gemini API key
   - `WEBHOOK_BASE_URL`: Base URL for webhooks (use ngrok for local dev)

## 🔑 Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select existing
3. Navigate to Project Settings → Service Accounts
4. Click "Generate New Private Key"
5. Copy the values to your `.env` file

## 🛠️ Development

Start the development server with hot-reload:

```bash
npm run start:dev
```

The server will start on `http://localhost:3000`

### Local Webhook Testing

For local development, use [ngrok](https://ngrok.com/) to expose your local server:

```bash
ngrok http 3000
```

Update `WEBHOOK_BASE_URL` in `.env` with your ngrok URL.

## 📡 API Endpoints

### Authentication
All endpoints (except webhooks) require `Authorization: Bearer <firebase-token>` header.

### Chats
- `POST /chats` - Create new chat with audio URL
- `GET /chats` - Get all chats for authenticated user
- `GET /chats/:chatId` - Get specific chat details

### Messages
- `POST /chats/:chatId/messages` - Send message and get AI response
- `GET /chats/:chatId/messages` - Get all messages in a chat

### Webhooks (Public)
- `POST /webhook/assemblyai` - AssemblyAI transcription webhook

## 🔄 Workflow

1. **User uploads audio** → Mobile app uploads to UploadThing
2. **Create chat** → POST `/chats` with audioUrl
3. **Backend submits to AssemblyAI** → Transcription starts
4. **Webhook notification** → AssemblyAI calls `/webhook/assemblyai`
5. **Process results**:
   - Download transcript from AssemblyAI
   - Generate notes using Gemini
   - Upload both to UploadThing
   - Update Firestore with URLs
   - Set status to "done"
6. **User can chat** → Ask questions about the transcript

## 📁 Project Structure

```
src/
├── auth/                 # Authentication (Firebase Auth Guard)
├── assemblyai/          # AssemblyAI service
├── chats/               # Chat management
├── config/              # Configuration service
├── firestore/           # Firestore database operations
├── gemini/              # Gemini AI service
├── messages/            # Message handling
├── uploadthing/         # File storage
├── webhook/             # Webhook handlers
├── common/              # Shared DTOs and interfaces
├── app.module.ts        # Main application module
└── main.ts              # Application bootstrap
```

## 🔐 Security

- All API routes protected by Firebase Auth Guard
- Webhook endpoints use secret verification
- Input validation using class-validator
- CORS enabled (configure for production)

## 🧪 Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## 🚢 Production Deployment

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Start production server**
   ```bash
   npm run start:prod
   ```

3. **Environment considerations**:
   - Set proper `WEBHOOK_BASE_URL` to your production domain
   - Configure CORS with specific origins
   - Use secure Firebase credentials storage
   - Enable HTTPS

## 📝 Error Handling

The application includes comprehensive error handling:
- `401 Unauthorized` - Invalid or missing authentication
- `404 Not Found` - Chat or resource not found
- `400 Bad Request` - Invalid webhook signature or malformed data
- `500 Internal Server Error` - Service failures (Gemini, AssemblyAI, UploadThing)

## 🤝 Contributing

Contributions are welcome! Please follow these steps:
1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a pull request

## 📄 License

UNLICENSED - Private use only

## 🆘 Support

For issues and questions:
- Check the comprehensive inline code comments
- Review the API documentation above
- Contact the development team

---

Built with ❤️ using NestJS
