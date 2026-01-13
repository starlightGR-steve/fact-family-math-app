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

## Step 5: Set Up Firestore Database

1. In the Firebase Console, go to **Firestore Database** from the left sidebar
2. Click "Create database"
3. Choose **Start in production mode** (we'll add rules next)
4. Select a location closest to your users
5. Click "Enable"

### Configure Firestore Security Rules

1. Go to the **Rules** tab in Firestore
2. Replace the default rules with these:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow anyone to read/write audio clips for any app
    match /artifacts/{appId}/public/data/audio_clips/{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

3. Click **Publish**

**What these rules do:**
- Allow authenticated users (including anonymous) to read and write custom audio clips
- Store audio in the path: `artifacts/{appId}/public/data/audio_clips/`
- Each audio clip is stored with a document ID like `add_2_3_q`, `add_2_3_a`, etc.

## Step 6: Create Your .env File

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

## Step 7: Set Environment Variables in Vercel

When deploying to Vercel, you'll need to add these same environment variables:

1. Go to your Vercel project dashboard
2. Click **Settings** > **Environment Variables**
3. Add each variable:
   - `VITE_FIREBASE_CONFIG` = (your Firebase config JSON string)
   - `VITE_APP_ID` = `fact-family-math-app`
   - `VITE_INITIAL_AUTH_TOKEN` = (leave empty)

## Step 8: Test Locally

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
5. Check your Firebase Console > Firestore to see if audio clips are being saved

## Troubleshooting

### "Firebase: Error (auth/configuration-not-found)"
- Check that `VITE_FIREBASE_CONFIG` is correctly formatted as a JSON string
- Make sure you've enabled Anonymous authentication in Firebase Console

### "Missing or insufficient permissions"
- Check your Firestore security rules
- Make sure the rules allow read/write for authenticated users

### Audio not saving in Teacher Mode
- Verify your Firestore rules are published
- Check the browser console for errors
- Make sure you granted microphone permissions

## Teacher Mode Usage

To enable Teacher Mode and record custom audio:

1. Add `?mode=teacher` to the URL: `http://localhost:5173/?mode=teacher`
2. Click the red microphone button to record custom audio for:
   - **Question audio** (when card is unflipped)
   - **Answer audio** (when card is flipped)
   - **Visual audio** (when visualize mode is active)
3. Custom audio is saved to Firestore and will be used instead of text-to-speech
4. Cards with custom audio show an orange "CUSTOM AUDIO" badge

## Next Steps

Once Firebase is configured:
- ✅ Test locally with `npm run dev`
- ✅ Commit your changes to GitHub
- ✅ Deploy to Vercel
- ✅ Add environment variables in Vercel
- ✅ Test the production deployment
