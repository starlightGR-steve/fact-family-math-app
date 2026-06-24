import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, ArrowRight, Calculator, RefreshCw, LayoutGrid, CreditCard, Plus, Minus, X, Equal, Mic, Square, Settings, Shuffle, CheckSquare, Square as SquareIcon } from 'lucide-react';
import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL, listAll } from "firebase/storage";

// --- FIREBASE SETUP ---
let app = null;
let auth = null;
let db = null;
let storage = null;
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

try {
  const firebaseConfig = JSON.parse(__firebase_config);
  if (firebaseConfig.apiKey) {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
  }
} catch (e) {
  console.warn("Firebase not configured, running in offline mode:", e.message);
}

// --- CUSTOM ICONS ---

const ColoredChartIcon = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="filter drop-shadow-sm" aria-hidden="true">
    <rect x="3" y="12" width="5" height="8" rx="1" fill="#F43F5E" />
    <rect x="9.5" y="7" width="5" height="13" rx="1" fill="#F59E0B" />
    <rect x="16" y="3" width="5" height="17" rx="1" fill="#10B981" />
    <path d="M2 21H22" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const DivideIcon = ({ size = 24, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <circle cx="12" cy="6" r="1" fill="currentColor" stroke="none" />
    <line x1="5" y1="12" x2="19" y2="12" />
    <circle cx="12" cy="18" r="1" fill="currentColor" stroke="none" />
  </svg>
);

// --- DATA GENERATION LOGIC ---

const generateId = () => Math.random().toString(36).substr(2, 9);

// Grammar helper
const pluralize = (count, noun) => `${count} ${noun}${count === 1 ? '' : 's'}`;

// Hook for Speech (TTS + Custom Audio)
const useSpeech = (customAudioMap, refreshAudioURLs) => {
  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState(null);
  const [enabled, setEnabled] = useState(true);
  const audioRef = useRef(new Audio());

  // Use a ref to always have access to the latest customAudioMap
  const customAudioMapRef = useRef(customAudioMap);
  useEffect(() => {
    customAudioMapRef.current = customAudioMap;
  }, [customAudioMap]);

  useEffect(() => {
    const loadVoices = () => {
      const available = window.speechSynthesis.getVoices();
      setVoices(available);
      const preferred = available.find(v => v.name.includes('Google US English')) ||
                        available.find(v => v.lang.startsWith('en-US')) ||
                        available.find(v => v.lang.startsWith('en'));
      setSelectedVoice(preferred);
    };
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }, []);

  const playAudio = async (text, customKey) => {
    if (!enabled) return;

    // Stop any currently playing audio
    window.speechSynthesis.cancel();
    audioRef.current.pause();

    // Use ref to get the latest customAudioMap
    const audioMap = customAudioMapRef.current;
    console.log("🔊 playAudio called - customKey:", customKey, "hasCustom:", !!audioMap[customKey], "totalCustom:", Object.keys(audioMap).length);

    // Check for custom audio first
    if (customKey && audioMap[customKey]) {
      try {
        console.log("▶️ Playing custom audio for:", customKey);
        audioRef.current.src = audioMap[customKey];

        // Add error handler for automatic retry with fresh URL
        audioRef.current.onerror = async (err) => {
          console.warn("⚠️ Audio playback failed for:", customKey, "- Attempting to refresh URL and retry...");

          // Refresh URLs and retry once
          if (refreshAudioURLs) {
            await refreshAudioURLs();
            const updatedMap = customAudioMapRef.current;

            if (updatedMap[customKey]) {
              console.log("🔄 Retrying with fresh URL for:", customKey);
              audioRef.current.src = updatedMap[customKey];
              try {
                await audioRef.current.play();
                console.log("✅ Retry successful for:", customKey);
              } catch (retryErr) {
                console.error("❌ Retry failed for:", customKey, retryErr);
                // Fallback to TTS
                playTTS(text);
              }
            } else {
              console.warn("⚠️ No URL available after refresh, falling back to TTS");
              playTTS(text);
            }
          } else {
            console.warn("⚠️ No refresh function available, falling back to TTS");
            playTTS(text);
          }
        };

        await audioRef.current.play();
        return;
      } catch (e) {
        console.error("❌ Error playing custom audio:", e);
        // Will fall through to TTS
      }
    }

    // Fallback to TTS
    playTTS(text);
  };

  const playTTS = (text) => {
    console.log("🗣️ Falling back to TTS for:", text);
    if (!text) return;
    const utterance = new SpeechSynthesisUtterance(text);
    if (selectedVoice) utterance.voice = selectedVoice;
    utterance.rate = 0.9;
    utterance.pitch = 1;
    window.speechSynthesis.speak(utterance);
  };

  return { playAudio, enabled, setEnabled };
};

const generateDeck = (mode) => {
  const cards = [];
  const min = 1;
  const max = 10;

  for (let i = min; i <= max; i++) {
    for (let j = i; j <= max; j++) {

      const sum = i + j;
      const product = i * j;

      const createCard = (q, a, readQ, readA, readVisual, visType, v1, v2, stableId) => ({
        q, a, readQ, readA, readVisual,
        id: generateId(),
        stableId, // Used for linking custom audio
        visual: { type: visType, v1, v2 }
      });

      if (mode === 'addition') {
        const visualText1 = `${i} apples plus ${j} apples equals ${sum} apples`;
        cards.push(createCard(`${i} + ${j}`, sum, `${i} plus ${j}`, `${sum}. ${i} plus ${j} is ${sum}`, visualText1, 'add', i, j, `add_${i}_${j}`));

        if (i !== j) {
          const visualText2 = `${j} apples plus ${i} apples equals ${sum} apples`;
          cards.push(createCard(`${j} + ${i}`, sum, `${j} plus ${i}`, `${sum}. ${j} plus ${i} is ${sum}`, visualText2, 'add', j, i, `add_${j}_${i}`));
        }
      }
      else if (mode === 'addsub') {
        // Addition part
        cards.push(createCard(`${i} + ${j}`, sum, `${i} plus ${j}`, `${sum}. ${i} plus ${j} is ${sum}`, `${i} apples plus ${j} apples equals ${sum} apples`, 'add', i, j, `add_${i}_${j}`));
        if (i !== j) cards.push(createCard(`${j} + ${i}`, sum, `${j} plus ${i}`, `${sum}. ${j} plus ${i} is ${sum}`, `${j} apples plus ${i} apples equals ${sum} apples`, 'add', j, i, `add_${j}_${i}`));

        // Subtraction
        const visualTextSub1 = `Start with ${sum} apples, take away ${i}`;
        cards.push(createCard(`${sum} - ${i}`, j, `${sum} minus ${i}`, `${j}. ${sum} minus ${i} is ${j}`, visualTextSub1, 'sub', sum, i, `sub_${sum}_${i}`));
        if (i !== j) {
           const visualTextSub2 = `Start with ${sum} apples, take away ${j}`;
           cards.push(createCard(`${sum} - ${j}`, i, `${sum} minus ${j}`, `${i}. ${sum} minus ${j} is ${i}`, visualTextSub2, 'sub', sum, j, `sub_${sum}_${j}`));
        }
      }
      else if (mode === 'mult') {
        const visualTextMult1 = `${i} baskets with ${j} apples in each equals ${product} apples`;
        cards.push(createCard(`${i} × ${j}`, product, `${i} times ${j}`, `${product}. ${i} times ${j} is ${product}`, visualTextMult1, 'mult', i, j, `mult_${i}_${j}`));
        if (i !== j) {
          const visualTextMult2 = `${j} baskets with ${i} apples in each equals ${product} apples`;
          cards.push(createCard(`${j} × ${i}`, product, `${j} times ${i}`, `${product}. ${j} times ${i} is ${product}`, visualTextMult2, 'mult', j, i, `mult_${j}_${i}`));
        }
      }
      else if (mode === 'multdiv') {
        // Mult part
        cards.push(createCard(`${i} × ${j}`, product, `${i} times ${j}`, `${product}. ${i} times ${j} is ${product}`, `${i} baskets with ${j} apples in each equals ${product} apples`, 'mult', i, j, `mult_${i}_${j}`));
        if (i !== j) cards.push(createCard(`${j} × ${i}`, product, `${j} times ${i}`, `${product}. ${j} times ${i} is ${product}`, `${j} baskets with ${i} apples in each equals ${product} apples`, 'mult', j, i, `mult_${j}_${i}`));

        // Division
        const visualTextDiv1 = `${product} apples shared into ${i} baskets means ${j} apples are in each basket. ${product} divided by ${i} equals ${j}`;
        cards.push(createCard(`${product} ÷ ${i}`, j, `${product} divided by ${i}`, `${j}. ${product} divided by ${i} is ${j}`, visualTextDiv1, 'div', product, i, `div_${product}_${i}`));
        if (i !== j) {
           const visualTextDiv2 = `${product} apples shared into ${j} baskets means ${i} apples are in each basket. ${product} divided by ${j} equals ${i}`;
           cards.push(createCard(`${product} ÷ ${j}`, i, `${product} divided by ${j}`, `${i}. ${product} divided by ${j} is ${i}`, visualTextDiv2, 'div', product, j, `div_${product}_${j}`));
        }
      }
    }
  }
  return cards;
};

// New function to generate a shuffled test deck based on selection
const generateTestDeck = (selection) => {
  const cards = [];
  const min = 1;
  const max = 10;

  for (let i = min; i <= max; i++) {
    for (let j = i; j <= max; j++) {
      const sum = i + j;
      const product = i * j;

      const create = (q, a, readQ, readA, readVisual, visType, v1, v2, stableId) => ({
        q, a, readQ, readA, readVisual,
        id: generateId(),
        stableId,
        visual: { type: visType, v1, v2 }
      });

      if (selection.add) {
         const visualText1 = `${pluralize(i, 'apple')} plus ${pluralize(j, 'apple')} equals ${pluralize(sum, 'apple')}`;
         cards.push(create(`${i} + ${j}`, sum, `${i} plus ${j}`, `${sum}. ${i} plus ${j} is ${sum}`, visualText1, 'add', i, j, `add_${i}_${j}`));
         if (i !== j) {
            const visualText2 = `${pluralize(j, 'apple')} plus ${pluralize(i, 'apple')} equals ${pluralize(sum, 'apple')}`;
            cards.push(create(`${j} + ${i}`, sum, `${j} plus ${i}`, `${sum}. ${j} plus ${i} is ${sum}`, visualText2, 'add', j, i, `add_${j}_${i}`));
         }
      }

      if (selection.sub) {
         const visualTextSub1 = `Start with ${pluralize(sum, 'apple')}, take away ${i}`;
         cards.push(create(`${sum} - ${i}`, j, `${sum} minus ${i}`, `${j}. ${sum} minus ${i} is ${j}`, visualTextSub1, 'sub', sum, i, `sub_${sum}_${i}`));
         if (i !== j) {
            const visualTextSub2 = `Start with ${pluralize(sum, 'apple')}, take away ${j}`;
            cards.push(create(`${sum} - ${j}`, i, `${sum} minus ${j}`, `${i}. ${sum} minus ${j} is ${i}`, visualTextSub2, 'sub', sum, j, `sub_${sum}_${j}`));
         }
      }

      if (selection.mult) {
         const visualTextMult1 = `${pluralize(i, 'basket')} with ${pluralize(j, 'apple')} in each equals ${pluralize(product, 'apple')}`;
         cards.push(create(`${i} × ${j}`, product, `${i} times ${j}`, `${product}. ${i} times ${j} is ${product}`, visualTextMult1, 'mult', i, j, `mult_${i}_${j}`));
         if (i !== j) {
            const visualTextMult2 = `${pluralize(j, 'basket')} with ${pluralize(i, 'apple')} in each equals ${pluralize(product, 'apple')}`;
            cards.push(create(`${j} × ${i}`, product, `${j} times ${i}`, `${product}. ${j} times ${i} is ${product}`, visualTextMult2, 'mult', j, i, `mult_${j}_${i}`));
         }
      }

      if (selection.div) {
         const verb1 = j === 1 ? 'is' : 'are';
         const visualTextDiv1 = `${pluralize(product, 'apple')} shared into ${pluralize(i, 'basket')} means ${pluralize(j, 'apple')} ${verb1} in each basket. ${product} divided by ${i} equals ${j}`;
         cards.push(create(`${product} ÷ ${i}`, j, `${product} divided by ${i}`, `${j}. ${product} divided by ${i} is ${j}`, visualTextDiv1, 'div', product, i, `div_${product}_${i}`));

         if (i !== j) {
            const verb2 = i === 1 ? 'is' : 'are';
            const visualTextDiv2 = `${pluralize(product, 'apple')} shared into ${pluralize(j, 'basket')} means ${pluralize(i, 'apple')} ${verb2} in each basket. ${product} divided by ${j} equals ${i}`;
            cards.push(create(`${product} ÷ ${j}`, i, `${product} divided by ${j}`, `${i}. ${product} divided by ${j} is ${i}`, visualTextDiv2, 'div', product, j, `div_${product}_${j}`));
         }
      }
    }
  }

  // Shuffle
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }

  return cards;
};

// --- VISUALIZATION COMPONENT ---
const Visualizer = ({ visual }) => {
  const { type, v1, v2 } = visual;

  const getAppleSizeClass = (count) => {
    if (count > 50) return "text-[8px] md:text-[10px]";
    if (count > 25) return "text-[10px] md:text-xs";
    if (count > 12) return "text-sm md:text-lg";
    return "text-lg md:text-3xl";
  };

  const getContainerSizeClass = (count) => {
      if (count > 20) return "gap-0.5 md:gap-1 p-1";
      return "gap-1 md:gap-2 p-2";
  };

  if (type === 'add') {
    const total = v1 + v2;
    const appleClass = getAppleSizeClass(total);
    const containerClass = getContainerSizeClass(total);

    return (
      <div className="flex flex-col items-center gap-2 animate-in fade-in zoom-in duration-300 w-full px-1">
        {/* aria-hidden="true" on visual elements so screen readers don't count apples individually */}
        <div className="flex flex-wrap items-center justify-center gap-1 md:gap-3 w-full" aria-hidden="true">
          <div className={`bg-red-50 rounded-xl border-2 border-red-100 flex flex-wrap justify-center content-center ${containerClass} max-w-[28%] min-w-[40px] aspect-square`}>
            {[...Array(v1)].map((_, i) => <span key={`a-${i}`} className={`${appleClass} leading-none`}>🍎</span>)}
          </div>
          <Plus className="text-slate-400 w-4 h-4 md:w-6 md:h-6 shrink-0" strokeWidth={3} />
          <div className={`bg-red-50 rounded-xl border-2 border-red-100 flex flex-wrap justify-center content-center ${containerClass} max-w-[28%] min-w-[40px] aspect-square`}>
            {[...Array(v2)].map((_, i) => <span key={`b-${i}`} className={`${appleClass} leading-none`}>🍎</span>)}
          </div>
          <Equal className="text-slate-400 w-4 h-4 md:w-6 md:h-6 shrink-0" strokeWidth={3} />
          <div className={`bg-emerald-50 rounded-xl border-2 border-emerald-200 shadow-sm flex flex-wrap justify-center content-center ${containerClass} max-w-[28%] min-w-[40px] aspect-square`}>
             {[...Array(total)].map((_, i) => <span key={`c-${i}`} className={`${appleClass} leading-none`}>🍎</span>)}
          </div>
        </div>
        <div className="text-sm md:text-lg text-slate-500 font-bold text-center mt-1">{pluralize(v1, 'apple')} + {pluralize(v2, 'apple')} = {pluralize(total, 'apple')}</div>
      </div>
    );
  }

  if (type === 'sub') {
    const remaining = v1 - v2;
    const appleClass = getAppleSizeClass(v1);
    const containerClass = getContainerSizeClass(v1);

    return (
      <div className="flex flex-col items-center gap-2 animate-in fade-in zoom-in duration-300 w-full px-1">
        <div className="flex flex-wrap items-center justify-center gap-1 md:gap-3 w-full" aria-hidden="true">
          <div className={`bg-red-50 rounded-xl border-2 border-red-100 flex flex-wrap justify-center content-center ${containerClass} max-w-[40%] min-w-[80px]`}>
            {[...Array(v1)].map((_, i) => (
              <div key={i} className="relative leading-none">
                <span className={`${appleClass} ${i >= remaining ? "opacity-30 grayscale" : ""}`}>🍎</span>
                {i >= remaining && (
                  <span className="absolute inset-0 flex items-center justify-center text-red-600 font-bold opacity-80" style={{ fontSize: '1.2em' }}>✕</span>
                )}
              </div>
            ))}
          </div>
          <Equal className="text-slate-400 w-4 h-4 md:w-6 md:h-6 shrink-0" strokeWidth={3} />
          <div className={`bg-emerald-50 rounded-xl border-2 border-emerald-200 shadow-sm flex flex-wrap justify-center content-center ${containerClass} max-w-[40%] min-w-[80px]`}>
            {[...Array(remaining)].map((_, i) => (
               <span key={`r-${i}`} className={`${appleClass} leading-none`}>🍎</span>
            ))}
          </div>
        </div>
        <div className="text-sm md:text-lg text-slate-500 font-bold text-center mt-1">Start with {pluralize(v1, 'apple')}, take away {v2} = {pluralize(remaining, 'apple')} left</div>
      </div>
    );
  }

  if (type === 'mult') {
    const total = v1 * v2;
    const productAppleClass = getAppleSizeClass(total);
    const productContainerClass = getContainerSizeClass(total);
    const basketScale = v1 > 5 ? "scale-75 -mx-1" : "scale-100";

    return (
      <div className="flex flex-col items-center gap-1 animate-in fade-in zoom-in duration-300 w-full px-1">
        <div className="flex flex-wrap items-center justify-center gap-1 md:gap-2 w-full h-full" aria-hidden="true">
          <div className="flex flex-wrap justify-center gap-1 max-w-[55%] items-center content-center">
             {[...Array(v1)].map((_, i) => (
                <div key={i} className={`flex flex-col items-center ${basketScale}`}>
                   <div className="bg-amber-100 border-b-2 border-amber-300 rounded-b-lg rounded-t-sm p-1 flex flex-wrap gap-[1px] w-12 md:w-16 justify-center min-h-[40px] shadow-sm relative">
                     <div className="absolute -top-2 w-10 h-4 border-t-2 border-l-2 border-r-2 border-amber-300 rounded-t-full opacity-50"></div>
                     {[...Array(v2)].map((_, j) => (
                       <span key={j} className="text-[8px] md:text-[10px] leading-none z-10">🍎</span>
                     ))}
                   </div>
                   <span className="text-slate-400 text-[9px] font-bold">{v2}</span>
                </div>
             ))}
          </div>
          <Equal className="text-slate-400 w-4 h-4 md:w-6 md:h-6 shrink-0" strokeWidth={3} />
          <div className={`bg-emerald-50 rounded-xl border-2 border-emerald-200 shadow-sm flex flex-wrap justify-center content-center ${productContainerClass} max-w-[35%] overflow-hidden`}>
             {[...Array(total)].map((_, i) => <span key={`p-${i}`} className={`${productAppleClass} leading-none`}>🍎</span>)}
          </div>
        </div>
        <div className="text-sm md:text-lg text-slate-500 font-bold text-center mt-1">{pluralize(v1, 'basket')} × {pluralize(v2, 'apple')} = {pluralize(total, 'apple')}</div>
      </div>
    );
  }

  if (type === 'div') {
    const baskets = v2;
    const applesPerBasket = v1 / v2;
    const basketScale = baskets > 6 ? "scale-75 -mx-1" : "scale-100";

    return (
      <div className="flex flex-col items-center gap-2 animate-in fade-in zoom-in duration-300">
        <div className="flex flex-wrap justify-center gap-2" aria-hidden="true">
           {[...Array(baskets)].map((_, i) => (
             <div key={i} className={`flex flex-col items-center ${basketScale}`}>
                <div className="bg-amber-100 border-b-2 border-amber-300 rounded-b-lg rounded-t-sm p-2 flex flex-wrap gap-[2px] w-16 md:w-20 justify-center min-h-[50px] shadow-sm relative">
                  <div className="absolute -top-3 w-12 h-6 border-t-2 border-l-2 border-r-2 border-amber-300 rounded-t-full opacity-50"></div>
                  {[...Array(applesPerBasket)].map((_, j) => (
                    <span key={j} className="text-[10px] md:text-xs leading-none z-10">🍎</span>
                  ))}
                </div>
             </div>
          ))}
        </div>
        <div className="flex flex-col items-center text-center mt-2 px-4">
           <span className="text-sm md:text-lg text-slate-500 font-bold">
             {pluralize(v1, 'apple')} shared into {pluralize(baskets, 'basket')} means <span className="text-emerald-600 font-bold">{pluralize(applesPerBasket, 'apple')}</span> in each.
           </span>
           <span className="text-base md:text-xl text-math-mix-multdiv font-bold mt-1">
             {v1} ÷ {baskets} = {applesPerBasket}
           </span>
        </div>
      </div>
    );
  }

  return null;
};

// --- AUDIO RECORDER COMPONENT ---

const AudioRecorder = ({ cardStableId, type, onSave }) => {
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  const startRecording = async (e) => {
    e.stopPropagation();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      chunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = () => {
          const base64data = reader.result;
          onSave(cardStableId, type, base64data);
        };
        // Stop all tracks to release mic
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error accessing mic:", err);
    }
  };

  const stopRecording = (e) => {
    e.stopPropagation();
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  return (
    <div className="absolute z-50 flex items-center">
      {!isRecording ? (
        <button
          onClick={startRecording}
          className="p-2 bg-red-100 text-red-600 rounded-full hover:bg-red-200 shadow-md transition-all"
          title="Record Audio"
          aria-label="Start recording audio"
        >
          <Mic size={20} />
        </button>
      ) : (
        <button
          onClick={stopRecording}
          className="p-2 bg-red-600 text-white rounded-full hover:bg-red-700 shadow-md animate-pulse transition-all"
          title="Stop Recording"
          aria-label="Stop recording audio"
        >
          <Square size={20} fill="currentColor" />
        </button>
      )}
    </div>
  );
};

// --- MAIN APP ---

// Per-operation signature color (kit --math-* tokens), keyed by a card's
// visual.type. The card underline, question numbers, and revealed answer all
// follow the OPERATION OF THAT SPECIFIC CARD (not the active tab), so e.g. a
// subtraction question reads math-mix-addsub in every tab and mode.
const OP_COLOR = {
  add:  { border: 'border-math-add',         text: 'text-math-add' },
  sub:  { border: 'border-math-mix-addsub',  text: 'text-math-mix-addsub' },
  mult: { border: 'border-math-mult',        text: 'text-math-mult' },
  div:  { border: 'border-math-mix-multdiv', text: 'text-math-mix-multdiv' },
};
const cardColor = (card) => OP_COLOR[card?.visual?.type] || OP_COLOR.add;

const NavButton = ({ label, icon, active, colorClass, onClick }) => (
  <button
    onClick={onClick}
    aria-label={`Switch to ${label} mode`}
    className={`
      flex-1 py-3 px-1 md:px-2 rounded-xl transition-all flex flex-col items-center justify-center gap-1 border-b-4
      ${active
        ? `bg-white text-slate-800 shadow-md ${colorClass}`
        : 'bg-slate-100 text-slate-400 hover:bg-slate-200 border-transparent'}
    `}
  >
    <div className={`p-1 rounded-full ${active ? 'bg-slate-100' : ''}`}>
      {icon}
    </div>
    <span className="text-[10px] md:text-xs font-bold uppercase tracking-wider hidden sm:block">
      {label}
    </span>
  </button>
);

// Toggle Button for Test Setup
const SelectionToggle = ({ label, icon, selected, onClick, colorClass }) => (
  <button
    onClick={onClick}
    className={`
      flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all h-28
      ${selected
        ? `bg-white ${colorClass} shadow-md`
        : 'bg-slate-50 border-slate-200 text-slate-400 hover:bg-slate-100'}
    `}
  >
    <div className={`p-2 rounded-full mb-2 ${selected ? 'bg-slate-100' : ''}`}>
      {icon}
    </div>
    <span className="font-bold text-sm">{label}</span>
    <div className="mt-2">
      {selected ? <CheckSquare size={20} className="text-emerald-500"/> : <SquareIcon size={20} className="text-slate-300"/>}
    </div>
  </button>
);

const FlashcardApp = () => {
  const [activeMode, setActiveMode] = useState('addition');
  const [deck, setDeck] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showVisual, setShowVisual] = useState(false);
  const [viewMode, setViewMode] = useState('card');
  const [user, setUser] = useState(null);
  const cardRef = useRef(null);

  // Teacher Mode State
  const [teacherMode, setTeacherMode] = useState(false);
  const [customAudioMap, setCustomAudioMap] = useState({});

  // Test Mode State
  const [testState, setTestState] = useState('setup'); // 'setup' or 'running'
  const [testSelection, setTestSelection] = useState({
    add: false,
    sub: false,
    mult: false,
    div: false
  });

  // Initialize Teacher Mode based on URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('mode') === 'teacher') {
      setTeacherMode(true);
    }
  }, []);

  // Firebase Auth & Data Fetching
  useEffect(() => {
    if (!auth) return; // Skip if Firebase not configured
    const initAuth = async () => {
      if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
        try {
          await signInWithCustomToken(auth, __initial_auth_token);
        } catch (e) {
          console.error("Custom token auth failed, falling back to anonymous", e);
          await signInAnonymously(auth);
        }
      } else {
        await signInAnonymously(auth);
      }
    };
    initAuth();
    const unsubscribeAuth = onAuthStateChanged(auth, setUser);
    return () => unsubscribeAuth();
  }, []);

  // Fetch all audio URLs from Firebase Storage
  const fetchAllAudioURLs = async () => {
    if (!user || !storage) {
      console.log("⏭️ Audio fetch skipped - user:", !!user, "storage:", !!storage);
      return;
    }

    try {
      console.log("🔄 Fetching audio URLs from Firebase Storage...");
      const audioFolderRef = storageRef(storage, `artifacts/${appId}/audio`);
      const fileList = await listAll(audioFolderRef);

      console.log(`📦 Found ${fileList.items.length} audio files in Storage`);

      const audioData = {};
      await Promise.all(
        fileList.items.map(async (itemRef) => {
          try {
            const url = await getDownloadURL(itemRef);
            // Extract filename without extension to use as key (e.g., "add_2_3_q.webm" -> "add_2_3_q")
            const fileName = itemRef.name.replace(/\.[^/.]+$/, "");
            audioData[fileName] = url;
            console.log(`✅ Loaded: ${fileName}`);
          } catch (err) {
            console.warn(`⚠️ Failed to get URL for ${itemRef.name}:`, err.message);
          }
        })
      );

      setCustomAudioMap(audioData);
      console.log(`✨ Audio URLs loaded: ${Object.keys(audioData).length} files`);
    } catch (error) {
      console.error("❌ Error fetching audio URLs:", error);
    }
  };

  // Initial load + periodic refresh every 6 hours
  useEffect(() => {
    if (!user || !storage) return;

    console.log("🎵 Initializing audio URL management...");
    fetchAllAudioURLs();

    // Refresh URLs every 6 hours to prevent expiration
    const refreshInterval = setInterval(() => {
      console.log("🔄 Periodic refresh: Updating audio URLs...");
      fetchAllAudioURLs();
    }, 6 * 60 * 60 * 1000); // 6 hours in milliseconds

    return () => clearInterval(refreshInterval);
  }, [user]);

  const { playAudio, enabled: audioEnabled, setEnabled: setAudioEnabled } = useSpeech(customAudioMap, fetchAllAudioURLs);

  // Deck generation logic based on activeMode
  useEffect(() => {
    if (activeMode === 'test') {
      // If entering test mode, reset to setup unless already running
      if (testState !== 'running') {
        setTestState('setup');
        setDeck([]);
      }
    } else {
      // Standard modes
      const newDeck = generateDeck(activeMode);
      setDeck(newDeck);
      setCurrentIndex(0);
      setIsFlipped(false);
      setShowVisual(false);
      setViewMode('card');
      setTestState('setup'); // Reset test state if leaving test tab
    }
  }, [activeMode]);

  useEffect(() => {
    if (viewMode === 'card' && deck.length > 0 && (activeMode !== 'test' || (activeMode === 'test' && testState === 'running'))) {
      const currentStableId = deck[currentIndex]?.stableId;
      const timer = setTimeout(() => {
        if (showVisual) {
          playAudio(deck[currentIndex].readVisual, `${currentStableId}_visual`);
        } else if (!isFlipped) {
          playAudio(deck[currentIndex].readQ, `${currentStableId}_q`);
        } else {
          playAudio(deck[currentIndex].readA, `${currentStableId}_a`);
        }
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [currentIndex, isFlipped, activeMode, showVisual, deck, viewMode, testState]);

  const saveAudio = async (stableId, type, base64Data) => {
    if (!user || !storage) {
      console.warn("⚠️ Cannot save audio - user or storage not initialized");
      return;
    }

    const fileName = `${stableId}_${type}.webm`;
    const fileRef = storageRef(storage, `artifacts/${appId}/audio/${fileName}`);

    try {
      console.log("📤 Uploading audio to Storage:", fileName);

      // Convert base64 to blob
      const response = await fetch(base64Data);
      const blob = await response.blob();

      // Upload to Firebase Storage
      await uploadBytes(fileRef, blob, {
        contentType: 'audio/webm',
        customMetadata: {
          uploadedAt: new Date().toISOString(),
          stableId,
          type
        }
      });

      console.log("✅ Audio uploaded successfully:", fileName);

      // Refresh URLs to include the new file
      await fetchAllAudioURLs();
      console.log("🔄 Audio URLs refreshed after upload");
    } catch (e) {
      console.error("❌ Error saving audio to Storage:", e);
    }
  };

  const handleCardInteraction = () => {
    if (teacherMode) return;
    if (showVisual) return;
    if (!isFlipped) {
      setIsFlipped(true);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleCardInteraction();
    }
  };

  const handleNext = (e) => {
    e.stopPropagation();
    // First, flip the card back and hide visual
    setIsFlipped(false);
    setShowVisual(false);

    // Wait for the fade-out animation to complete before changing cards
    setTimeout(() => {
      if (currentIndex < deck.length - 1) {
        setCurrentIndex(prev => prev + 1);
      } else {
        setCurrentIndex(0);
      }
    }, 300); // Match this to the opacity transition duration
  };

  const handleReplayAudio = (e) => {
    e.stopPropagation();
    const currentStableId = deck[currentIndex]?.stableId;
    if (showVisual) {
      playAudio(deck[currentIndex].readVisual, `${currentStableId}_visual`);
      return;
    }
    if (isFlipped) {
      playAudio(deck[currentIndex].readA, `${currentStableId}_a`);
    } else {
      playAudio(deck[currentIndex].readQ, `${currentStableId}_q`);
    }
  };

  const handleStartTest = () => {
    const newDeck = generateTestDeck(testSelection);
    if (newDeck.length === 0) {
      alert("Please select at least one operation to test.");
      return;
    }
    setDeck(newDeck);
    setTestState('running');
    setCurrentIndex(0);
    setIsFlipped(false);
    setShowVisual(false);
  };

  const toggleTestSelection = (key) => {
    setTestSelection(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const selectAllTest = () => {
    setTestSelection({ add: true, sub: true, mult: true, div: true });
  };

  const currentCard = deck[currentIndex] || { q: '', a: '' };
  const progress = deck.length > 0 ? ((currentIndex + 1) / deck.length) * 100 : 0;

  // Check if current card has ANY custom audio associated with it
  const hasCustomAudio = currentCard && (
      customAudioMap[`${currentCard.stableId}_q`] ||
      customAudioMap[`${currentCard.stableId}_a`] ||
      customAudioMap[`${currentCard.stableId}_visual`]
  );

  return (
    <div className="h-screen bg-slate-100 flex flex-col items-center font-sans overflow-hidden">

      {/* Persistent Navigation Bar - ICONS MODE */}
      <div className="w-full bg-white shadow-sm z-20 sticky top-0" role="navigation" aria-label="Math Mode Selection">
        <div className="max-w-4xl mx-auto p-2">
          <div className="flex gap-2 w-full">
            <NavButton
              label="Add"
              icon={<Plus size={24} strokeWidth={3} className="md:w-7 md:h-7" aria-hidden="true" />}
              active={activeMode === 'addition'}
              colorClass="border-math-add"
              onClick={() => setActiveMode('addition')}
            />
            <NavButton
              label="Mix"
              icon={
                <div className="flex items-center gap-1" aria-hidden="true">
                  <Plus size={18} strokeWidth={3} />
                  <span className="text-slate-300 text-lg">|</span>
                  <Minus size={18} strokeWidth={3} />
                </div>
              }
              active={activeMode === 'addsub'}
              colorClass="border-math-mix-addsub"
              onClick={() => setActiveMode('addsub')}
            />
            <NavButton
              label="Mult"
              icon={<X size={24} strokeWidth={3} className="md:w-7 md:h-7" aria-hidden="true" />}
              active={activeMode === 'mult'}
              colorClass="border-math-mult"
              onClick={() => setActiveMode('mult')}
            />
            <NavButton
              label="Mix"
              icon={
                <div className="flex items-center gap-1" aria-hidden="true">
                  <X size={18} strokeWidth={3} />
                  <span className="text-slate-300 text-lg">|</span>
                  <DivideIcon size={18} />
                </div>
              }
              active={activeMode === 'multdiv'}
              colorClass="border-math-mix-multdiv"
              onClick={() => setActiveMode('multdiv')}
            />
            <NavButton
              label="Test"
              icon={<Shuffle size={24} strokeWidth={3} className="md:w-7 md:h-7" aria-hidden="true" />}
              active={activeMode === 'test'}
              colorClass="border-math-test"
              onClick={() => setActiveMode('test')}
            />
          </div>
        </div>
      </div>

      {/* Hide progress bar during test setup */}
      {!(activeMode === 'test' && testState === 'setup') && (
        <div className="w-full h-2 bg-slate-200">
          <div className="h-full bg-ps-teal transition-all duration-300" style={{ width: `${progress}%` }}></div>
        </div>
      )}

      <div className="flex-1 w-full max-w-3xl p-3 md:p-6 flex flex-col items-center justify-center relative overflow-y-auto">

        {/* Test Mode Setup Screen */}
        {activeMode === 'test' && testState === 'setup' ? (
          <div className="w-full flex flex-col items-center animate-in fade-in zoom-in duration-300">
            <h2 className="text-2xl font-bold text-slate-700 mb-6">Test Yourself</h2>

            <div className="w-full grid grid-cols-2 gap-4 mb-6 max-w-md">
              <SelectionToggle
                label="Addition"
                icon={<Plus size={24} />}
                selected={testSelection.add}
                onClick={() => toggleTestSelection('add')}
                colorClass="border-math-add text-math-add"
              />
              <SelectionToggle
                label="Subtraction"
                icon={<Minus size={24} />}
                selected={testSelection.sub}
                onClick={() => toggleTestSelection('sub')}
                colorClass="border-math-mix-addsub text-math-mix-addsub"
              />
              <SelectionToggle
                label="Multiplication"
                icon={<X size={24} />}
                selected={testSelection.mult}
                onClick={() => toggleTestSelection('mult')}
                colorClass="border-math-mult text-math-mult"
              />
              <SelectionToggle
                label="Division"
                icon={<DivideIcon size={24} />}
                selected={testSelection.div}
                onClick={() => toggleTestSelection('div')}
                colorClass="border-math-mix-multdiv text-math-mix-multdiv"
              />
            </div>

            <div className="flex gap-4 w-full max-w-md">
              <button
                onClick={selectAllTest}
                className="flex-1 py-3 px-4 rounded-xl font-bold bg-slate-200 text-slate-600 hover:bg-slate-300 transition-all"
              >
                Select All
              </button>
              <button
                onClick={handleStartTest}
                className="flex-[2] py-3 px-4 rounded-xl font-bold bg-ps-green text-white hover:brightness-95 shadow-lg hover:scale-105 transition-all flex items-center justify-center gap-2"
              >
                <Shuffle size={20} /> Shuffle & Start
              </button>
            </div>
          </div>
        ) : (
          /* Standard Flashcard View (or Test Running View) */
          <>
            {/* Info & Toolbar */}
            <div className="w-full flex justify-between items-center mb-2 md:mb-4 px-2">
              <span className="text-slate-400 font-bold text-xs md:text-sm uppercase tracking-wider">
                {viewMode === 'sheet' ? 'Select a fact' : `Card ${currentIndex + 1} / ${deck.length}`}
              </span>
              <div className="flex gap-2">
                {activeMode === 'test' && (
                  <button
                    onClick={() => setTestState('setup')}
                    className="p-2 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors"
                    title="Configure Test"
                  >
                    <Settings size={20} />
                  </button>
                )}
                <button
                   onClick={() => setViewMode(prev => prev === 'card' ? 'sheet' : 'card')}
                   className={`p-2 rounded-full transition-colors ${viewMode === 'sheet' ? 'bg-blue-light text-ps-blue' : 'text-slate-400 hover:bg-slate-200'}`}
                   title={viewMode === 'card' ? "View All Facts" : "Back to Flashcards"}
                   aria-label={viewMode === 'card' ? "Switch to grid view" : "Switch to flashcard view"}
                 >
                   {viewMode === 'card' ? <LayoutGrid size={24} /> : <CreditCard size={24} />}
                </button>
                <button
                   onClick={() => {
                     setCurrentIndex(0);
                     setIsFlipped(false);
                     setShowVisual(false);
                     setViewMode('card');
                   }}
                   className="p-2 rounded-full text-slate-400 hover:bg-slate-200 transition-colors"
                   title="Restart Set"
                   aria-label="Restart flashcard set"
                 >
                   <RefreshCw size={24} />
                 </button>
                <button
                   onClick={() => setAudioEnabled(!audioEnabled)}
                   className={`p-2 rounded-full transition-colors ${audioEnabled ? 'text-ps-blue bg-blue-light' : 'text-slate-400 hover:bg-slate-200'}`}
                   title="Toggle Audio"
                   aria-label={audioEnabled ? "Turn audio off" : "Turn audio on"}
                 >
                   {audioEnabled ? <Volume2 size={24} /> : <VolumeX size={24} />}
                 </button>
              </div>
            </div>

            {/* --- MAIN CONTENT AREA --- */}

        {viewMode === 'sheet' ? (
          /* SHEET / GRID VIEW */
          <div className="w-full grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 max-h-[60vh] overflow-y-auto p-2">
            {deck.map((card, idx) => (
              <button
                key={card.id}
                onClick={() => {
                  setCurrentIndex(idx);
                  setIsFlipped(false);
                  setShowVisual(false);
                  setViewMode('card');
                }}
                className={`
                  p-4 rounded-xl font-bold text-lg shadow-sm border-2 transition-all
                  ${currentIndex === idx
                    ? 'bg-blue-light border-ps-blue text-ps-blue ring-2 ring-blue-light'
                    : 'bg-white border-slate-200 text-slate-600 hover:border-ps-blue hover:shadow-md'}
                `}
                aria-label={`Select math fact ${card.q}`}
              >
                {card.q}
              </button>
            ))}
          </div>
        ) : (
          /* FLASHCARD VIEW */
          <div className="flex flex-col items-center justify-center w-full my-auto">
            <div
              ref={cardRef}
              role="button"
              tabIndex={0}
              onKeyDown={handleKeyDown}
              onClick={handleCardInteraction}
              aria-label={`Math problem: ${currentCard.q}. ${isFlipped ? `Answer is ${currentCard.a}` : "Tap to reveal answer"}`}
              className={`
                relative w-full min-h-[18rem] md:min-h-0 md:aspect-[16/9] md:max-h-[50vh] bg-white rounded-3xl shadow-xl
                flex flex-col items-center justify-center transition-all duration-300 overflow-hidden
                border-b-8 cursor-pointer focus-visible:ring-4 focus-visible:ring-offset-2 focus-visible:ring-ps-orange outline-none
                ${cardColor(currentCard).border}
                ${teacherMode && hasCustomAudio ? 'ring-4 ring-orange-400 ring-offset-2' : ''}
              `}
            >
              {/* Custom Audio Indicator (Badge) */}
              {teacherMode && hasCustomAudio && (
                  <div className="absolute top-0 left-0 bg-orange-400 text-white text-[10px] font-bold px-2 py-1 rounded-br-lg z-30">
                      CUSTOM AUDIO
                  </div>
              )}

              {/* Visualization Mode */}
              {showVisual ? (
                <>
                  {teacherMode && (
                     <div className="absolute top-4 left-4 z-50">
                        <AudioRecorder cardStableId={currentCard.stableId} type="visual" onSave={saveAudio} />
                        <span className="ml-10 text-xs text-red-500 font-bold bg-white px-1 rounded">REC VISUAL</span>
                     </div>
                  )}
                  <Visualizer visual={currentCard.visual} />
                </>
              ) : (
                /* Number Mode */
                <div className="text-center w-full px-2 md:px-4 relative">

                  {/* Teacher Mode Recorders */}
                  {teacherMode && !isFlipped && (
                     <div className="absolute -top-16 left-0 right-0 flex justify-center z-50 pointer-events-auto">
                        <div className="flex items-center gap-2 bg-white p-2 rounded-lg shadow-sm border border-slate-200">
                           <span className="text-xs font-bold text-slate-500">Q:</span>
                           <div className="relative w-8 h-8"><AudioRecorder cardStableId={currentCard.stableId} type="q" onSave={saveAudio} /></div>
                        </div>
                     </div>
                  )}

                  {teacherMode && isFlipped && (
                     <div className="absolute -top-16 left-0 right-0 flex justify-center z-50 pointer-events-auto">
                        <div className="flex items-center gap-2 bg-white p-2 rounded-lg shadow-sm border border-slate-200">
                           <span className="text-xs font-bold text-slate-500">A:</span>
                           <div className="relative w-8 h-8"><AudioRecorder cardStableId={currentCard.stableId} type="a" onSave={saveAudio} /></div>
                        </div>
                     </div>
                  )}

                  <div className="flex flex-row flex-wrap items-center justify-center gap-x-2 gap-y-4 md:gap-8 min-h-[15vh]">
                    {/* Question */}
                    <div className={`text-4xl sm:text-6xl md:text-8xl font-bold ${cardColor(currentCard).text} whitespace-nowrap`}>
                      {currentCard.q} <span className="text-slate-400">=</span>
                    </div>

                    {/* Answer (revealed or placeholder) */}
                    <div className={`
                      text-4xl sm:text-6xl md:text-8xl font-bold ${cardColor(currentCard).text} min-w-[1ch] transition-opacity duration-300
                      ${isFlipped ? 'opacity-100' : 'opacity-0'}
                    `}>
                      {currentCard.a}
                    </div>
                  </div>

                  {!isFlipped && !teacherMode && (
                     <div className="absolute bottom-[-3rem] left-0 right-0 text-slate-400 text-sm md:text-lg font-medium animate-pulse" aria-hidden="true">
                       Tap card to reveal answer
                     </div>
                  )}
                  {teacherMode && (
                      <div className="absolute bottom-[-3rem] left-0 right-0 text-amber-500 text-sm font-bold">
                        {isFlipped ? "Flip back to record question" : "Flip to record answer"}
                        <button
                            className="ml-4 underline"
                            onClick={(e) => { e.stopPropagation(); setIsFlipped(!isFlipped); }}
                        >
                            Flip Card
                        </button>
                      </div>
                  )}
                </div>
              )}
            </div>

            {/* Action Bar — min-h keeps height constant between the "Thinking" and "Next" states so the card above never re-centers/jumps on reveal */}
            <div className="w-full mt-4 md:mt-6 min-h-[3.75rem] flex justify-between items-center gap-2 md:gap-4 px-1">

              {/* Visualize Toggle */}
              <button
                onClick={(e) => { e.stopPropagation(); setShowVisual(!showVisual); }}
                className={`
                  flex items-center gap-2 px-3 md:px-6 py-3 rounded-xl font-bold transition-all shadow-md flex-1 md:flex-none justify-center
                  ${showVisual
                    ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                    : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'}
                `}
                aria-label={showVisual ? "Show numbers only" : "Visualize math with pictures"}
              >
                {showVisual ? (
                  <><Calculator size={20} className="md:w-8 md:h-8" aria-hidden="true"/> <span className="text-sm md:text-base">Numbers</span></>
                ) : (
                  <><ColoredChartIcon size={24} /> <span className="text-sm md:text-base">Visualize</span></>
                )}
              </button>

              {/* Next Button */}
              <div className="flex-1 flex justify-end">
                {(isFlipped || showVisual) ? (
                  <button
                    onClick={handleNext}
                    className="flex items-center gap-2 bg-ps-teal text-white px-4 md:px-8 py-3 rounded-xl text-lg font-bold shadow-lg hover:brightness-95 hover:scale-105 transition-all w-full md:w-auto justify-center"
                    aria-label="Next Card"
                  >
                    Next <ArrowRight size={24} className="md:w-8 md:h-8" aria-hidden="true" />
                  </button>
                ) : (
                  <div className="px-4 md:px-8 py-3 text-slate-400 italic text-sm md:text-base text-center w-full md:w-auto" aria-hidden="true">Thinking...</div>
                )}
              </div>
            </div>
          </div>
        )}
        </>
      )}
      </div>
    </div>
  );
};

export default FlashcardApp;
