
import React, { useState, useEffect } from 'react';
import { X, Save, Settings, Globe, Cpu, Volume2, Key, Link as LinkIcon, AlertTriangle, RefreshCw, CheckCircle2, AlertCircle, PlayCircle, FileText, Download, Trash2, Bug } from 'lucide-react';
import { AppSettings, DEFAULT_SETTINGS, LLMProvider, TTSProvider } from '../types';
import { fetchModelsFromProvider, testLLMConnection, fetchTTSVoices, testTTSConnection, fetchTTSModels } from '../services/aiService';
import { logger, LogEntry } from '../services/logService';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSave: (newSettings: AppSettings) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, settings, onSave }) => {
  const [localSettings, setLocalSettings] = useState<AppSettings>(settings);
  const [activeTab, setActiveTab] = useState<'general' | 'llm' | 'tts' | 'debug'>('llm');
  
  // LLM State
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [isFetchingModels, setIsFetchingModels] = useState(false);
  const [fetchError, setFetchError] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);
  const [testMessage, setTestMessage] = useState('');

  // TTS State
  const [availableVoices, setAvailableVoices] = useState<string[]>([]);
  const [isFetchingVoices, setIsFetchingVoices] = useState(false);
  const [voiceMsg, setVoiceMsg] = useState<{ type: 'success' | 'error' | 'info', text: string } | null>(null);
  
  const [availableTTSModels, setAvailableTTSModels] = useState<string[]>([]);
  const [isFetchingTTSModels, setIsFetchingTTSModels] = useState(false);
  const [ttsFetchError, setTtsFetchError] = useState('');

  const [ttsTestResult, setTtsTestResult] = useState<'success' | 'error' | null>(null);
  const [isTestingTTS, setIsTestingTTS] = useState(false);
  const [ttsTestMessage, setTtsTestMessage] = useState('');

  // Logs State
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [autoRefreshLogs, setAutoRefreshLogs] = useState(false);

  // Common base voice names for dynamic generation
  const commonBaseVoices = [
    'alex', 'anna', 'bella', 'benjamin', 'charles', 'claire', 'david', 'dinah',
    'alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'
  ];

  useEffect(() => {
    if (isOpen) {
      setLocalSettings(settings);
      setTestResult(null);
      setTestMessage('');
      setTtsTestResult(null);
      setTtsTestMessage('');
      setVoiceMsg(null);
      setAvailableModels([]); 
      setAvailableTTSModels([]);
      setAvailableVoices([]);
      setLogs(logger.getLogs());
    }
  }, [isOpen, settings]);

  useEffect(() => {
     let interval: number;
     if (isOpen && activeTab === 'debug') {
         setLogs(logger.getLogs()); // Initial load
         interval = window.setInterval(() => {
             setLogs([...logger.getLogs()]); // Refresh
         }, 1000);
     }
     return () => clearInterval(interval);
  }, [isOpen, activeTab]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(localSettings);
    onClose();
  };

  // LLM Handlers
  const handleFetchModels = async () => {
    if (!localSettings.llm.apiKey) {
      setFetchError(localSettings.language === 'zh-CN' ? '请先填写 API Key' : 'API Key required');
      return;
    }
    
    setIsFetchingModels(true);
    setFetchError('');
    setAvailableModels([]);
    
    try {
      const models = await fetchModelsFromProvider(localSettings);
      setAvailableModels(models);
      if (models.length === 0) {
        setFetchError(localSettings.language === 'zh-CN' ? '未找到模型' : 'No models found');
      }
    } catch (e: any) {
      setFetchError(e.message || 'Error fetching models');
    } finally {
      setIsFetchingModels(false);
    }
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    setTestMessage('');
    try {
      await testLLMConnection(localSettings);
      setTestResult('success');
      setTestMessage(localSettings.language === 'zh-CN' ? '连接成功！' : 'Connection successful!');
    } catch (e: any) {
      setTestResult('error');
      setTestMessage(e.message || 'Connection failed');
    } finally {
      setIsTesting(false);
    }
  };

  // TTS Handlers
  const handleFetchTTSModels = async () => {
     const effectiveKey = localSettings.tts.apiKey || (localSettings.llm.provider === localSettings.tts.provider ? localSettings.llm.apiKey : '');
     
     if (!effectiveKey && localSettings.tts.provider !== 'gemini') {
        setTtsFetchError(localSettings.language === 'zh-CN' ? '需要 API Key' : 'API Key required');
        return;
     }

     setIsFetchingTTSModels(true);
     setTtsFetchError('');
     setAvailableTTSModels([]);

     try {
         const models = await fetchTTSModels(localSettings);
         setAvailableTTSModels(models);
         if (models.length === 0) {
             setTtsFetchError(localSettings.language === 'zh-CN' ? '未找到模型' : 'No models found');
         }
     } catch (e: any) {
         setTtsFetchError(e.message || "Failed");
     } finally {
         setIsFetchingTTSModels(false);
     }
  }

  const handleFetchVoices = async () => {
     const effectiveKey = localSettings.tts.apiKey || (localSettings.llm.provider === localSettings.tts.provider ? localSettings.llm.apiKey : '');
     setVoiceMsg(null);
     
     if (!effectiveKey && localSettings.tts.provider !== 'gemini') {
        setVoiceMsg({ type: 'error', text: localSettings.language === 'zh-CN' ? '需要 API Key' : 'API Key required' });
        return;
     }

     setIsFetchingVoices(true);
     setAvailableVoices([]);
     try {
         const voices = await fetchTTSVoices(localSettings);
         setAvailableVoices(voices);
         setVoiceMsg({ type: 'success', text: localSettings.language === 'zh-CN' ? `已更新 ${voices.length} 个角色` : `Updated ${voices.length} voices` });
     } catch(e: any) {
         setVoiceMsg({ type: 'error', text: e.message || "Failed" });
     } finally {
         setIsFetchingVoices(false);
     }
  }

  const handleTestTTS = async () => {
      setIsTestingTTS(true);
      setTtsTestResult(null);
      setTtsTestMessage('');
      try {
          await testTTSConnection(localSettings);
          setTtsTestResult('success');
          setTtsTestMessage(localSettings.language === 'zh-CN' ? '连接正常' : 'Connection OK');
      } catch (e: any) {
          setTtsTestResult('error');
          setTtsTestMessage(e.message || 'Error');
      } finally {
          setIsTestingTTS(false);
      }
  }

  const t = localSettings.language === 'zh-CN' ? {
    title: '设置',
    tabs: { general: '通用', llm: '文本模型', tts: '语音合成', debug: '调试日志' },
    general: { lang: '界面语言' },
    llm: {
      provider: '服务提供商',
      google: 'Google Gemini (官方)',
      openai: 'OpenAI 兼容 (硅基流动/DeepSeek等)',
      baseUrl: 'API 地址 (Base URL)',
      baseUrlHint: '例如: https://api.siliconflow.cn/v1',
      key: 'API Key',
      model: '模型名称',
      modelHint: '选择或输入模型名称...',
      fetchModels: '获取模型列表',
      test: '测试连接',
      testing: '测试中...'
    },
    tts: {
      provider: '语音引擎',
      google: 'Google Gemini TTS (推荐)',
      openai: 'OpenAI 兼容 / 硅基流动',
      browser: '浏览器原生 (仅文本)',
      baseUrl: 'API 地址 (Base URL)',
      baseUrlHint: '例如: https://api.siliconflow.cn/v1',
      key: 'API Key',
      keyHint: '若留空，尝试使用文本模型的 API Key。',
      model: '模型名称',
      modelHint: '例如: tts-1, fish-speech-1.5',
      voice: '语音角色',
      fetchVoices: '获取推荐语音',
      test: '测试生成',
      testing: '生成中...'
    },
    debug: {
        empty: '暂无日志',
        export: '导出日志 (.txt)',
        clear: '清空'
    },
    actions: { cancel: '取消', save: '保存设置' }
  } : {
    title: 'Settings',
    tabs: { general: 'General', llm: 'LLM Model', tts: 'TTS', debug: 'Debug Logs' },
    general: { lang: 'Interface Language' },
    llm: {
      provider: 'Provider',
      google: 'Google Gemini (Official)',
      openai: 'OpenAI Compatible (SiliconFlow etc)',
      baseUrl: 'Base URL',
      baseUrlHint: 'e.g. https://api.siliconflow.cn/v1',
      key: 'API Key',
      model: 'Model Name',
      modelHint: 'Select or type model name...',
      fetchModels: 'Fetch Models',
      test: 'Test Connection',
      testing: 'Testing...'
    },
    tts: {
      provider: 'Engine',
      google: 'Google Gemini TTS (Recommended)',
      openai: 'OpenAI Compatible / SiliconFlow',
      browser: 'Browser Native',
      baseUrl: 'Base URL',
      baseUrlHint: 'e.g. https://api.siliconflow.cn/v1',
      key: 'API Key',
      keyHint: 'Optional if using same key as LLM.',
      model: 'Model Name',
      modelHint: 'e.g., tts-1, fish-speech-1.5',
      voice: 'Voice',
      fetchVoices: 'Fetch Voices',
      test: 'Test Generation',
      testing: 'Generating...'
    },
    debug: {
        empty: 'No logs yet',
        export: 'Export Logs (.txt)',
        clear: 'Clear'
    },
    actions: { cancel: 'Cancel', save: 'Save Changes' }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <h2 className="font-bold text-lg text-slate-800 flex items-center gap-2">
            <Settings className="w-5 h-5 text-indigo-600" />
            {t.title}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-100 overflow-x-auto no-scrollbar">
          {(['general', 'llm', 'tts', 'debug'] as const).map(tabKey => (
             <button 
                key={tabKey}
                onClick={() => setActiveTab(tabKey)}
                className={`flex-1 py-3 px-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap
                    ${activeTab === tabKey ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
             >
                {t.tabs[tabKey]}
             </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* GENERAL TAB */}
          {activeTab === 'general' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2">
                  <Globe className="w-4 h-4" /> {t.general.lang}
                </label>
                <select 
                  value={localSettings.language}
                  onChange={(e) => setLocalSettings({...localSettings, language: e.target.value as any})}
                  className="w-full p-2.5 rounded-lg border border-slate-200 bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                >
                  <option value="zh-CN">简体中文</option>
                  <option value="en-US">English</option>
                </select>
              </div>
            </div>
          )}

          {/* LLM TAB */}
          {activeTab === 'llm' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                  <Cpu className="w-4 h-4" /> {t.llm.provider}
                </label>
                <div className="grid grid-cols-1 gap-2">
                  <button 
                    onClick={() => {
                      setLocalSettings(s => ({...s, llm: {...s.llm, provider: 'gemini', baseUrl: ''}}));
                      setAvailableModels([]);
                    }}
                    className={`p-3 rounded-xl border text-left transition-all ${localSettings.llm.provider === 'gemini' ? 'border-indigo-600 bg-indigo-50 text-indigo-700 ring-1 ring-indigo-600' : 'border-slate-200 hover:bg-slate-50'}`}
                  >
                    <div className="font-medium text-sm">{t.llm.google}</div>
                  </button>
                  <button 
                    onClick={() => {
                      setLocalSettings(s => ({...s, llm: {...s.llm, provider: 'openai'}}));
                      setAvailableModels([]);
                    }}
                    className={`p-3 rounded-xl border text-left transition-all ${localSettings.llm.provider === 'openai' ? 'border-indigo-600 bg-indigo-50 text-indigo-700 ring-1 ring-indigo-600' : 'border-slate-200 hover:bg-slate-50'}`}
                  >
                    <div className="font-medium text-sm">{t.llm.openai}</div>
                  </button>
                </div>
              </div>

              {localSettings.llm.provider === 'openai' && (
                <div className="animate-in slide-in-from-top-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2">
                    <LinkIcon className="w-4 h-4" /> {t.llm.baseUrl}
                  </label>
                  <input 
                    type="text" 
                    value={localSettings.llm.baseUrl}
                    onChange={(e) => setLocalSettings(s => ({...s, llm: {...s.llm, baseUrl: e.target.value}}))}
                    placeholder={t.llm.baseUrlHint}
                    className="w-full p-2.5 rounded-lg border border-slate-200 bg-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-mono"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2">
                  <Key className="w-4 h-4" /> {t.llm.key}
                </label>
                <input 
                  type="password" 
                  value={localSettings.llm.apiKey}
                  onChange={(e) => setLocalSettings(s => ({...s, llm: {...s.llm, apiKey: e.target.value}}))}
                  placeholder="sk-..."
                  className="w-full p-2.5 rounded-lg border border-slate-200 bg-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-mono"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Cpu className="w-4 h-4" /> {t.llm.model}
                  </div>
                  <button 
                    onClick={handleFetchModels}
                    disabled={isFetchingModels || !localSettings.llm.apiKey}
                    className="text-xs text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                     <RefreshCw className={`w-3 h-3 ${isFetchingModels ? 'animate-spin' : ''}`} />
                     {isFetchingModels ? 'Loading...' : t.llm.fetchModels}
                  </button>
                </label>
                
                <div className="space-y-2">
                  <input 
                    type="text" 
                    value={localSettings.llm.model}
                    onChange={(e) => setLocalSettings(s => ({...s, llm: {...s.llm, model: e.target.value}}))}
                    placeholder={t.llm.modelHint}
                    list="llm-model-options"
                    className="w-full p-2.5 rounded-lg border border-slate-200 bg-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-mono"
                  />
                  {availableModels.length > 0 && (
                     <datalist id="llm-model-options">
                        {availableModels.map(m => <option key={m} value={m} />)}
                     </datalist>
                  )}
                  {availableModels.length > 0 && (
                    <select 
                      onChange={(e) => setLocalSettings(s => ({...s, llm: {...s.llm, model: e.target.value}}))}
                      value={localSettings.llm.model}
                      className="w-full p-2 rounded-lg border border-slate-200 text-xs bg-slate-50"
                    >
                       <option value="" disabled>-- Select Model --</option>
                       {availableModels.map(m => (
                         <option key={m} value={m}>{m}</option>
                       ))}
                    </select>
                  )}
                  
                  {fetchError && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> {fetchError}
                    </p>
                  )}
                </div>
              </div>

              {/* Test Connection Button */}
              <div className="pt-2">
                 <button
                   onClick={handleTestConnection}
                   disabled={isTesting || !localSettings.llm.apiKey}
                   className={`w-full py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors
                     ${testResult === 'success' 
                       ? 'bg-green-50 text-green-700 border border-green-200' 
                       : testResult === 'error'
                         ? 'bg-red-50 text-red-700 border border-red-200'
                         : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                     }
                   `}
                 >
                    {isTesting ? (
                       <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : testResult === 'success' ? (
                       <CheckCircle2 className="w-4 h-4" />
                    ) : testResult === 'error' ? (
                       <AlertCircle className="w-4 h-4" />
                    ) : (
                       <PlayCircle className="w-4 h-4" />
                    )}
                    
                    {isTesting ? t.llm.testing : testMessage || t.llm.test}
                 </button>
              </div>

            </div>
          )}

          {/* TTS TAB */}
          {activeTab === 'tts' && (
            <div className="space-y-4">
              {/* TTS Provider Selection */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                  <Volume2 className="w-4 h-4" /> {t.tts.provider}
                </label>
                <div className="grid grid-cols-1 gap-2">
                  <button 
                    onClick={() => setLocalSettings(s => ({...s, tts: {...s.tts, provider: 'gemini', model: 'gemini-2.5-flash-preview-tts', voice: 'Kore'}}))}
                    className={`p-3 rounded-xl border text-left transition-all ${localSettings.tts.provider === 'gemini' ? 'border-indigo-600 bg-indigo-50 text-indigo-700 ring-1 ring-indigo-600' : 'border-slate-200 hover:bg-slate-50'}`}
                  >
                    <div className="font-medium text-sm">{t.tts.google}</div>
                  </button>
                  <button 
                    onClick={() => setLocalSettings(s => ({...s, tts: {...s.tts, provider: 'openai', model: 'fish-speech-1.5', voice: 'alex'}}))}
                    className={`p-3 rounded-xl border text-left transition-all ${localSettings.tts.provider === 'openai' ? 'border-indigo-600 bg-indigo-50 text-indigo-700 ring-1 ring-indigo-600' : 'border-slate-200 hover:bg-slate-50'}`}
                  >
                    <div className="font-medium text-sm">{t.tts.openai}</div>
                  </button>
                </div>
              </div>

              {localSettings.tts.provider === 'gemini' && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800 flex gap-2">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    <p>Google TTS 在国内可能无法直接访问。</p>
                </div>
              )}

              {localSettings.tts.provider === 'openai' && (
                <div className="animate-in slide-in-from-top-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2">
                    <LinkIcon className="w-4 h-4" /> {t.tts.baseUrl}
                  </label>
                  <input 
                    type="text" 
                    value={localSettings.tts.baseUrl}
                    onChange={(e) => setLocalSettings(s => ({...s, tts: {...s.tts, baseUrl: e.target.value}}))}
                    placeholder={t.tts.baseUrlHint}
                    className="w-full p-2.5 rounded-lg border border-slate-200 bg-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-mono"
                  />
                </div>
              )}

              <div>
                 <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2">
                  <Key className="w-4 h-4" /> {t.tts.key}
                </label>
                <input 
                  type="password" 
                  value={localSettings.tts.apiKey}
                  onChange={(e) => setLocalSettings(s => ({...s, tts: {...s.tts, apiKey: e.target.value}}))}
                  placeholder={localSettings.llm.provider === 'gemini' && localSettings.tts.provider === 'gemini' ? "使用 LLM Key (可留空)" : "sk-..."}
                  className="w-full p-2.5 rounded-lg border border-slate-200 bg-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-mono"
                />
                <p className="text-xs text-slate-400 mt-1">{t.tts.keyHint}</p>
              </div>

              {/* TTS Model Input with Fetch */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Cpu className="w-4 h-4" /> {t.tts.model}
                  </div>
                   <button 
                    onClick={handleFetchTTSModels}
                    disabled={isFetchingTTSModels || (!localSettings.tts.apiKey && localSettings.tts.provider !== 'gemini' && !localSettings.llm.apiKey)}
                    className="text-xs text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                     <RefreshCw className={`w-3 h-3 ${isFetchingTTSModels ? 'animate-spin' : ''}`} />
                     {isFetchingTTSModels ? 'Loading...' : t.llm.fetchModels}
                  </button>
                </label>
                
                <div className="space-y-2">
                  <input 
                    type="text" 
                    value={localSettings.tts.model} 
                    onChange={(e) => setLocalSettings(s => ({...s, tts: {...s.tts, model: e.target.value}}))}
                    placeholder={t.tts.modelHint}
                    list="tts-model-options"
                    className="w-full p-2.5 rounded-lg border border-slate-200 bg-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-mono"
                  />
                   {availableTTSModels.length > 0 && (
                     <datalist id="tts-model-options">
                        {availableTTSModels.map(m => <option key={m} value={m} />)}
                     </datalist>
                  )}
                  {/* Quick Select for found models */}
                  {availableTTSModels.length > 0 && (
                    <select 
                      onChange={(e) => setLocalSettings(s => ({...s, tts: {...s.tts, model: e.target.value}}))}
                      value={localSettings.tts.model}
                      className="w-full p-2 rounded-lg border border-slate-200 text-xs bg-slate-50"
                    >
                       <option value="" disabled>-- Select Model --</option>
                       {availableTTSModels.map(m => (
                         <option key={m} value={m}>{m}</option>
                       ))}
                    </select>
                  )}
                   {ttsFetchError && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> {ttsFetchError}
                    </p>
                  )}
                </div>
              </div>

              {/* TTS Voice Selection with Fetch */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center justify-between">
                   <div className="flex items-center gap-2">
                     <Volume2 className="w-4 h-4" /> {t.tts.voice}
                   </div>
                   <div className="flex items-center gap-2">
                    {voiceMsg && (
                      <span className={`text-[10px] flex items-center gap-1 ${voiceMsg.type === 'error' ? 'text-red-500' : 'text-green-600'}`}>
                        {voiceMsg.type === 'error' ? <AlertCircle className="w-3 h-3"/> : <CheckCircle2 className="w-3 h-3"/>}
                        {voiceMsg.text}
                      </span>
                    )}
                    <button 
                      onClick={handleFetchVoices}
                      disabled={isFetchingVoices}
                      className="text-xs text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1 disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3 h-3 ${isFetchingVoices ? 'animate-spin' : ''}`} />
                      {isFetchingVoices ? 'Loading...' : t.tts.fetchVoices}
                    </button>
                   </div>
                </label>

                <div className="space-y-2">
                  {/* For OpenAI, voices are often free text, but we can provide suggestions */}
                  <input
                     type="text"
                     list="voice-options"
                     value={localSettings.tts.voice}
                     onChange={(e) => setLocalSettings(s => ({...s, tts: {...s.tts, voice: e.target.value}}))}
                     className="w-full p-2.5 rounded-lg border border-slate-200 bg-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                     placeholder={localSettings.tts.model && localSettings.tts.provider === 'openai' 
                        ? `${localSettings.tts.model}:anna` 
                        : "e.g. alloy, alex"}
                  />
                  <datalist id="voice-options">
                    {localSettings.tts.provider === 'gemini' ? (
                       <>
                        <option value="Kore" />
                        <option value="Puck" />
                        <option value="Charon" />
                        <option value="Fenrir" />
                        <option value="Zephyr" />
                       </>
                    ) : (
                        // Default OpenAI / Common SiliconFlow voices
                        <>
                            {/* Dynamic options based on current model input */}
                            {localSettings.tts.model && commonBaseVoices.map(v => (
                                <option key={`dyn-${v}`} value={`${localSettings.tts.model}:${v}`} />
                            ))}

                            {/* Fallback base voices if no model is typed yet */}
                            {!localSettings.tts.model && commonBaseVoices.map(v => (
                                <option key={`base-${v}`} value={v} />
                            ))}
                            
                            {/* Popular Full Identifiers for Discovery */}
                            <option value="FunAudioLLM/CosyVoice2-0.5B:anna" />
                            <option value="fishaudio/fish-speech-1.5:alex" />
                        </>
                    )}
                    {availableVoices.map(v => <option key={v} value={v} />)}
                  </datalist>
                </div>
              </div>

              {/* Test TTS Button */}
              <div className="pt-2">
                 <button
                   onClick={handleTestTTS}
                   disabled={isTestingTTS}
                   className={`w-full py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors
                     ${ttsTestResult === 'success' 
                       ? 'bg-green-50 text-green-700 border border-green-200' 
                       : ttsTestResult === 'error'
                         ? 'bg-red-50 text-red-700 border border-red-200'
                         : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                     }
                   `}
                 >
                    {isTestingTTS ? (
                       <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : ttsTestResult === 'success' ? (
                       <CheckCircle2 className="w-4 h-4" />
                    ) : ttsTestResult === 'error' ? (
                       <AlertCircle className="w-4 h-4" />
                    ) : (
                       <PlayCircle className="w-4 h-4" />
                    )}
                    
                    {isTestingTTS ? t.tts.testing : ttsTestMessage || t.tts.test}
                 </button>
              </div>

            </div>
          )}

          {/* DEBUG LOGS TAB */}
          {activeTab === 'debug' && (
             <div className="flex flex-col h-full space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                        <button 
                            onClick={() => logger.exportLogs()}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 text-white text-xs rounded hover:bg-slate-700 transition-colors"
                        >
                            <Download className="w-3.5 h-3.5" />
                            {t.debug.export}
                        </button>
                        <button 
                            onClick={() => { logger.clear(); setLogs([]); }}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-200 text-slate-700 text-xs rounded hover:bg-slate-300 transition-colors"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                            {t.debug.clear}
                        </button>
                    </div>
                    <span className="text-xs text-slate-400">{logs.length} entries</span>
                </div>

                <div className="flex-1 bg-slate-900 rounded-lg p-3 overflow-y-auto font-mono text-xs text-slate-300 min-h-[300px] border border-slate-800">
                    {logs.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-600 gap-2">
                            <Bug className="w-6 h-6" />
                            <p>{t.debug.empty}</p>
                        </div>
                    ) : (
                        logs.map((log, idx) => (
                            <div key={idx} className="mb-2 last:mb-0 border-b border-slate-800/50 pb-2 last:border-0">
                                <div className="flex items-start gap-2">
                                    <span className={`flex-shrink-0 font-bold ${
                                        log.level === 'ERROR' ? 'text-red-400' :
                                        log.level === 'WARN' ? 'text-amber-400' :
                                        'text-blue-400'
                                    }`}>
                                        [{log.level}]
                                    </span>
                                    <span className="opacity-50 text-[10px] pt-0.5">{log.timestamp.split('T')[1].slice(0,8)}</span>
                                    <span className="break-all">{log.message}</span>
                                </div>
                                {log.details && (
                                    <div className="mt-1 pl-12 text-slate-500 overflow-x-auto whitespace-pre-wrap">
                                        {typeof log.details === 'string' ? log.details : JSON.stringify(log.details, null, 2)}
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
             </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-200 transition-colors"
          >
            {t.actions.cancel}
          </button>
          <button 
            onClick={handleSave}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm transition-all active:scale-95 flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {t.actions.save}
          </button>
        </div>
      </div>
    </div>
  );
};
