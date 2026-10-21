import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Sparkles,
  MessageCircle,
  X,
  Send,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Copy,
  Check,
  Bot,
  User,
  RotateCcw,
  ShieldCheck,
  Languages,
  ChevronDown,
} from 'lucide-react';

import { BiodataContent } from '../../types/biodata';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

interface AIChatbotProps {
  lang?: 'en' | 'bn';
  biodata?: BiodataContent;
}

// Extend Window interface for Web Speech API recognition
interface SpeechRecognitionEvent {
  results: {
    [index: number]: {
      [index: number]: {
        transcript: string;
      };
    };
  };
}

interface SpeechRecognitionInstance {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onstart: (() => void) | null;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
}

export const AIChatbot: React.FC<AIChatbotProps> = ({ lang: initialLang = 'en', biodata }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentLang, setCurrentLang] = useState<'en' | 'bn'>(initialLang);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [speakingId, setSpeakingId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const isRecognizingRef = useRef(false);

  // Initial welcome message in both languages
  const getWelcomeMessage = (l: 'en' | 'bn'): ChatMessage => {
    const nameEn = biodata?.header?.name || 'Md. Nasir Uddin';
    const nameBn = biodata?.header?.nameBn || 'মোঃ নাসির উদ্দিন';
    return {
      id: 'welcome-msg',
      role: 'assistant',
      text:
        l === 'bn'
          ? `আসসালামু আলাইকুম! আমি ${nameBn}-এর বায়োডাটা এআই সহকারী। আপনি তার পেশা, শিক্ষা, পারিবারিক পটভূমি, দ্বীনি মূল্যবোধ বা জীবনসঙ্গিনীর প্রত্যাশা সম্পর্কে ভয়েস বা লিখে যেকোনো প্রশ্ন করতে পারেন।`
          : `Assalamu Alaikum! I am ${nameEn}'s matrimonial AI Assistant. Feel free to ask me anything about his profession, education, family background, religious outlook, or preferred life partner criteria via voice or text.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
  };

  const [messages, setMessages] = useState<ChatMessage[]>([getWelcomeMessage(initialLang)]);

  // Quick starter prompt suggestions
  const quickPrompts =
    currentLang === 'bn'
      ? [
          'নাসির উদ্দিনের পেশা ও কর্মক্ষেত্র কী?',
          'তার শিক্ষাগত যোগ্যতা সম্পর্কে বলুন',
          'পারিবারিক পটভূমি কেমন?',
          'জীবনসঙ্গিনী সম্পর্কে প্রত্যাশা কী?',
          'তার শখ ও পছন্দগুলো কী?',
        ]
      : [
          "What is Nasir's profession & career?",
          'Tell me about his educational background',
          'What is his family background?',
          'What are his partner preferences?',
          'What are his hobbies and values?',
        ];

  // Stop active speech recognition safely
  const stopListening = useCallback(() => {
    isRecognizingRef.current = false;
    setIsListening(false);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (e) {
        console.warn('Error aborting speech recognition:', e);
      }
      recognitionRef.current = null;
    }
  }, []);

  // Check speech recognition capability on mount
  useEffect(() => {
    const SpeechRecognitionAPI =
      (window as unknown as { SpeechRecognition?: new () => SpeechRecognitionInstance }).SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: new () => SpeechRecognitionInstance }).webkitSpeechRecognition;

    if (SpeechRecognitionAPI) {
      setSpeechSupported(true);
    }
  }, []);

  // Cleanup speech recognition on unmount
  useEffect(() => {
    return () => {
      stopListening();
    };
  }, [stopListening]);

  // Handle ESC key press to close chatbot modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Start speech recognition safely using a fresh instance to avoid InvalidStateError
  const startListening = useCallback(() => {
    const SpeechRecognitionAPI =
      (window as unknown as { SpeechRecognition?: new () => SpeechRecognitionInstance }).SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: new () => SpeechRecognitionInstance }).webkitSpeechRecognition;

    if (!SpeechRecognitionAPI) {
      alert(
        currentLang === 'bn'
          ? 'আপনার ব্রাউজার ভয়েস রিকগনিশন সমর্থন করে না। অনুগ্রহ করে ক্রোম বা এজ ব্রাউজার ব্যবহার করুন।'
          : 'Voice input is not supported in this browser. Please use Chrome or Edge.'
      );
      return;
    }

    // Stop and clear any existing recognition instance first
    stopListening();

    try {
      const recog = new SpeechRecognitionAPI();
      recog.continuous = false;
      recog.interimResults = true;
      recog.lang = currentLang === 'bn' ? 'bn-BD' : 'en-US';

      recog.onstart = () => {
        isRecognizingRef.current = true;
        setIsListening(true);
      };

      recog.onresult = (event: SpeechRecognitionEvent) => {
        const transcript = event.results[0]?.[0]?.transcript || '';
        setInputText(transcript);
      };

      recog.onerror = (e) => {
        console.warn('Speech recognition error:', e.error);
        isRecognizingRef.current = false;
        setIsListening(false);
        recognitionRef.current = null;
      };

      recog.onend = () => {
        isRecognizingRef.current = false;
        setIsListening(false);
        recognitionRef.current = null;
      };

      recognitionRef.current = recog;
      isRecognizingRef.current = true;
      setIsListening(true);
      recog.start();
    } catch (err) {
      console.warn('Failed to start speech recognition:', err);
      isRecognizingRef.current = false;
      setIsListening(false);
      recognitionRef.current = null;
    }
  }, [currentLang, stopListening]);

  const toggleListening = () => {
    if (isListening || isRecognizingRef.current) {
      stopListening();
    } else {
      startListening();
    }
  };

  // Scroll to bottom whenever messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Focus input on dialog open and cleanup voice audio/mic when closed
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    } else {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      setSpeakingId(null);
      stopListening();
    }
  }, [isOpen, stopListening]);

  const speakText = (text: string, msgId: string) => {
    if (!('speechSynthesis' in window)) return;

    if (speakingId === msgId) {
      window.speechSynthesis.cancel();
      setSpeakingId(null);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = /[\u0980-\u09FF]/.test(text) ? 'bn-BD' : 'en-US';
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onend = () => setSpeakingId(null);
    utterance.onerror = () => setSpeakingId(null);

    setSpeakingId(msgId);
    window.speechSynthesis.speak(utterance);
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSend = async (textToSend?: string) => {
    const query = (textToSend || inputText).trim();
    if (!query || isLoading) return;

    stopListening();

    const userMessage: ChatMessage = {
      id: 'usr_' + Date.now(),
      role: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          history: messages.map((m) => ({
            role: m.role === 'user' ? 'user' : 'model',
            text: m.text,
          })),
          lang: currentLang,
          biodata,
        }),
      });

      const data = await response.json().catch(() => null);
      const replyText =
        data?.reply ||
        (currentLang === 'bn'
          ? 'মোঃ নাসির উদ্দিনের বায়োডাটাতে আপনাকে ধন্যবাদ। অনুগ্রহ করে অন্যান্য তথ্য জানতে প্রশ্ন করুন।'
          : "Thank you for inquiring about Md. Nasir Uddin's biodata. Please feel free to ask any other questions!");

      const assistantMessage: ChatMessage = {
        id: 'ast_' + Date.now(),
        role: 'assistant',
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      if (autoSpeak) {
        speakText(replyText, assistantMessage.id);
      }
    } catch (err) {
      console.error('Chat error:', err);
      const nameEn = biodata?.header?.name || 'Md. Nasir Uddin';
      const nameBn = biodata?.header?.nameBn || 'মোঃ নাসির উদ্দিন';
      const titleEn = biodata?.header?.title || 'Assistant Authorized Officer';
      const titleBn = biodata?.header?.titleBn || 'সহকারী অথরাইজড অফিসার';
      const errorMessage: ChatMessage = {
        id: 'err_' + Date.now(),
        role: 'assistant',
        text:
          currentLang === 'bn'
            ? `${nameBn} (${titleBn}) সংক্রান্ত তথ্যে আপনাকে স্বাগতম। আপনি তার শিক্ষা, পেশা, পরিবার ও জীবনসঙ্গিনীর প্রত্যাশা সম্পর্কে প্রশ্ন করতে পারেন।`
            : `Welcome to ${nameEn}'s (${titleEn}) matrimonial profile. Feel free to ask about his education, career, family, or partner preferences!`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleResetChat = () => {
    setMessages([getWelcomeMessage(currentLang)]);
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    setSpeakingId(null);
  };

  return (
    <>
      {/* ══ FLOATING LAUNCHER BUTTON ══ */}
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-[9500] flex items-center gap-3 animate-fadeIn no-print ai-chatbot-root">
          {/* Teaser Tooltip Badge */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/80 border border-amber-500/30 text-[11px] text-amber-300 shadow-xl backdrop-blur-md">
            <Sparkles size={12} className="text-amber-400 animate-spin" />
            <span>Ask about Nasir · ভয়েস বা টেক্সট</span>
          </div>

          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="group relative w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#f0b840] via-[#e8547a] to-[#9b51e0] p-[2px] shadow-2xl shadow-amber-500/30 hover:scale-108 active:scale-95 transition-all duration-300 cursor-pointer"
            title="Open AI Matrimonial Assistant"
            aria-label="Open AI Matrimonial Assistant"
          >
            <div className="w-full h-full rounded-2xl bg-black/40 backdrop-blur-md flex items-center justify-center text-white group-hover:bg-transparent transition-colors">
              <Bot size={26} className="text-amber-200 group-hover:text-black transition-colors" />
            </div>

            {/* Pulsing notification indicator */}
            <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border border-black"></span>
            </span>
          </button>
        </div>
      )}

      {/* ══ CHATBOT DIALOG MODAL ══ */}
      {isOpen && (
        <>
          {/* Backdrop overlay to close on outside click */}
          <div
            className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-xs sm:bg-black/30 transition-opacity"
            onClick={() => setIsOpen(false)}
            aria-label="Close Chatbot Overlay"
          />

          <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[10000] w-[calc(100vw-2rem)] sm:w-[430px] h-[600px] max-h-[88vh] rounded-3xl bg-gradient-to-b from-[#180a2c] via-[#100720] to-[#0a0515] border border-amber-500/30 shadow-2xl flex flex-col overflow-hidden text-[#f0ead8] animate-fadeIn backdrop-blur-2xl no-print ai-chatbot-root">
            {/* Ambient background glows */}
            <div className="absolute -top-20 -right-20 w-44 h-44 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-20 -left-20 w-44 h-44 rounded-full bg-purple-500/10 blur-3xl pointer-events-none" />

            {/* ══ HEADER ══ */}
            <header className="relative z-10 flex items-center justify-between px-4 py-3.5 bg-white/5 border-b border-white/10 backdrop-blur-md">
              <div className="flex items-center gap-2.5">
                <div className="relative w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-400 to-rose-400 flex items-center justify-center text-black shadow-md">
                  <Bot size={20} />
                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border border-black" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-serif font-bold text-white flex items-center gap-1.5">
                    <span>{currentLang === 'bn' ? 'নাসিরের এআই সহকারী' : "Nasir's AI Assistant"}</span>
                    <Sparkles size={12} className="text-amber-400" />
                  </h3>
                  <p className="text-[10px] text-white/50 flex items-center gap-1">
                    <ShieldCheck size={11} className="text-emerald-400" />
                    <span>Matrimonial Inquiries · Protected</span>
                  </p>
                </div>
              </div>

              {/* Top actions */}
              <div className="flex items-center gap-1">
                {/* Language Switch */}
                <button
                  type="button"
                  onClick={() => {
                    const next = currentLang === 'en' ? 'bn' : 'en';
                    setCurrentLang(next);
                    setMessages((prev) => [
                      ...prev,
                      {
                        id: 'lang_' + Date.now(),
                        role: 'assistant',
                        text:
                          next === 'bn'
                            ? 'ভাষা বাংলায় পরিবর্তিত হয়েছে। নাসিরের বায়োডাটা সম্পর্কে প্রশ্ন করুন।'
                            : "Language switched to English. Ask any question about Nasir's biodata.",
                        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                      },
                    ]);
                  }}
                  className="px-2 py-1 rounded-lg bg-white/10 hover:bg-white/15 text-[11px] font-medium text-white transition flex items-center gap-1 cursor-pointer border border-white/10"
                  title="Switch Language (English / বাংলা)"
                >
                  <Languages size={12} />
                  <span>{currentLang === 'en' ? 'বাংলা' : 'EN'}</span>
                </button>

                {/* Auto Speak Toggle */}
                <button
                  type="button"
                  onClick={() => setAutoSpeak(!autoSpeak)}
                  className={`p-1.5 rounded-lg transition cursor-pointer border ${
                    autoSpeak
                      ? 'bg-amber-400/20 text-amber-300 border-amber-400/30'
                      : 'bg-white/5 text-white/40 border-white/10 hover:text-white'
                  }`}
                  title={autoSpeak ? 'Disable Auto Voice Readout' : 'Enable Auto Voice Readout'}
                >
                  {autoSpeak ? <Volume2 size={14} /> : <VolumeX size={14} />}
                </button>

                {/* Reset Chat */}
                <button
                  type="button"
                  onClick={handleResetChat}
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-white/50 hover:text-white transition cursor-pointer border border-white/10"
                  title="Reset conversation"
                >
                  <RotateCcw size={14} />
                </button>

                {/* Prominent High-Visibility Close Button */}
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-2.5 py-1 rounded-xl bg-red-500/25 text-red-200 hover:bg-red-500 hover:text-white transition cursor-pointer border border-red-500/40 flex items-center gap-1 text-xs font-semibold shadow-sm ml-1 active:scale-95"
                  title="Close AI Assistant (Esc)"
                >
                  <X size={14} />
                  <span>Close</span>
                </button>
              </div>
            </header>

          {/* ══ MESSAGES FEED ══ */}
          <div className="relative z-10 flex-1 overflow-y-auto p-4 space-y-3.5 no-scrollbar">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-amber-400 to-rose-400 flex items-center justify-center text-black shrink-0 mt-0.5 shadow-md">
                    <Bot size={14} />
                  </div>
                )}

                <div
                  className={`relative max-w-[82%] rounded-2xl p-3 text-xs leading-relaxed shadow-lg ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-black font-medium rounded-br-none'
                      : 'bg-white/10 border border-white/10 text-white/90 rounded-bl-none'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.text}</p>

                  <div
                    className={`flex items-center justify-between gap-2 mt-1.5 pt-1 border-t text-[10px] ${
                      msg.role === 'user'
                        ? 'border-black/15 text-black/60'
                        : 'border-white/10 text-white/40'
                    }`}
                  >
                    <span>{msg.timestamp}</span>

                    {msg.role === 'assistant' && (
                      <div className="flex items-center gap-1.5">
                        {/* Audio Playback button */}
                        <button
                          type="button"
                          onClick={() => speakText(msg.text, msg.id)}
                          className="hover:text-amber-300 transition cursor-pointer"
                          title="Listen to this response"
                        >
                          <Volume2
                            size={12}
                            className={speakingId === msg.id ? 'text-amber-400 animate-pulse' : ''}
                          />
                        </button>

                        {/* Copy text */}
                        <button
                          type="button"
                          onClick={() => handleCopy(msg.text, msg.id)}
                          className="hover:text-amber-300 transition cursor-pointer"
                          title="Copy message"
                        >
                          {copiedId === msg.id ? (
                            <Check size={12} className="text-emerald-400" />
                          ) : (
                            <Copy size={12} />
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {msg.role === 'user' && (
                  <div className="w-7 h-7 rounded-xl bg-white/20 border border-white/20 flex items-center justify-center text-white shrink-0 mt-0.5">
                    <User size={14} />
                  </div>
                )}
              </div>
            ))}

            {/* Animated Typing Indicator */}
            {isLoading && (
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-amber-400 to-rose-400 flex items-center justify-center text-black shrink-0 shadow-md">
                  <Bot size={14} />
                </div>
                <div className="p-3 rounded-2xl rounded-bl-none bg-white/10 border border-white/10 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-bounce" />
                  <span className="w-2 h-2 rounded-full bg-rose-400 animate-bounce [animation-delay:0.2s]" />
                  <span className="w-2 h-2 rounded-full bg-purple-400 animate-bounce [animation-delay:0.4s]" />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* ══ QUICK PROMPT SUGGESTIONS ══ */}
          {messages.length <= 3 && !isLoading && (
            <div className="px-3 pb-2 flex gap-1.5 overflow-x-auto no-scrollbar relative z-10">
              {quickPrompts.map((prompt, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSend(prompt)}
                  className="shrink-0 px-2.5 py-1 rounded-xl text-[10px] bg-white/5 hover:bg-white/15 border border-white/10 text-white/75 hover:text-white transition cursor-pointer flex items-center gap-1"
                >
                  <span>✨</span>
                  <span>{prompt}</span>
                </button>
              ))}
            </div>
          )}

          {/* ══ VOICE LISTENING WAVE OVERLAY ══ */}
          {isListening && (
            <div className="px-4 py-2 bg-gradient-to-r from-red-500/20 via-amber-500/20 to-purple-500/20 border-t border-white/10 flex items-center justify-between text-xs animate-pulse">
              <div className="flex items-center gap-2 text-amber-300">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                </span>
                <span className="font-medium">
                  {currentLang === 'bn' ? 'শুনছি... কথা বলুন' : 'Listening... Speak now'}
                </span>
              </div>
              <button
                type="button"
                onClick={toggleListening}
                className="text-[11px] underline text-white/60 hover:text-white cursor-pointer"
              >
                {currentLang === 'bn' ? 'থামুন' : 'Stop'}
              </button>
            </div>
          )}

          {/* ══ INPUT CONTROLS BAR ══ */}
          <footer className="relative z-10 p-3 bg-white/5 border-t border-white/10 backdrop-blur-md">
            <div className="flex items-center gap-2">
              {/* Voice Input Microphone Button */}
              <button
                type="button"
                onClick={toggleListening}
                className={`p-2.5 rounded-xl transition cursor-pointer border ${
                  isListening
                    ? 'bg-red-500 text-white border-red-400 shadow-lg shadow-red-500/30 animate-pulse'
                    : 'bg-white/10 hover:bg-white/20 text-white/80 hover:text-white border-white/10'
                }`}
                title={isListening ? 'Stop Listening' : 'Speak using Microphone'}
              >
                {isListening ? <MicOff size={16} /> : <Mic size={16} />}
              </button>

              {/* Text Input */}
              <div className="flex-1 relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    isListening
                      ? currentLang === 'bn'
                        ? 'আপনার ভয়েস গ্রহণ করা হচ্ছে...'
                        : 'Transcribing your voice...'
                      : currentLang === 'bn'
                      ? 'নাসির সম্পর্কে কিছু জিজ্ঞাসা করুন...'
                      : 'Ask anything about Nasir...'
                  }
                  className="w-full bg-black/40 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-white/40 focus:outline-none focus:border-amber-400 transition"
                />
              </div>

              {/* Send Button */}
              <button
                type="button"
                disabled={!inputText.trim() || isLoading}
                onClick={() => handleSend()}
                className="p-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black font-semibold disabled:opacity-40 transition cursor-pointer shadow-md disabled:cursor-not-allowed"
                title="Send Message"
              >
                <Send size={15} />
              </button>
            </div>

            <p className="text-[9px] text-white/40 text-center mt-2 flex items-center justify-center gap-1">
              <span>🔒 Administrative credentials protected</span>
              <span>·</span>
              <span>Voice & text enabled</span>
            </p>
          </footer>
        </div>
      </>
      )}
    </>
  );
};
