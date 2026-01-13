import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, ArrowRight, Calculator, RefreshCw, LayoutGrid, CreditCard, Plus, Minus, X, Equal, Mic, Square, Settings } from 'lucide-react';
import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc, collection, onSnapshot } from "firebase/firestore";

// --- FIREBASE SETUP ---
const firebaseConfig = JSON.parse(__firebase_config);
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

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

const generateId = () => Math.random().toString(36).substr(2, 9);

// Hook for Speech (TTS + Custom Audio)
const useSpeech = (customAudioMap) => {
  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState(null);
  const [enabled, setEnabled] = useState(true);
  const audioRef = useRef(new Audio());

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

    // Check for custom audio first
    if (customKey && customAudioMap[customKey]) {
      try {
        audioRef.current.src = customAudioMap[customKey];
        audioRef.current.play();
        return;
      } catch (e) {
        console.error("Error playing custom audio", e);
      }
    }

    // Fallback to TTS
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
        <div className="text-sm md:text-lg text-slate-500 font-semibold text-center mt-1">{v1} apples + {v2} apples = {total} apples</div>
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
        <div className="text-sm md:text-lg text-slate-500 font-semibold text-center mt-1">Start with {v1}, take away {v2} = {remaining} left</div>
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
        <div className="text-sm md:text-lg text-slate-500 font-semibold text-center mt-1">{v1} baskets × {v2} apples = {total} apples</div>
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
           <span className="text-sm md:text-lg text-slate-500 font-semibold">
             {v1} apples shared into {baskets} baskets means <span className="text-emerald-600 font-bold">{applesPerBasket} apples</span> in each.
           </span>
           <span className="text-base md:text-xl text-indigo-600 font-bold mt-1">
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

  // Initialize Teacher Mode based on URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('mode') === 'teacher') {
      setTeacherMode(true);
    }
  }, []);

  // Firebase Auth & Data Fetching
  useEffect(() => {
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

  useEffect(() => {
    if (!user) return;
    // Listen for custom audio map in Firestore
    const unsub = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'audio_clips'), (snapshot) => {
        const audioData = {};
        snapshot.forEach(doc => {
            audioData[doc.id] = doc.data().data; // base64 string
        });
        setCustomAudioMap(audioData);
    }, (error) => {
        console.error("Error fetching audio map:", error);
    });
    return () => unsub();
  }, [user]);

  const { playAudio, enabled: audioEnabled, setEnabled: setAudioEnabled } = useSpeech(customAudioMap);

  useEffect(() => {
    const newDeck = generateDeck(activeMode);
    setDeck(newDeck);
    setCurrentIndex(0);
    setIsFlipped(false);
    setShowVisual(false);
    setViewMode('card');
  }, [activeMode]);

  useEffect(() => {
    if (viewMode === 'card' && deck.length > 0) {
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
  }, [currentIndex, isFlipped, activeMode, showVisual, deck, viewMode]);

  const saveAudio = async (stableId, type, base64Data) => {
      if(!user) return;
      const docId = `${stableId}_${type}`;
      try {
          await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'audio_clips', docId), {
              data: base64Data,
              updatedAt: new Date().toISOString()
          });
      } catch (e) {
          console.error("Error saving audio:", e);
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
    if (currentIndex < deck.length - 1) {
      setIsFlipped(false);
      setShowVisual(false);
      setCurrentIndex(prev => prev + 1);
    } else {
      setCurrentIndex(0);
      setIsFlipped(false);
      setShowVisual(false);
    }
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

  const currentCard = deck[currentIndex] || { q: '', a: '' };
  const progress = deck.length > 0 ? ((currentIndex + 1) / deck.length) * 100 : 0;

  // Check if current card has ANY custom audio associated with it
  const hasCustomAudio = currentCard && (
      customAudioMap[`${currentCard.stableId}_q`] ||
      customAudioMap[`${currentCard.stableId}_a`] ||
      customAudioMap[`${currentCard.stableId}_visual`]
  );

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center font-sans">

      {/* Persistent Navigation Bar - ICONS MODE */}
      <div className="w-full bg-white shadow-sm z-20 sticky top-0" role="navigation" aria-label="Math Mode Selection">
        <div className="max-w-4xl mx-auto p-2">
          <div className="flex gap-2 w-full">
            <NavButton
              label="Add"
              icon={<Plus size={24} strokeWidth={3} className="md:w-7 md:h-7" aria-hidden="true" />}
              active={activeMode === 'addition'}
              colorClass="border-blue-500"
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
              colorClass="border-indigo-500"
              onClick={() => setActiveMode('addsub')}
            />
            <NavButton
              label="Mult"
              icon={<X size={24} strokeWidth={3} className="md:w-7 md:h-7" aria-hidden="true" />}
              active={activeMode === 'mult'}
              colorClass="border-emerald-500"
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
              colorClass="border-teal-500"
              onClick={() => setActiveMode('multdiv')}
            />
          </div>
        </div>
      </div>

      <div className="w-full h-2 bg-slate-200">
        <div className="h-full bg-indigo-500 transition-all duration-300" style={{ width: `${progress}%` }}></div>
      </div>

      <div className="flex-1 w-full max-w-3xl p-3 md:p-6 flex flex-col items-center relative">

        {/* Info & Toolbar */}
        <div className="w-full flex justify-between items-center mb-4 px-2 mt-2 md:mt-0">
           <span className="text-slate-400 font-bold text-xs md:text-sm uppercase tracking-wider">
             {viewMode === 'sheet' ? 'Select a fact' : `Card ${currentIndex + 1} / ${deck.length}`}
           </span>
           <div className="flex gap-2">
             <button
                onClick={() => setViewMode(prev => prev === 'card' ? 'sheet' : 'card')}
                className={`p-2 rounded-full transition-colors ${viewMode === 'sheet' ? 'bg-indigo-100 text-indigo-600' : 'text-slate-400 hover:bg-slate-200'}`}
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
                className={`p-2 rounded-full transition-colors ${audioEnabled ? 'text-blue-600 bg-blue-50' : 'text-slate-400 hover:bg-slate-200'}`}
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
          <div className="w-full grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 max-h-[70vh] overflow-y-auto p-2">
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
                    ? 'bg-indigo-50 border-indigo-500 text-indigo-700 ring-2 ring-indigo-200'
                    : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-300 hover:shadow-md'}
                `}
                aria-label={`Select math fact ${card.q}`}
              >
                {card.q}
              </button>
            ))}
          </div>
        ) : (
          /* FLASHCARD VIEW */
          <>
            <div
              ref={cardRef}
              role="button"
              tabIndex={0}
              onKeyDown={handleKeyDown}
              onClick={handleCardInteraction}
              aria-label={`Math problem: ${currentCard.q}. ${isFlipped ? `Answer is ${currentCard.a}` : "Tap to reveal answer"}`}
              className={`
                relative w-full aspect-[4/3] md:aspect-[16/9] bg-white rounded-3xl shadow-xl
                flex flex-col items-center justify-center transition-all duration-300 overflow-hidden
                border-b-8 cursor-pointer focus-visible:ring-4 focus-visible:ring-offset-2 focus-visible:ring-indigo-500 outline-none
                ${showVisual ? 'border-emerald-500' : (isFlipped ? 'border-indigo-500' : 'border-slate-300')}
                ${hasCustomAudio ? 'ring-4 ring-orange-400 ring-offset-2' : ''}
              `}
            >
              {/* Custom Audio Indicator (Badge) */}
              {hasCustomAudio && (
                  <div className="absolute top-0 left-0 bg-orange-400 text-white text-[10px] font-bold px-2 py-1 rounded-br-lg z-30">
                      CUSTOM AUDIO
                  </div>
              )}

              {/* Audio Replay (Always available) */}
              <button
                onClick={handleReplayAudio}
                className="absolute top-4 right-4 md:top-6 md:right-6 p-2 md:p-3 bg-slate-100 rounded-full hover:bg-slate-200 text-slate-600 transition-colors z-20 focus-visible:ring-2 focus-visible:ring-indigo-500"
                title="Replay Audio"
                aria-label="Replay Audio"
              >
                <Volume2 size={24} className="md:w-8 md:h-8" />
              </button>

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

                  <div className="flex flex-row flex-wrap items-center justify-center gap-x-2 gap-y-4 md:gap-8 min-h-[120px]">
                    {/* Question */}
                    <div className="text-4xl sm:text-6xl md:text-8xl font-bold text-slate-800 whitespace-nowrap">
                      {currentCard.q} <span className="text-slate-400">=</span>
                    </div>

                    {/* Answer (revealed or placeholder) */}
                    <div className={`
                      text-4xl sm:text-6xl md:text-8xl font-bold text-indigo-600 transition-all duration-500 min-w-[1ch]
                      ${isFlipped ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}
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

            {/* Action Bar */}
            <div className="w-full mt-6 flex justify-between items-center gap-2 md:gap-4 px-1">

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
                    className="flex items-center gap-2 bg-indigo-600 text-white px-4 md:px-8 py-3 rounded-xl text-lg font-bold shadow-lg hover:bg-indigo-700 hover:scale-105 transition-all w-full md:w-auto justify-center"
                    aria-label="Next Card"
                  >
                    Next <ArrowRight size={24} className="md:w-8 md:h-8" aria-hidden="true" />
                  </button>
                ) : (
                  <div className="px-4 md:px-8 py-3 text-slate-400 italic text-sm md:text-base text-center w-full md:w-auto" aria-hidden="true">Thinking...</div>
                )}
              </div>
            </div>
          </>
        )}

      </div>
    </div>
  );
};

export default FlashcardApp;