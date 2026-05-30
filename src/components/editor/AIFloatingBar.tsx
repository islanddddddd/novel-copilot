import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Wand2, X, RefreshCw } from 'lucide-react';
export interface AIOperationItem {
  id: string;
  name: string;
  template: string;
  isDefault?: boolean;
}

interface AIFloatingBarProps {
  isVisible: boolean;
  operations: AIOperationItem[];
  onOperation: (op: AIOperationItem) => void;
  onSync?: () => void;
}

export default function AIFloatingBar({
  isVisible,
  operations,
  onOperation,
  onSync,
}: AIFloatingBarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customPrompt, setCustomPrompt] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const collapseTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (isVisible && !showCustomInput) {
      clearTimeout(collapseTimerRef.current);
      setCollapsed(false);
      collapseTimerRef.current = setTimeout(() => setCollapsed(true), 4000);
    }
    if (!isVisible) {
      clearTimeout(collapseTimerRef.current);
      setCollapsed(false);
      setShowCustomInput(false);
      setCustomPrompt('');
    }
    return () => clearTimeout(collapseTimerRef.current);
  }, [isVisible, showCustomInput]);

  useEffect(() => {
    if (showCustomInput && inputRef.current) inputRef.current.focus();
  }, [showCustomInput]);

  const handleCustomSubmit = () => {
    if (customPrompt.trim()) {
      onOperation({ id: 'custom', name: '自定义', template: customPrompt.trim() });
    }
    setShowCustomInput(false);
    setCustomPrompt('');
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
          className="absolute top-0 left-0 right-0 z-20 flex items-center justify-center py-1"
          style={{ transform: 'translateY(-100%)' }}
          onMouseEnter={() => { clearTimeout(collapseTimerRef.current); setCollapsed(false); }}
          onMouseLeave={() => { if (!showCustomInput) collapseTimerRef.current = setTimeout(() => setCollapsed(true), 1500); }}
        >
          <div className="inline-flex items-center gap-0.5 bg-surface rounded-full shadow-lg border border-border-light px-1.5 py-0.5">
            <div className="flex items-center justify-center w-6 h-6 shrink-0">
              <Sparkles className="w-3.5 h-3.5 text-accent" />
            </div>

            <AnimatePresence>
              {!collapsed && (
                <motion.div
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: 'auto', opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="flex items-center gap-0.5 overflow-hidden"
                >
                  {showCustomInput ? (
                    <div className="flex items-center gap-1 px-1">
                      <input
                        ref={inputRef}
                        value={customPrompt}
                        onChange={(e) => setCustomPrompt(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleCustomSubmit(); if (e.key === 'Escape') { setShowCustomInput(false); setCustomPrompt(''); } }}
                        placeholder="输入自定义指令..."
                        className="w-36 px-2 py-0.5 text-xs bg-bg-secondary rounded-full outline-none border border-border focus:border-accent"
                      />
                      <button onClick={(e) => { e.stopPropagation(); handleCustomSubmit(); }}
                        className="p-1 rounded-full bg-accent text-white hover:bg-accent-hover shrink-0">
                        <Wand2 className="w-3 h-3" />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); setShowCustomInput(false); setCustomPrompt(''); }}
                        className="p-1 rounded-full hover:bg-bg-secondary text-text-tertiary shrink-0">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="w-px h-3 bg-border-light mx-0.5 shrink-0" />
                      {operations.map((op) => (
                        <button
                          key={op.id}
                          onClick={(e) => { e.stopPropagation(); onOperation(op); }}
                          className="flex items-center gap-1 px-2 py-1 rounded-full text-xs text-text-secondary hover:bg-accent-light hover:text-accent transition-colors whitespace-nowrap shrink-0"
                        >
                          <span>{op.name}</span>
                        </button>
                      ))}
                      <button
                        onClick={(e) => { e.stopPropagation(); setShowCustomInput(true); }}
                        className="flex items-center gap-1 px-2 py-1 rounded-full text-xs text-text-secondary hover:bg-accent-light hover:text-accent transition-colors whitespace-nowrap shrink-0"
                      >
                        <span>自定义</span>
                      </button>
                      {onSync && (
                        <>
                          <div className="w-px h-3 bg-border-light mx-0.5 shrink-0" />
                          <button
                            onClick={(e) => { e.stopPropagation(); onSync(); }}
                            className="flex items-center gap-1 px-2 py-1 rounded-full text-xs text-text-secondary hover:bg-user-bar/10 hover:text-user-bar transition-colors whitespace-nowrap shrink-0"
                            title="重置为原始输入"
                          >
                            <RefreshCw className="w-3 h-3" />
                            <span>同步</span>
                          </button>
                        </>
                      )}
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {collapsed && <div className="w-1 h-1 rounded-full bg-accent mr-1 shrink-0" />}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
