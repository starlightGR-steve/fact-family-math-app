/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./FlashcardApp.jsx",
  ],
  theme: {
    extend: {
      colors: {
        // Playful Scholar kit tokens (values live in playful-scholar-kit/tokens.css)
        'ps-blue': 'var(--ps-blue)', 'ps-teal': 'var(--ps-teal)',
        'ps-orange': 'var(--ps-orange)', 'ps-green': 'var(--ps-green)',
        'ps-red': 'var(--ps-red)', 'ps-dark-teal': 'var(--ps-dark-teal)',
        'ps-navy': 'var(--ps-navy)', 'ps-bg': 'var(--ps-bg)',
        'ps-text': 'var(--ps-text)', 'ps-border': 'var(--ps-border)',
        'header-bg': 'var(--header-bg)', 'header-border': 'var(--header-border)',
        'phonics-vowels': 'var(--phonics-vowels)', 'phonics-consonants': 'var(--phonics-consonants)',
        'phonics-digraphs': 'var(--phonics-digraphs)', 'phonics-suffixes': 'var(--phonics-suffixes)',
        // Math-app operation signatures (v2.9)
        'math-add': 'var(--math-add)', 'math-mix-addsub': 'var(--math-mix-addsub)',
        'math-mult': 'var(--math-mult)', 'math-mix-multdiv': 'var(--math-mix-multdiv)',
        'math-test': 'var(--math-test)',
        'secondary-semi-dark': 'var(--secondary-semi-dark)', 'accent-semi-dark': 'var(--accent-semi-dark)',
        'success-text': 'var(--success-text)', 'success-bg': 'var(--success-bg)', 'success-border': 'var(--success-border)',
        'danger-text': 'var(--danger-text)', 'danger-bg': 'var(--danger-bg)', 'danger-border': 'var(--danger-border)',
        'ps-neutral': 'var(--neutral)',
        'surface-tint': 'var(--surface-tint)', 'teal-ultra-light': 'var(--teal-ultra-light)',
        'teal-light': 'var(--teal-light)', 'orange-light': 'var(--orange-light)', 'blue-light': 'var(--blue-light)',
        'reserve-positive': 'var(--reserve-positive)', 'reserve-neutral': 'var(--reserve-neutral)',
        'reserve-negative': 'var(--reserve-negative)', 'reserve-gold': 'var(--reserve-gold)',
        'reserve-silver': 'var(--reserve-silver)', 'reserve-bronze': 'var(--reserve-bronze)',
      },
      fontFamily: {
        sans: ['Quicksand', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
