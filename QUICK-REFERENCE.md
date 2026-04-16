# 🚀 Notemate Backend - Quick Reference

## Essential Commands

```bash
# Install dependencies
npm install

# Development (with hot-reload)
npm run start:dev

# Production build
npm run build

# Production run
npm run start:prod

# Run tests
npm run test
npm run test:e2e

# Lint & format
npm run lint
npm run format
```

## Environment Variables (Required)

```bash
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-email@project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"


ASSEMBLYAI_API_KEY=your-assemblyai-key
ASSEMBLYAI_WEBHOOK_SECRET=your-webhook-secret

GEMINI_API_KEY=your-gemini-api-key

WEBHOOK_BASE_URL=https://your-ngrok-url.ngrok.io
PORT=3000
```

## API Quick Reference

### Create Chat
```bash
POST /chats
Authorization: Bearer <firebase-token>
Body: { "audioUrl": "https://..." }
Response: { "chatId": "abc123" }
```

### List Chats
```bash
GET /chats
Authorization: Bearer <firebase-token>
Response: [{ id, userId, status, audioUrl, ... }]
```

### Get Chat
```bash
GET /chats/:chatId
Authorization: Bearer <firebase-token>
Response: { id, status, transcriptUrl, notesUrl, ... }
```

### Send Message
```bash
POST /chats/:chatId/messages
Authorization: Bearer <firebase-token>
Body: { "text": "What are the main points?" }
Response: { id, role: "assistant", text: "...", createdAt }
```

### Webhook (Public)
```bash
POST /webhook/assemblyai
Headers: x-webhook-secret: <secret>
Body: { transcript_id, status }
```

## Module Structure

```
src/
├── auth/           → Firebase authentication
├── assemblyai/     → Audio transcription
├── chats/          → Chat management
├── config/         → Environment config
├── firestore/      → Database operations
├── gemini/         → AI services
├── messages/       → Message handling
├── filebase/       → File storage (S3/Filebase)
├── webhook/        → Webhook handlers
└── common/         → Shared DTOs & interfaces
```

## Firestore Collections

```
/chats/{chatId}
  ├── userId: string
  ├── status: "processing" | "done"
  ├── audioUrl: string
  ├── transcriptUrl?: string
  ├── notesUrl?: string
  └── messages/{messageId}
      ├── role: "user" | "assistant"
      ├── text: string
      └── createdAt: Timestamp
```

## Workflow

1. Upload audio → Filebase
2. POST /chats with audioUrl
3. Backend → AssemblyAI (async)
4. AssemblyAI → Webhook callback
5. Backend → Generate notes → Upload files → Update status
6. Chat ready for questions

## Local Development Setup

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env with your credentials

# 3. Start ngrok (for webhooks)
ngrok http 3000
# Copy HTTPS URL to WEBHOOK_BASE_URL in .env

# 4. Start server
npm run start:dev

# 5. Test API
# Use api-test.http with REST Client extension
```

## Common Issues

### "Cannot find module"
→ Run: `npm install`

### "Invalid Firebase token"
→ Check Firebase credentials in .env
→ Ensure private key has \n characters

### "Webhook not working"
→ Check ngrok is running
→ Update WEBHOOK_BASE_URL in .env
→ Verify webhook secret matches

### "CORS error"
→ CORS is enabled for all origins in development
→ Configure specific origins for production

## Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov

# Manual testing
# Use api-test.http file
```

## Deployment Checklist

- [ ] Update WEBHOOK_BASE_URL to production domain
- [ ] Configure CORS with specific origins
- [ ] Set NODE_ENV=production
- [ ] Secure environment variables
- [ ] Enable HTTPS
- [ ] Set up monitoring/logging
- [ ] Test all endpoints
- [ ] Verify webhook callbacks

## Key Files

- `src/main.ts` - App bootstrap
- `src/app.module.ts` - Main module
- `.env` - Environment config
- `api-test.http` - API tests
- `SETUP-GUIDE.md` - Detailed setup
- `PROJECT-OVERVIEW.md` - Architecture

## Dependencies

**Production:**
- @nestjs/* - Framework
- firebase-admin - Auth & DB
- assemblyai - Transcription
- @google/generative-ai - AI
- @aws-sdk/client-s3 - Storage (Filebase)
- class-validator - Validation

**Dev:**
- TypeScript
- ESLint
- Prettier
- Jest

## Support Resources

1. SETUP-GUIDE.md - Step-by-step setup
2. NOTEMATE-README.md - Full documentation
3. PROJECT-OVERVIEW.md - Architecture details
4. Inline code comments - Comprehensive explanations

## Security

✅ Global Firebase Auth on all routes
✅ Webhook signature verification
✅ User authorization checks
✅ Input validation
✅ CORS protection
✅ Environment-based config

---

**Need more help?** Check the comprehensive documentation files or review the inline code comments.
