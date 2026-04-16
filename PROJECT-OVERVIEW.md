# Notemate Backend - Complete Project Overview

## 📊 Project Statistics

- **Total Modules:** 8
- **Total Services:** 8
- **Total Controllers:** 4
- **Total Interfaces:** 3
- **Total DTOs:** 3
- **Framework:** NestJS with TypeScript
- **Database:** Firestore
- **External APIs:** 4 (Firebase Auth, AssemblyAI, Gemini, Filebase)

## 🏗️ Complete Architecture

### Module Structure

```
┌─────────────────────────────────────────────────────────┐
│                    AppModule (Main)                      │
│  - Global Auth Guard                                    │
│  - CORS Enabled                                         │
│  - Validation Pipe                                      │
└─────────────────────────────────────────────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
   ┌────▼────┐      ┌─────▼─────┐     ┌─────▼─────┐
   │ Config  │      │ Firestore │     │   Auth    │
   │ Module  │      │  Module   │     │  Module   │
   │(Global) │      │ (Global)  │     └───────────┘
   └─────────┘      └───────────┘            │
                                       ┌─────▼──────┐
                                       │ AuthGuard  │
                                       │ AuthService│
                                       └────────────┘
        
   ┌──────────────────┬──────────────────┬──────────────────┐
   │                  │                  │                  │
┌──▼──────┐    ┌─────▼─────┐    ┌──────▼──────┐    ┌─────▼─────┐
│ Upload  │    │ AssemblyAI│    │   Gemini    │    │ Webhook   │
│ Thing   │    │  Module   │    │   Module    │    │  Module   │
│ Module  │    └───────────┘    └─────────────┘    └───────────┘
└─────────┘
```

### Feature Modules

```
┌──────────────┐        ┌──────────────┐
│    Chats     │◄──────►│   Messages   │
│   Module     │        │    Module    │
│              │        │              │
│ - Controller │        │ - Controller │
│ - Service    │        │ - Service    │
└──────────────┘        └──────────────┘
```

## 📁 Complete File Structure

```
notemate-backend/
├── src/
│   ├── auth/
│   │   ├── auth.module.ts              # Authentication module
│   │   ├── auth.service.ts             # Firebase token verification
│   │   ├── auth.guard.ts               # Global auth guard
│   │   ├── public.decorator.ts         # Public route decorator
│   │   └── get-user.decorator.ts       # User extraction decorator
│   │
│   ├── assemblyai/
│   │   ├── assemblyai.module.ts        # AssemblyAI module
│   │   └── assemblyai.service.ts       # Transcription service
│   │
│   ├── chats/
│   │   ├── chats.module.ts             # Chats feature module
│   │   ├── chats.controller.ts         # Chat endpoints
│   │   └── chats.service.ts            # Chat business logic
│   │
│   ├── config/
│   │   ├── config.module.ts            # Global config module
│   │   └── config.service.ts           # Environment variables
│   │
│   ├── firestore/
│   │   ├── firestore.module.ts         # Firestore module
│   │   └── firestore.service.ts        # Database operations
│   │
│   ├── gemini/
│   │   ├── gemini.module.ts            # Gemini AI module
│   │   └── gemini.service.ts           # Notes & chat generation
│   │
│   ├── messages/
│   │   ├── messages.module.ts          # Messages feature module
│   │   ├── messages.controller.ts      # Message endpoints
│   │   └── messages.service.ts         # Message business logic
│   │
│   ├── filebase/
│   │   ├── filebase.module.ts          # Filebase module
│   │   └── filebase.service.ts         # File upload/download
│   │
│   ├── webhook/
│   │   ├── webhook.module.ts           # Webhook module
│   │   ├── webhook.controller.ts       # Webhook endpoints
│   │   └── webhook.service.ts          # Webhook processing
│   │
│   ├── common/
│   │   ├── dto/
│   │   │   ├── create-chat.dto.ts      # Chat creation DTO
│   │   │   ├── create-message.dto.ts   # Message creation DTO
│   │   │   └── chat-response.dto.ts    # Chat response DTO
│   │   │
│   │   └── interfaces/
│   │       ├── user.interface.ts       # User interface
│   │       ├── chat.interface.ts       # Chat interface
│   │       └── message.interface.ts    # Message interface
│   │
│   ├── app.module.ts                   # Main application module
│   ├── app.controller.ts               # Default controller
│   ├── app.service.ts                  # Default service
│   └── main.ts                         # Application bootstrap
│
├── test/
│   ├── app.e2e-spec.ts                 # E2E tests
│   └── jest-e2e.json                   # Jest config
│
├── .env.example                        # Environment template
├── .gitignore                          # Git ignore rules
├── api-test.http                       # API testing file
├── eslint.config.mjs                   # ESLint configuration
├── nest-cli.json                       # NestJS CLI config
├── package.json                        # Dependencies
├── tsconfig.json                       # TypeScript config
├── tsconfig.build.json                 # Build TypeScript config
├── README.md                           # Original NestJS README
├── NOTEMATE-README.md                  # Notemate documentation
└── SETUP-GUIDE.md                      # Quick start guide
```

## 🔄 Data Flow

### 1. Chat Creation Flow

```
Mobile App
    │
    ├─► Upload Audio to Filebase
    │
    └─► POST /chats { audioUrl }
            │
            ├─► ChatsController
            │       ├─► AuthGuard (verify JWT)
            │       └─► ChatsService
            │               ├─► FirestoreService.createChat()
            │               │       └─► Create document with status: "processing"
            │               │
            │               └─► AssemblyAIService.transcribeAudio()
            │                       └─► Submit with webhook URL
            │
            └─► Return { chatId }
```

### 2. Webhook Processing Flow

```
AssemblyAI
    │
    └─► POST /webhook/assemblyai
            │
            ├─► WebhookController (@Public)
            │       └─► WebhookService
            │               ├─► Verify webhook secret
            │               ├─► Get transcript from AssemblyAI
            │               ├─► Generate notes with Gemini
            │               ├─► Upload transcript.txt to Filebase
            │               ├─► Upload notes.txt to Filebase
            │               └─► Update Firestore: status = "done"
            │
            └─► Return { success: true }
```

### 3. Message/Chat Flow

```
Mobile App
    │
    └─► POST /chats/:chatId/messages { text }
            │
            ├─► MessagesController
            │       ├─► AuthGuard (verify JWT)
            │       └─► MessagesService
            │               ├─► Verify chat belongs to user
            │               ├─► Check chat status is "done"
            │               ├─► Save user message
            │               ├─► Download transcript & notes
            │               ├─► Get conversation history
            │               ├─► Generate AI response with Gemini
            │               └─► Save assistant message
            │
            └─► Return assistant message
```

## 🎯 API Endpoints Summary

### Protected Endpoints (Require Auth)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/chats` | Create new chat |
| `GET` | `/chats` | List all user's chats |
| `GET` | `/chats/:chatId` | Get chat details |
| `POST` | `/chats/:chatId/messages` | Send message & get AI response |
| `GET` | `/chats/:chatId/messages` | Get all messages |

### Public Endpoints (No Auth)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/webhook/assemblyai` | AssemblyAI webhook |

## 🗄️ Firestore Schema

### Collection: `/chats/{chatId}`
```typescript
{
  userId: string                    // Firebase user ID
  status: "processing" | "done"     // Processing status
  audioUrl: string                  // Filebase audio URL
  transcriptUrl?: string            // Filebase transcript URL
  notesUrl?: string                 // Filebase notes URL
  transcriptionId?: string          // AssemblyAI ID
  createdAt: Timestamp              // Creation timestamp
}
```

### Collection: `/chats/{chatId}/messages/{messageId}`
```typescript
{
  role: "user" | "assistant"        // Message sender
  text: string                      // Message content
  createdAt: Timestamp              // Creation timestamp
}
```

## 🔐 Security Features

1. **Global Authentication:** All routes protected by default
2. **Firebase JWT Verification:** Secure token validation
3. **User Authorization:** Users can only access their own chats
4. **Webhook Verification:** Secret-based webhook authentication
5. **Input Validation:** class-validator on all DTOs
6. **CORS Protection:** Configurable CORS settings

## 🚀 Service Responsibilities

### AuthService
- Verify Firebase ID tokens
- Extract user information

### FirestoreService
- CRUD operations for chats
- CRUD operations for messages
- Query operations

### AssemblyAIService
- Submit audio for transcription
- Verify webhook signatures
- Retrieve transcript text

### GeminiService
- Generate notes from transcripts
- Generate chat responses with context

### FilebaseService
- Upload text files (transcripts, notes)
- Download text files
- File URL management

### ChatsService
- Chat creation workflow
- Chat retrieval and authorization

### MessagesService
- Message creation
- AI response generation
- Context management

### WebhookService
- Webhook verification
- Transcript processing
- Note generation workflow

## 📦 Dependencies

### Production
- `@nestjs/common`, `@nestjs/core`, `@nestjs/platform-express` - Framework
- `firebase-admin` - Firebase authentication & Firestore
- `assemblyai` - Audio transcription
- `@google/generative-ai` - Gemini AI
- `@aws-sdk/client-s3` - File storage (Filebase)
- `class-validator`, `class-transformer` - Validation

### Development
- TypeScript, ESLint, Prettier
- Jest for testing
- NestJS CLI tools

## 🎓 Key Design Patterns

1. **Dependency Injection:** All services use constructor injection
2. **Guards:** Global auth guard with decorator-based public routes
3. **DTOs:** Type-safe request/response validation
4. **Interfaces:** Strong typing for domain models
5. **Module Separation:** Feature-based module organization
6. **Service Layer:** Business logic separated from controllers
7. **Global Modules:** Shared services (Config, Firestore) available everywhere

## 🔍 Code Quality Features

- **Comprehensive Comments:** Every file, class, and method documented
- **Type Safety:** Full TypeScript coverage
- **Error Handling:** Try-catch blocks with proper logging
- **Logging:** Structured logging throughout
- **Validation:** Input validation on all endpoints
- **Modular Design:** Easy to extend and maintain

---

This architecture provides a solid foundation for the Notemate application with:
- ✅ Scalable module structure
- ✅ Comprehensive error handling
- ✅ Secure authentication
- ✅ Well-documented code
- ✅ Easy to test and maintain
