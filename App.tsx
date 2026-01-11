
import React, { useState, useRef, useEffect } from 'react';
import { Radio, Loader2, AlertCircle, Settings, BookOpen, Headphones, Play } from 'lucide-react';
import { AppState, AppSettings, DEFAULT_SETTINGS } from './types';
import { summarizeArticles, generateSpeech } from './services/aiService';
import { ArticleInput } from './components/ArticleInput';
import { Player } from './components/Player';
import { SettingsModal } from './components/SettingsModal';

declare global {
  interface Window {
    webkitAudioContext: typeof AudioContext;
  }
}

const getAudioContext = () => {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  return new AudioContextClass({ sampleRate: 24000 });
};

export default function App() {
  const [textInput, setTextInput] = useState('');
  const [summary, setSummary] = useState('');
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [errorDetails, setErrorDetails] = useState<string>('');
  
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSettingsLoaded, setIsSettingsLoaded] = useState(false);

  const audioContextRef = useRef<AudioContext | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('app_settings');
    if (saved) {
      try {
        setSettings({...DEFAULT_SETTINGS, ...JSON.parse(saved)});
      } catch (e) {
        console.error("Failed to parse settings", e);
      }
    } else {
        if (process.env.API_KEY) {
            setSettings(s => ({
                ...s,
                llm: { ...s.llm, apiKey: process.env.API_KEY || '' },
                tts: { ...s.tts, apiKey: process.env.API_KEY || '' }
            }));
        }
    }
    setIsSettingsLoaded(true);
  }, []);

  // --- Auto-Transition Logic ---
  // When state becomes READY (summary generated), scroll smoothly to the result view.
  useEffect(() => {
    if (appState === AppState.READY && summary && resultsRef.current) {
        // Small delay to ensure DOM render
        setTimeout(() => {
            const headerOffset = 80; // Approximate header height
            const elementPosition = resultsRef.current!.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
      
            window.scrollTo({
              top: offsetPosition,
              behavior: "smooth"
            });
        }, 150);
    }
  }, [appState, summary]);

  const handleSaveSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    localStorage.setItem('app_settings', JSON.stringify(newSettings));
  };

  // 1. Generate Summary
  const handleGenerateSummary = async () => {
    if (!textInput.trim()) return;
    try {
      setErrorDetails('');
      setAppState(AppState.GENERATING_SUMMARY);
      setSummary(''); 
      setAudioBuffer(null);

      const summaryText = await summarizeArticles(textInput, settings);
      setSummary(summaryText);
      setAppState(AppState.READY); 
    } catch (error: any) {
      handleError(error);
    }
  };

  // 2. Generate Audio (Manual Trigger)
  const handleGenerateAudio = async () => {
    if (!summary) return;
    if (!audioContextRef.current) audioContextRef.current = getAudioContext();

    try {
      setAppState(AppState.GENERATING_AUDIO);
      const buffer = await generateSpeech(summary, audioContextRef.current, settings);
      setAudioBuffer(buffer);
      setAppState(AppState.READY);
    } catch (error: any) {
      handleError(error);
    }
  };

  const handleError = (error: any) => {
      console.error(error);
      setAppState(AppState.ERROR);
      let msg = error.message || String(error);
      if (msg.includes('SAFETY')) {
        msg = settings.language === 'zh-CN' ? "内容被安全过滤器拦截。" : "Content blocked by safety filters.";
      }
      setErrorDetails(msg);
  };

  const isConfigMissing = !settings.llm.apiKey;
  
  const t = settings.language === 'zh-CN' ? {
    title: '通勤简报',
    configMissing: '请点击设置图标配置 API Key',
    summaryTitle: '今日简报',
    readTime: 'AI 深度总结',
    generateAudio: '生成语音播报',
    generatingAudioBtn: '正在合成语音...',
    generatingSummary: 'AI 正在阅读...',
    prepare: '准备就绪',
    prepareDesc: '在左侧粘贴内容，我们将为您提炼重点。'
  } : {
    title: 'Daily Briefing',
    configMissing: 'Please configure API Key',
    summaryTitle: 'Today\'s Briefing',
    readTime: 'AI Summary',
    generateAudio: 'Generate Audio',
    generatingAudioBtn: 'Synthesizing...',
    generatingSummary: 'Reading articles...',
    prepare: 'Ready',
    prepareDesc: 'Paste content to start.'
  };

  if (!isSettingsLoaded) return null;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSave={handleSaveSettings}
      />

      {/* Global Header */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200/60 shadow-sm safe-top transition-all">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="bg-indigo-600 p-1.5 rounded-lg text-white">
              <Radio className="w-4 h-4" />
            </div>
            <h1 className="font-bold text-lg tracking-tight text-slate-800">{t.title}</h1>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 text-slate-400 hover:bg-slate-100 hover:text-indigo-600 rounded-full transition-colors relative"
            >
              <Settings className="w-5 h-5" />
              {isConfigMissing && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        
        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-start">
          
          {/* LEFT: Input Column */}
          {/* Automatically hide/shrink on mobile when reading to focus on content, or keep visible but secondary */}
          <div className={`lg:col-span-4 flex flex-col gap-4 transition-all duration-500 ease-in-out ${appState === AppState.READY ? 'order-2 lg:order-1 opacity-80 lg:opacity-100' : 'order-1'}`}>
            <div className="sticky top-20">
                <ArticleInput 
                  value={textInput}
                  onChange={setTextInput}
                  onGenerateSummary={handleGenerateSummary}
                  isGeneratingSummary={appState === AppState.GENERATING_SUMMARY}
                  disabled={isConfigMissing}
                />
                
                {!isConfigMissing && appState === AppState.IDLE && (
                    <div className="mt-4 p-4 bg-white/50 border border-slate-200/50 rounded-2xl text-xs text-slate-400 text-center">
                        <p>{t.prepareDesc}</p>
                    </div>
                )}
            </div>
          </div>

          {/* RIGHT: Output Column (Reading View) */}
          <div 
             ref={resultsRef} 
             className={`lg:col-span-8 flex flex-col gap-6 min-h-[60vh] transition-all duration-500 ${appState === AppState.READY ? 'order-1 lg:order-2' : 'order-2 lg:order-2'}`}
          >
            
            {/* Error State */}
            {(appState === AppState.ERROR || errorDetails) && (
              <div className="bg-red-50 border border-red-100 text-red-700 p-4 rounded-2xl text-sm flex items-start gap-3 animate-in fade-in slide-in-from-top-4">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div>
                   <span className="font-semibold block mb-1">Error</span>
                   <span className="opacity-90 leading-snug">{errorDetails}</span>
                </div>
              </div>
            )}

            {/* Empty/Idle State */}
            {appState === AppState.IDLE && (
              <div className="h-full flex flex-col items-center justify-center p-12 text-center border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50 text-slate-400">
                <BookOpen className="w-12 h-12 mb-4 opacity-20" />
                <p className="text-sm font-medium">Waiting for content...</p>
              </div>
            )}

            {/* Loading Summary State */}
            {appState === AppState.GENERATING_SUMMARY && (
              <div className="bg-white rounded-3xl p-12 shadow-sm border border-slate-100 flex flex-col items-center justify-center gap-6 min-h-[400px]">
                <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
                <p className="text-slate-500 font-medium animate-pulse">{t.generatingSummary}</p>
              </div>
            )}

            {/* Reading View (Summary Ready) */}
            {(appState === AppState.READY || appState === AppState.GENERATING_AUDIO) && (
              <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-700">
                
                {/* 1. Reader Header (Sticky) */}
                <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm border-b border-slate-100 px-6 sm:px-8 py-4 flex items-center justify-between gap-4">
                    <div>
                        <h2 className="font-serif font-bold text-lg text-slate-800 leading-tight">{t.summaryTitle}</h2>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded tracking-wide uppercase">AI BRIEF</span>
                            <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">{t.readTime}</span>
                        </div>
                    </div>

                    {/* Action Area: Generate Audio OR Player */}
                    <div className="flex-shrink-0">
                        {audioBuffer ? (
                           <div className="animate-in fade-in zoom-in duration-300 origin-right">
                              <Player audioBuffer={audioBuffer} context={audioContextRef.current!} />
                           </div>
                        ) : (
                           <button 
                             onClick={handleGenerateAudio}
                             disabled={appState === AppState.GENERATING_AUDIO}
                             className={`
                                group flex items-center gap-2 pl-3 pr-4 py-2 rounded-full text-sm font-medium border transition-all duration-300
                                ${appState === AppState.GENERATING_AUDIO
                                   ? 'bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed'
                                   : 'bg-indigo-50 border-indigo-100 text-indigo-700 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 shadow-sm'
                                }
                             `}
                           >
                             {appState === AppState.GENERATING_AUDIO ? (
                               <Loader2 className="w-4 h-4 animate-spin" />
                             ) : (
                               <div className="bg-white text-indigo-600 rounded-full p-1 shadow-sm group-hover:bg-white/20 group-hover:text-white transition-colors">
                                  <Headphones className="w-3 h-3" />
                               </div>
                             )}
                             <span>
                                {appState === AppState.GENERATING_AUDIO ? t.generatingAudioBtn : t.generateAudio}
                             </span>
                           </button>
                        )}
                    </div>
                </div>

                {/* 2. Content Body */}
                <article className="p-8 sm:p-12">
                  <div className="prose prose-slate prose-lg max-w-none 
                    prose-headings:font-serif prose-headings:font-bold prose-headings:text-slate-800 
                    prose-p:font-serif prose-p:text-slate-600 prose-p:leading-8 prose-p:mb-6 
                    first-letter:text-5xl first-letter:font-bold first-letter:text-indigo-600 first-letter:mr-3 first-letter:float-left first-letter:leading-none">
                    {summary.split('\n').map((para, i) => {
                        const trimmed = para.trim();
                        if (!trimmed) return null;
                        return <p key={i}>{trimmed}</p>;
                    })}
                  </div>
                  
                  <div className="mt-16 pt-8 border-t border-slate-100 flex justify-center">
                     <div className="flex gap-2">
                        {[1,2,3].map(i => <div key={i} className="w-1.5 h-1.5 rounded-full bg-slate-300" />)}
                     </div>
                  </div>
                </article>

              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
