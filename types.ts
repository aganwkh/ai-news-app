
export interface Article {
  id: string;
  title: string;
  content: string;
}

export interface SummaryResult {
  text: string;
  audioBuffer: AudioBuffer | null;
}

export enum AppState {
  IDLE = 'IDLE',
  GENERATING_SUMMARY = 'GENERATING_SUMMARY',
  GENERATING_AUDIO = 'GENERATING_AUDIO',
  READY = 'READY',
  ERROR = 'ERROR'
}

export type LLMProvider = 'gemini' | 'openai';
export type TTSProvider = 'gemini' | 'openai' | 'browser';

export interface AppSettings {
  language: 'zh-CN' | 'en-US';
  llm: {
    provider: LLMProvider;
    apiKey: string;
    baseUrl: string; // e.g., https://api.siliconflow.cn/v1
    model: string;   // e.g., deepseek-ai/DeepSeek-V3 or gemini-3-flash-preview
  };
  tts: {
    provider: TTSProvider;
    apiKey: string; // Separate key for TTS if needed
    baseUrl: string; // New: for OpenAI compatible TTS
    model: string;  // e.g., gemini-2.5-flash-preview-tts or tts-1
    voice: string;
  };
}

export const DEFAULT_SETTINGS: AppSettings = {
  language: 'zh-CN',
  llm: {
    provider: 'gemini',
    apiKey: '', 
    baseUrl: '', 
    model: 'gemini-3-flash-preview',
  },
  tts: {
    provider: 'gemini',
    apiKey: '',
    baseUrl: '',
    model: 'gemini-2.5-flash-preview-tts',
    voice: 'Kore',
  }
};
