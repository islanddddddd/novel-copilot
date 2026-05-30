import { useState, forwardRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import ParagraphBlock from './Paragraph';
import type { Paragraph as ParagraphType, AIOperationItem } from '../../lib/types';

interface EditorPaneProps {
  paragraphs: ParagraphType[];
  chapterId: string;
  isUserPane: boolean;
  aiOperations: AIOperationItem[];
  onAIAction: (paragraphId: string, op: AIOperationItem) => void;
  onSync?: (paragraphId: string) => void;
  onCreateNextParagraph: (afterParagraphId: string) => void;
  onDeleteParagraph: (paragraphId: string) => void;
  selectedParagraphIds: string[];
  onToggleSelect: (paragraphId: string, shiftKey?: boolean, ctrlKey?: boolean) => void;
  onBatchAI: (op: AIOperationItem) => void;
  syncHeight?: boolean;
}

const MAX_VISIBLE_OPS = 3;

const EditorPane = forwardRef<HTMLDivElement, EditorPaneProps>(
  ({
    paragraphs, chapterId, isUserPane, aiOperations, onAIAction, onSync,
    onCreateNextParagraph, onDeleteParagraph,
    selectedParagraphIds, onToggleSelect, onBatchAI, syncHeight = false,
  }, ref) => {
    const isBatchMode = !isUserPane && selectedParagraphIds.length > 1;
    const [showMoreOps, setShowMoreOps] = useState(false);

    const visibleOps = aiOperations.slice(0, MAX_VISIBLE_OPS);
    const hiddenOps = aiOperations.slice(MAX_VISIBLE_OPS);

    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut', delay: 0.2 }}
        className="flex-1 flex flex-col h-full overflow-y-auto bg-surface scroll-smooth"
      >
        {/* Pane Header — batch ops embedded on the right */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-2 border-b border-border-light bg-surface/95 backdrop-blur-sm">
          <span className={`text-xs font-medium ${isUserPane ? 'text-user-bar' : 'text-ai-bar'}`}>
            {isUserPane ? '✎ 原始输入' : '✨ AI 成品'}
          </span>

          <div className="flex items-center gap-3">
            {/* Batch ops — inline in header */}
            <AnimatePresence>
              {isBatchMode && (
                <motion.div
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.15 }}
                  className="flex items-center gap-1.5"
                >
                  <span className="text-xs text-text-tertiary mr-1">
                    {selectedParagraphIds.length} 段
                  </span>
                  {visibleOps.map((op) => (
                    <button
                      key={op.id}
                      onClick={() => onBatchAI(op)}
                      className="px-2 py-0.5 rounded-full text-[11px] bg-accent-light text-accent hover:bg-accent hover:text-white transition-colors"
                    >
                      {op.name}
                    </button>
                  ))}
                  {hiddenOps.length > 0 && (
                    <div className="relative">
                      <button
                        onClick={() => setShowMoreOps(!showMoreOps)}
                        className="px-1.5 py-0.5 rounded-full text-[11px] bg-bg-tertiary text-text-secondary hover:bg-accent-light hover:text-accent transition-colors flex items-center gap-0.5"
                      >
                        <ChevronDown className="w-3 h-3" />
                        {hiddenOps.length}
                      </button>
                      <AnimatePresence>
                        {showMoreOps && (
                          <>
                            <div
                              className="fixed inset-0 z-40"
                              onClick={() => setShowMoreOps(false)}
                            />
                            <motion.div
                              initial={{ opacity: 0, y: -4, scale: 0.95 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: -4, scale: 0.95 }}
                              transition={{ duration: 0.1 }}
                              className="absolute right-0 top-full mt-1 bg-surface rounded-lg shadow-lg border border-border py-1 z-50 min-w-[100px]"
                            >
                              {hiddenOps.map((op) => (
                                <button
                                  key={op.id}
                                  onClick={() => { onBatchAI(op); setShowMoreOps(false); }}
                                  className="w-full text-left px-3 py-1.5 text-xs text-text-secondary hover:bg-accent-light hover:text-accent transition-colors"
                                >
                                  {op.name}
                                </button>
                              ))}
                            </motion.div>
                          </>
                        )}
                      </AnimatePresence>
                    </div>
                  )}
                  <button
                    onClick={() => {
                      const prompt = window.prompt('输入自定义指令:');
                      if (prompt) onBatchAI({ id: 'custom', name: '自定义', template: prompt });
                    }}
                    className="px-2 py-0.5 rounded-full text-[11px] bg-bg-tertiary text-text-secondary hover:bg-accent-light hover:text-accent transition-colors"
                  >
                    自定义
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Word count */}
            {paragraphs.length > 0 && (
              <span className="text-xs text-text-tertiary">
                {paragraphs.reduce((sum, p) => sum + (isUserPane ? p.userText.length : (p.aiText || p.userText).length), 0)} 字
              </span>
            )}
          </div>
        </div>

        {/* Paragraphs */}
        <div className={`flex-1 py-4 ${syncHeight ? 'grid' : ''}`} style={syncHeight ? { gridTemplateColumns: '1fr', alignContent: 'start' } : undefined}>
          {paragraphs.length === 0 && isUserPane && (
            <div className="px-4 py-12 text-center">
              <button
                onClick={() => {
                  const event = new CustomEvent('create-first-paragraph');
                  window.dispatchEvent(event);
                }}
                className="text-text-tertiary italic hover:text-text-secondary transition-colors text-sm"
              >
                点击开始写作...
              </button>
            </div>
          )}
          {paragraphs.map((paragraph) => (
            <div key={paragraph.id} className={syncHeight ? 'min-h-0' : ''} style={syncHeight ? { contain: 'layout' } : undefined}>
              <ParagraphBlock
                paragraph={paragraph} chapterId={chapterId} isUserPane={isUserPane}
                aiOperations={aiOperations}
                onAIAction={onAIAction} onSync={onSync}
                onCreateNextParagraph={onCreateNextParagraph} onDeleteParagraph={onDeleteParagraph}
                isSelected={selectedParagraphIds.includes(paragraph.id)} onToggleSelect={onToggleSelect}
              />
            </div>
          ))}
        </div>
      </motion.div>
    );
  }
);

EditorPane.displayName = 'EditorPane';
export default EditorPane;
