# Fact Family Math App

A digital flashcard app for learning basic math facts through fact families. Built with React, Vite, and Firebase.

## Features

- **Four Math Modes:**
  - Addition (sums 1-20)
  - Addition + Subtraction Mixed
  - Multiplication (products 1-100)
  - Multiplication + Division Mixed

- **Visualize Math:** Toggle between numbers and concrete visual representations using apples and baskets

- **Text-to-Speech:** Automatic audio narration for questions and answers

- **Teacher Mode:** Record custom audio for any flashcard (add `?mode=teacher` to URL)

- **Accessibility:** Full keyboard navigation and ARIA labels

- **Fact Family Organization:** Facts are presented in mathematically-related groups, not random order

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- Firebase account
- Vercel account (for deployment)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/starlightGR-steve/fact-family-math-app.git
cd fact-family-math-app
```

2. Install dependencies:
```bash
npm install
```

3. Set up Firebase (see [FIREBASE-SETUP-GUIDE.md](./FIREBASE-SETUP-GUIDE.md))

4. Create `.env` file:
```bash
cp .env.example .env
```

5. Add your Firebase configuration to `.env`

6. Run the development server:
```bash
npm run dev
```

7. Open [http://localhost:5173](http://localhost:5173)

## Firebase Setup

**Important:** You must configure Firebase before the app will work.

See the complete guide: [FIREBASE-SETUP-GUIDE.md](./FIREBASE-SETUP-GUIDE.md)

Quick checklist:
- ✅ Create Firebase project
- ✅ Enable Anonymous authentication
- ✅ Create Firestore database
- ✅ Configure security rules
- ✅ Add Firebase config to `.env`

## Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Go to [Vercel](https://vercel.com)
3. Import your GitHub repository
4. Configure environment variables (same as `.env` file)
5. Deploy!

**Environment Variables for Vercel:**
- `VITE_FIREBASE_CONFIG`
- `VITE_APP_ID`
- `VITE_INITIAL_AUTH_TOKEN` (optional)

## Usage

### Student Mode (Default)
- Navigate between math modes using the top navigation
- Tap a flashcard to reveal the answer
- Click "Visualize" to see apples and baskets
- Click "Next" to move to the next card
- Use grid view to jump to any specific fact

### Teacher Mode
Add `?mode=teacher` to the URL to enable recording custom audio:
- Record question audio (when card is unflipped)
- Record answer audio (when card is flipped)
- Record visual explanation audio (when visualize mode is active)
- Custom audio is saved to Firebase and used automatically

## Project Structure

```
fact-family-math-app/
├── FlashcardApp.jsx           # Main app component (from v2 code)
├── src/
│   ├── main.jsx               # Entry point
│   └── index.css              # Tailwind styles
├── FACT-FAMILY-MATH-SPEC.md   # Design and research documentation
├── FIREBASE-SETUP-GUIDE.md    # Firebase configuration guide
├── .env.example               # Environment variable template
└── vite.config.js             # Vite configuration
```

## Design Philosophy

This app follows the **Kumon principle**: simplicity, repetition, and pattern recognition.

- **No gamification:** No points, badges, timers, or rewards
- **Fact families:** Math facts are organized by mathematical relationships
- **Concrete to abstract:** Visual representations bridge understanding
- **Focused practice:** One problem at a time, minimal distractions

See [FACT-FAMILY-MATH-SPEC.md](./FACT-FAMILY-MATH-SPEC.md) for the complete design rationale and research.

## Technologies

- React 18
- Vite
- Tailwind CSS
- Firebase (Authentication + Firestore)
- Lucide React (icons)

## License

MIT

## Support

For issues or questions, please open an issue on GitHub.
