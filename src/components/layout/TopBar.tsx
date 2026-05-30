import { useState } from 'react';
import { BookOpen, ChevronDown, Wand2, Settings, Moon, Sun, Plus, PenTool, Palette } from 'lucide-react';
import { useNovelStore } from '../../store/useNovelStore';
import { useUIStore } from '../../store/useUIStore';
import { useAIStore } from '../../store/useAIStore';
import { motion, AnimatePresence } from 'framer-motion';

interface TopBarProps {
  onCreateNovel: () => void;
  onTogglePanel: () => void;
}

export default function TopBar({ onCreateNovel, onTogglePanel }: TopBarProps) {
  const { novels, currentNovelId, setCurrentNovel, updateNovel } = useNovelStore();
  const { theme, toggleTheme, openSettings } = useUIStore();
  const configs = useAIStore((s) => s.configs);
  const currentConfigId = useAIStore((s) => s.currentConfigId);
  const currentConfig = configs.find((c) => c.id === currentConfigId);
  const hasAI = !!currentConfig?.apiKey;

  const [showNovelDropdown, setShowNovelDropdown] = useState(false);
  const [showStyleDropdown, setShowStyleDropdown] = useState(false);

  const currentNovel = novels.find((n) => n.id === currentNovelId);

  const handleAIModeToggle = () => {
    if (!currentNovelId) return;
    updateNovel(currentNovelId, { aiMode: currentNovel?.aiMode === 'auto' ? 'manual' : 'auto' });
  };

  const handleStyleSelect = (styleId: string | undefined) => {
    if (!currentNovelId) return;
    updateNovel(currentNovelId, { defaultStyleId: styleId });
    setShowStyleDropdown(false);
  };

  return (
    <motion.header initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.4, ease: 'easeOut' }}
      className="h-10 flex items-center px-4 border-b border-border bg-surface shrink-0 select-none z-50">
      {/* Left: Logo + Novel selector */}
      <div className="flex items-center gap-3 min-w-0">
        <button onClick={onTogglePanel} className="p-1.5 rounded-md hover:bg-bg-secondary transition-colors" title="收起/展开侧边栏">
          <BookOpen className="w-4 h-4 text-accent" />
        </button>
        <div className="relative">
          <button onClick={() => setShowNovelDropdown(!showNovelDropdown)}
            className="flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-bg-secondary transition-colors min-w-0">
            <span className="text-sm font-medium truncate max-w-[180px]">{currentNovel?.title || '伴作'}</span>
            <ChevronDown className="w-3.5 h-3.5 text-text-tertiary shrink-0" />
          </button>
          <AnimatePresence>
            {showNovelDropdown && (
              <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                className="absolute top-full left-0 mt-1 w-56 bg-surface rounded-lg shadow-lg border border-border py-1 z-50">
                {novels.map((novel) => (
                  <button key={novel.id} onClick={() => { setCurrentNovel(novel.id); setShowNovelDropdown(false); }}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-bg-secondary transition-colors flex items-center gap-2 ${novel.id === currentNovelId ? 'text-accent bg-accent-light' : ''}`}>
                    <BookOpen className="w-3.5 h-3.5 shrink-0" /><span className="truncate">{novel.title}</span>
                  </button>
                ))}
                <div className="border-t border-border-light my-1" />
                <button onClick={() => { onCreateNovel(); setShowNovelDropdown(false); }}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-bg-secondary transition-colors flex items-center gap-2 text-accent">
                  <Plus className="w-3.5 h-3.5 shrink-0" />新建小说
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Center: AI Controls */}
      <div className="flex-1 flex items-center justify-center gap-2">
        {currentNovel && hasAI && (
          <>
            <button onClick={handleAIModeToggle}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                currentNovel.aiMode === 'auto' ? 'bg-accent text-white' : 'bg-bg-tertiary text-text-secondary hover:text-text-primary'}`}>
              <Wand2 className="w-3 h-3" />{currentNovel.aiMode === 'auto' ? '自动' : '手动'}
            </button>
            <div className="h-4 w-px bg-border" />
            <div className="relative">
              <button onClick={() => setShowStyleDropdown(!showStyleDropdown)}
                className="flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-bg-tertiary text-text-secondary hover:text-text-primary transition-colors">
                <Palette className="w-3 h-3" />
                <span className="max-w-[80px] truncate">{currentNovel.writingStyles.find((s) => s.id === currentNovel.defaultStyleId)?.name || '默认文风'}</span>
              </button>
              <AnimatePresence>
                {showStyleDropdown && (
                  <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                    className="absolute top-full left-0 mt-1 w-48 bg-surface rounded-lg shadow-lg border border-border py-1 z-50">
                    <button onClick={() => handleStyleSelect(undefined)}
                      className={`w-full text-left px-3 py-1.5 text-sm hover:bg-bg-secondary transition-colors ${!currentNovel.defaultStyleId ? 'text-accent' : ''}`}>默认文风</button>
                    {currentNovel.writingStyles.map((style) => (
                      <button key={style.id} onClick={() => handleStyleSelect(style.id)}
                        className={`w-full text-left px-3 py-1.5 text-sm hover:bg-bg-secondary transition-colors ${currentNovel.defaultStyleId === style.id ? 'text-accent' : ''}`}>{style.name}</button>
                    ))}
                    <div className="border-t border-border-light my-1" />
                    <button onClick={() => { openSettings('styles'); setShowStyleDropdown(false); }}
                      className="w-full text-left px-3 py-1.5 text-sm hover:bg-bg-secondary text-accent">+ 管理文风</button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <div className="h-4 w-px bg-border" />
            <span className="text-xs text-text-tertiary">{currentConfig?.name || currentConfig?.provider || ''}</span>
          </>
        )}
        {!hasAI && currentNovel && (
          <button onClick={() => openSettings('ai')}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs bg-bg-tertiary text-text-secondary hover:text-accent transition-colors">
            <PenTool className="w-3 h-3" />配置 API 以启用 AI
          </button>
        )}
      </div>

      {/* Right */}
      <div className="flex items-center gap-1">
        <button onClick={() => openSettings('ai')} className="p-1.5 rounded-md hover:bg-bg-secondary transition-colors" title="设置">
          <Settings className="w-4 h-4 text-text-secondary" />
        </button>
        <button onClick={toggleTheme} className="p-1.5 rounded-md hover:bg-bg-secondary transition-colors"
          title={theme === 'light' ? '切换到深色模式' : '切换到浅色模式'}>
          {theme === 'light' ? <Moon className="w-4 h-4 text-text-secondary" /> : <Sun className="w-4 h-4 text-text-secondary" />}
        </button>
      </div>
    </motion.header>
  );
}
