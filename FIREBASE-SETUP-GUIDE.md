# Firebase Setup Guide

This guide will help you configure Firebase for the Fact Family Math App.

## Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" or select an existing project
3. Follow the prompts to create your project (you can disable Google Analytics if not needed)

## Step 2: Register Your Web App

1. In the Firebase Console, click on the **Web icon** (`</>`) to add a web app
2. Give your app a nickname (e.g., "Fact Family Math App")
3. **Do NOT check** "Also set up Firebase Hosting" (we're using Vercel)
4. Click "Register app"

## Step 3: Get Your Firebase Configuration

After registering, you'll see a code snippet with your Firebase configuration. It looks like this:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123..."
};
```

**Copy these values** - you'll need them in the next step.

## Step 4: Enable Authentication

1. In the Firebase Console, go to **Authentication** from the left sidebar
2. Click "Get started"
3. Go to the **Sign-in method** tab
4. Enable **Anonymous** authentication:
   - Click on "Anonymous"
   - Toggle the "Enable" switch
   - Click "Save"

## Step 5: Set Up Firebase Storage

1. In the Firebase Console, go to **Storage** from the left sidebar
2. Click "Get started"
3. Review the security rules (we'll customize them next)
4. Select a location closest to your users
5. Click "Done"

### Configure Firebase Storage Security Rules

1. Go to the **Rules** tab in Storage
2. Replace the default rules with these:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Allow authenticated users to read and write audio files
    match /artifacts/{appId}/audio/{fileName} {
      allow read: if request.auth != null;
      allow write: if request.auth != null
                   && request.resource.size < 10 * 1024 * 1024
                   && request.resource.contentType.matches('audio/.*');
    }
  }
}
```

3. Click **Publish**

**What these rules do:**
- Allow authenticated users (including anonymous) to read and write audio files
- Store audio in the path: `artifacts/{appId}/audio/`
- Limit file uploads to 10MB max size and audio formats only
- Each audio file is named like `add_2_3_q.webm`, `add_2_3_a.webm`, etc.

### Optional: Enable Public Read Access (Recommended)

For better reliability and to eliminate token expiration issues entirely, you can make audio files publicly readable:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Public read, authenticated write
    match /artifacts/{appId}/audio/{fileName} {
      allow read: if true;  // Anyone can read
      allow write: if request.auth != null
                   && request.resource.size < 10 * 1024 * 1024
                   && request.resource.contentType.matches('audio/.*');
    }
  }
}
```

**Benefits of public read access:**
- No token expiration issues
- Faster loading (no authentication required)
- Better caching
- Lower Firebase costs (no auth overhead)

## Step 6: Set Up Firestore Database (Optional)

**Note:** Firestore is no longer required for audio storage (we use Firebase Storage now), but you may want it for other features in the future.

1. In the Firebase Console, go to **Firestore Database** from the left sidebar
2. Click "Create database"
3. Choose **Start in production mode**
4. Select a location closest to your users
5. Click "Enable"

## Step 7: Create Your .env File

1. In your project root, copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Open `.env` and replace the placeholder values with your Firebase config:

```env
VITE_FIREBASE_CONFIG='{"apiKey":"AIzaSy...","authDomain":"your-project.firebaseapp.com","projectId":"your-project-id","storageBucket":"your-project.appspot.com","messagingSenderId":"123456789","appId":"1:123456789:web:abc123..."}'

VITE_APP_ID="fact-family-math-app"

VITE_INITIAL_AUTH_TOKEN=""
```

**Important Notes:**
- The `VITE_FIREBASE_CONFIG` must be a single-line JSON string wrapped in quotes
- Keep `VITE_INITIAL_AUTH_TOKEN` empty unless you have a custom auth token
- Never commit your `.env` file to git (it's already in `.gitignore`)

## Step 8: Set Environment Variables in Vercel

When deploying to Vercel, you'll need to add these same environment variables:

1. Go to your Vercel project dashboard
2. Click **Settings** > **Environment Variables**
3. Add each variable:
   - `VITE_FIREBASE_CONFIG` = (your Firebase config JSON string)
   - `VITE_APP_ID` = `fact-family-math-app`
   - `VITE_INITIAL_AUTH_TOKEN` = (leave empty)

## Step 9: Test Locally

Run the development server to test:

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

**Test that Firebase is working:**
1. The app should load without errors
2. Click through flashcards - audio should play
3. Add `?mode=teacher` to the URL to test Teacher Mode
4. Try recording custom audio (you'll see a red record button)
5. Check your Firebase Console > Storage to see if audio files are being uploaded
6. Check the browser console for helpful logging (🔊, ✅, ⚠️ emojis indicate audio status)

## Troubleshooting

### "Firebase: Error (auth/configuration-not-found)"
- Check that `VITE_FIREBASE_CONFIG` is correctly formatted as a JSON string
- Make sure you've enabled Anonymous authentication in Firebase Console

### "Missing or insufficient permissions"
- Check your Firestore security rules
- Make sure the rules allow read/write for authenticated users

### Audio not saving in Teacher Mode
- Verify your Firebase Storage rules are published
- Check the browser console for errors (look for ❌ or ⚠️ emojis)
- Make sure you granted microphone permissions
- Ensure the Storage bucket exists and is enabled

### Audio stops working after a few days
- This should no longer happen with the new Storage-based system
- Audio URLs are automatically refreshed every 6 hours
- If playback fails, the app automatically retries with a fresh URL
- For maximum reliability, enable public read access in Storage rules

## Teacher Mode Usage

To enable Teacher Mode and record custom audio:

1. Add `?mode=teacher` to the URL: `http://localhost:5173/?mode=teacher`
2. Click the red microphone button to record custom audio for:
   - **Question audio** (when card is unflipped)
   - **Answer audio** (when card is flipped)
   - **Visual audio** (when visualize mode is active)
3. Custom audio is uploaded to Firebase Storage and will be used instead of text-to-speech
4. Cards with custom audio show an orange "CUSTOM AUDIO" badge
5. Audio files are automatically managed with URL refresh to prevent expiration

## How Audio Resilience Works

The app now includes automatic URL management to prevent Firebase Storage token expiration:

1. **Periodic Refresh** - Audio URLs are refreshed every 6 hours automatically
2. **Smart Retry** - If playback fails, the app fetches a fresh URL and retries
3. **Comprehensive Logging** - Console messages show audio loading status with emojis:
   - 🔄 = Loading/refreshing URLs
   - ✅ = Success
   - ⚠️ = Warning/retry
   - ❌ = Error
   - 🔊 = Audio playback
   - 📤 = Upload
4. **Graceful Fallback** - If custom audio fails, falls back to text-to-speech

## Next Steps

Once Firebase is configured:
- ✅ Test locally with `npm run dev`
- ✅ Commit your changes to GitHub
- ✅ Deploy to Vercel
- ✅ Add environment variables in Vercel
- ✅ Test the production deployment
