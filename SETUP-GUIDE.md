# Notemate Backend - Quick Start Guide

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v18 or higher)
- **npm** (v9 or higher)
- **Git**

## 🚀 Setup Instructions

### Step 1: Install Dependencies

```bash
npm install
```

This will install all required packages including:
- Firebase Admin SDK
- AssemblyAI SDK
- Google Generative AI (Gemini)
- UploadThing
- NestJS dependencies

### Step 2: Configure Environment Variables

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Fill in your credentials in `.env`:

   **Firebase Configuration:**
   - Get these from [Firebase Console](https://console.firebase.google.com/)
   - Go to Project Settings → Service Accounts
   - Click "Generate New Private Key"
   - Copy the values to your `.env` file

   **UploadThing:**
   - Sign up at [UploadThing](https://uploadthing.com/)
   - Get your API token from the dashboard

   **AssemblyAI:**
   - Sign up at [AssemblyAI](https://www.assemblyai.com/)
   - Get your API key from the dashboard
   - Create a webhook secret (any random string)

   **Gemini AI:**
   - Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Generate an API key

### Step 3: Set Up Local Webhook URL

For local development, you need to expose your local server to the internet so AssemblyAI can send webhooks:

1. Install ngrok (if not already installed):
   ```bash
   npm install -g ngrok
   ```

2. In a separate terminal, run:
   ```bash
   ngrok http 3000
   ```

3. Copy the HTTPS URL (e.g., `https://abc123.ngrok.io`)

4. Update `WEBHOOK_BASE_URL` in your `.env` file:
   ```
   WEBHOOK_BASE_URL=https://abc123.ngrok.io
   ```

### Step 4: Start the Development Server

```bash
npm run start:dev
```

The server will start on `http://localhost:3000`

You should see:
```
🚀 Notemate Backend is running on: http://localhost:3000
📝 Webhook endpoint: http://localhost:3000/webhook/assemblyai
🔐 Firebase Auth: Enabled
💾 Firestore: Connected
```

## 🧪 Testing the API

### Using the HTTP file

The project includes an `api-test.http` file for testing endpoints with VS Code REST Client extension.

1. Install the REST Client extension in VS Code
2. Open `api-test.http`
3. Update the variables:
   - `@authToken` - Your Firebase ID token
   - `@chatId` - A valid chat ID
4. Click "Send Request" above each endpoint

### Manual Testing with cURL

1. **Create a Chat:**
   ```bash
   curl -X POST http://localhost:3000/chats \
     -H "Authorization: Bearer YOUR_FIREBASE_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"audioUrl": "https://utfs.io/f/your-audio.mp3"}'
   ```

2. **Get All Chats:**
   ```bash
   curl -X GET http://localhost:3000/chats \
     -H "Authorization: Bearer YOUR_FIREBASE_TOKEN"
   ```

## 📚 API Workflow

### Complete Flow Example:

1. **User uploads audio** (via mobile app to UploadThing)
2. **Create chat** with the audio URL
3. **Backend processes:**
   - Creates Firestore document
   - Submits to AssemblyAI
   - Returns chat ID
4. **AssemblyAI processes** the audio
5. **Webhook callback** to `/webhook/assemblyai`
6. **Backend completes:**
   - Gets transcript
   - Generates notes with Gemini
   - Uploads both to UploadThing
   - Updates Firestore with URLs
7. **User can now:**
   - View transcript and notes
   - Ask questions via chat

## 🔧 Troubleshooting

### Issue: "Cannot find module 'firebase-admin'"
**Solution:** Run `npm install`

### Issue: "Error verifying Firebase token"
**Solution:** 
- Ensure Firebase credentials are correct in `.env`
- Check that private key has proper newlines (`\n`)
- Verify the token is a valid Firebase ID token

### Issue: "Webhook not receiving callbacks"
**Solution:**
- Ensure ngrok is running
- Update `WEBHOOK_BASE_URL` with correct ngrok URL
- Check AssemblyAI webhook secret matches

### Issue: "UploadThing upload fails"
**Solution:**
- Verify `UPLOADTHING_TOKEN` is correct
- Check UploadThing dashboard for errors

## 📁 Project Structure

```
notemate-backend/
├── src/
│   ├── auth/               # Firebase authentication
│   ├── assemblyai/         # Audio transcription
│   ├── chats/              # Chat management
│   ├── config/             # Configuration
│   ├── firestore/          # Database operations
│   ├── gemini/             # AI services
│   ├── messages/           # Message handling
│   ├── uploadthing/        # File storage
│   ├── webhook/            # Webhook handlers
│   ├── common/             # Shared code
│   ├── app.module.ts       # Main module
│   └── main.ts             # Bootstrap
├── .env.example            # Environment template
├── package.json            # Dependencies
├── tsconfig.json           # TypeScript config
└── README.md               # Documentation
```

## 🎯 Next Steps

1. Set up Firebase Authentication in your mobile app
2. Configure UploadThing for audio uploads
3. Test the complete workflow end-to-end
4. Deploy to production (see deployment section in main README)

## 📞 Support

For issues:
1. Check the comprehensive inline code comments
2. Review error messages in console
3. Verify all environment variables
4. Check service dashboards (Firebase, AssemblyAI, etc.)

---

Happy coding! 🎉
