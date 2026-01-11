
import React, { useState } from 'react';
import { FileText, Sparkles, Rss, Loader2, Trash2, ChevronRight, Globe, Link as LinkIcon, Shuffle } from 'lucide-react';

interface ArticleInputProps {
  value: string;
  onChange: (val: string) => void;
  onGenerateSummary: () => void;
  isGeneratingSummary: boolean;
  disabled: boolean;
}

const SOURCES = [
  { name: "IT之家 (科技)", url: "https://www.ithome.com/rss/" },
  { name: "36Kr (商业)", url: "https://36kr.com/feed" },
  { name: "少数派 (生活)", url: "https://sspai.com/feed" },
  { name: "Solidot (极客)", url: "http://solidot.org/index.rss" },
  { name: "Engadget (Tech)", url: "https://www.engadget.com/rss.xml" },
  { name: "The Verge", url: "https://www.theverge.com/rss/index.xml" },
  { name: "Wired (Top)", url: "https://www.wired.com/feed/rss" },
  { name: "TechCrunch", url: "https://techcrunch.com/feed/" }
];

export const ArticleInput: React.FC<ArticleInputProps> = ({ 
  value, 
  onChange, 
  onGenerateSummary, 
  isGeneratingSummary, 
  disabled 
}) => {
  const [isFetchingNews, setIsFetchingNews] = useState(false);
  const [fetchStatus, setFetchStatus] = useState('');
  const [selectedSourceUrl, setSelectedSourceUrl] = useState<string>("");

  const handleClear = () => {
    if (confirm('Clear input?')) onChange('');
  };

  const fetchFeed = async (url: string, sourceName: string) => {
    if (isFetchingNews) return;
    setIsFetchingNews(true);
    setFetchStatus(`Connecting to ${sourceName}...`);
    
    try {
      // Note: In a real environment, you might need a CORS proxy or backend function.
      const SERVER_API = `https://thermotropic-autarkically-stuart.ngrok-free.dev/fetch_feed?rss_url=${encodeURIComponent(url)}`;
      
      const response = await fetch(SERVER_API, {
        method: 'GET',
        headers: { 'Accept': 'application/json', 'ngrok-skip-browser-warning': 'true' }
      });

      if (!response.ok) throw new Error('Network response was not ok');
      const articles = await response.json();

      if (!articles || articles.length === 0) throw new Error('No articles found');

      const formatted = articles.slice(0, 5).map((a: any, i: number) => 
        `# Article ${i + 1}: ${a.title}\n\n${a.content?.trim() || 'Content not available.'}`
      ).join('\n\n---\n\n');

      onChange(`【Source: ${sourceName}】\n\n${formatted}`);
      setFetchStatus('');
    } catch (e: any) {
      console.error(e);
      setFetchStatus('Failed to fetch');
      setTimeout(() => setFetchStatus(''), 3000);
    } finally {
      setIsFetchingNews(false);
    }
  };

  const handleSelectSource = (url: string) => {
      setSelectedSourceUrl(url);
      if (url) {
          const source = SOURCES.find(s => s.url === url);
          if (source) fetchFeed(url, source.name);
      }
  };

  const handleRandomSource = () => {
      // Pick a random source distinct from current if possible
      const otherSources = SOURCES.filter(s => s.url !== selectedSourceUrl);
      const randomSource = otherSources[Math.floor(Math.random() * otherSources.length)] || SOURCES[0];
      setSelectedSourceUrl(randomSource.url);
      fetchFeed(randomSource.url, randomSource.name);
  };

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 flex flex-col h-full transition-shadow hover:shadow-md overflow-hidden relative">
      
      {/* 1. Top Bar: Source Selection */}
      <div className="px-5 py-4 border-b border-slate-50 flex items-center justify-between bg-slate-50/30 gap-4">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="bg-indigo-50 p-1.5 rounded-lg text-indigo-600 flex-shrink-0">
            <Rss className="w-4 h-4" />
          </div>
          <select
            value={selectedSourceUrl}
            onChange={(e) => handleSelectSource(e.target.value)}
            disabled={isFetchingNews || disabled}
            className="bg-transparent text-sm font-medium text-slate-700 outline-none w-full cursor-pointer hover:text-indigo-600 transition-colors truncate pr-4"
          >
            <option value="">选择订阅源 / Select Source...</option>
            {SOURCES.map((s) => (
              <option key={s.url} value={s.url}>{s.name}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
           {/* Random Button */}
           <button
             onClick={handleRandomSource}
             disabled={isFetchingNews || disabled}
             className="flex items-center gap-1.5 text-xs bg-white border border-slate-200 px-3 py-1.5 rounded-md text-slate-600 font-medium hover:border-indigo-300 hover:text-indigo-600 transition-all shadow-sm active:scale-95"
             title="Random Source"
           >
              {isFetchingNews ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Shuffle className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">随机</span>
           </button>
           
           {value && (
            <button onClick={handleClear} className="p-1.5 text-slate-300 hover:text-red-500 transition-colors" title="Clear">
                <Trash2 className="w-4 h-4" />
            </button>
           )}
        </div>
      </div>

      {/* 2. Main Input Area */}
      <div className="flex-1 relative group">
        <textarea
          className="w-full h-full p-6 resize-none outline-none text-slate-600 text-base leading-relaxed font-mono placeholder:text-slate-300 bg-transparent"
          placeholder="在此粘贴文章内容，或点击上方“随机”按钮..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
        />
        
        {/* Helper Overlay when empty */}
        {!value && !isFetchingNews && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-30">
                <FileText className="w-16 h-16 text-slate-200" />
            </div>
        )}
        
        {/* Status Toast */}
        {fetchStatus && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-slate-800/90 backdrop-blur text-white text-xs px-4 py-2 rounded-full shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-2 z-10">
                {fetchStatus === 'Failed to fetch' ? <LinkIcon className="w-3 h-3"/> : <Loader2 className="w-3 h-3 animate-spin"/>}
                {fetchStatus}
            </div>
        )}
      </div>

      {/* 3. Action Footer */}
      <div className="p-4 bg-white border-t border-slate-50">
        <button
          onClick={onGenerateSummary}
          disabled={!value.trim() || isGeneratingSummary || disabled}
          className={`
            w-full h-12 rounded-xl flex items-center justify-center gap-2.5 font-semibold text-[15px] transition-all duration-300
            ${!value.trim() || isGeneratingSummary || disabled
              ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
              : 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:scale-[1.01] active:scale-[0.98]'
            }
          `}
        >
          {isGeneratingSummary ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>正在阅读并生成摘要...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              <span>开始生成摘要</span>
              <ChevronRight className="w-4 h-4 opacity-50" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};
