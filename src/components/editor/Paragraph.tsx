import { useRef, useEffect, useState, forwardRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNovelStore } from '../../store/useNovelStore';
import { useUIStore } from '../../store/useUIStore';
import AIFloatingBar from './AIFloatingBar';
import type { Paragraph as ParagraphType, AIOperationItem } from '../../lib/types';

interface ParagraphProps {
  paragraph: ParagraphType;
  chapterId: string;
  isUserPane: boolean;
  aiOperations: AIOperationItem[];
  onAIAction: (paragraphId: string, op: AIOperationItem) => void;
  onSync?: (paragraphId: string) => void;
  onCreateNextParagraph: (afterParagraphId: string) => void;
  onDeleteParagraph: (paragraphId: string) => void;
  isSelected: boolean;
  onToggleSelect: (paragraphId: string, shiftKey?: boolean, ctrlKey?: boolean) => void;
}

const ParagraphBlock = forwardRef<HTMLDivElement, ParagraphProps>(
  ({
    paragraph, chapterId, isUserPane, aiOperations,
    onAIAction, onSync, onCreateNextParagraph, onDeleteParagraph,
    isSelected, onToggleSelect,
  }, ref) => {
    const { updateParagraph } = useNovelStore();
    const { hoveredParagraphId, setHoveredParagraphId } = useUIStore();
    const [isHovered, setIsHovered] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const isHoveredByOther = hoveredParagraphId === paragraph.id;

    const displayText = isUserPane ? paragraph.userText : (paragraph.aiText || paragraph.userText);
    const isEmpty = !displayText.trim();

    useEffect(() => {
      if (textareaRef.current && isEditing) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
      }
    }, [isEditing, displayText]);

    const handleMouseEnter = () => { setIsHovered(true); setHoveredParagraphId(paragraph.id); };
    const handleMouseLeave = () => { setIsHovered(false); setHoveredParagraphId(null); };

    const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newText = e.target.value;
      if (isUserPane) updateParagraph(chapterId, paragraph.id, { userText: newText });
      else updateParagraph(chapterId, paragraph.id, { aiText: newText });
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (isEmpty) return;
        setIsEditing(false);
        onCreateNextParagraph(paragraph.id);
        return;
      }
      if (e.key === 'Backspace' && isEmpty) {
        e.preventDefault();
        onDeleteParagraph(paragraph.id);
        return;
      }
    };

    const handleClick = (e: React.MouseEvent) => {
      if (!isEmpty && (e.shiftKey || e.ctrlKey || e.metaKey)) {
        e.stopPropagation();
        onToggleSelect(paragraph.id, e.shiftKey, e.ctrlKey || e.metaKey);
        return;
      }
      if (!isEditing) setIsEditing(true);
    };

    const getBarColor = () => {
      if (paragraph.aiStatus === 'processing') return 'var(--color-processing)';
      if (paragraph.aiStatus === 'error' && !isUserPane) return 'var(--color-error)';
      if (isHovered || isSelected) return isUserPane ? 'var(--color-user-bar)' : 'var(--color-ai-bar)';
      if (isHoveredByOther) return isUserPane ? 'rgba(74,124,155,0.35)' : 'rgba(184,84,80,0.35)';
      return 'var(--color-border-light)';
    };

    const showAIBar = !isUserPane && aiOperations.length > 0 && isHovered && paragraph.aiStatus !== 'processing';
    const isProcessing = paragraph.aiStatus === 'processing' && !isUserPane;

    return (
      <div
        ref={ref}
        data-paragraph-id={paragraph.id}
        className={`relative group transition-all duration-150 ${
          isSelected ? 'bg-accent/15' : ''
        } ${isProcessing ? 'ai-processing-glow' : ''}`}
        style={{ minHeight: 0 }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* AI Floating Bar - overlays content */}
        {showAIBar && (
          <AIFloatingBar
            isVisible={true}
            operations={aiOperations}
            onOperation={(op) => onAIAction(paragraph.id, op)}
            onSync={!isUserPane && onSync ? () => onSync(paragraph.id) : undefined}
          />
        )}

        {/* Full-height indicator bar */}
        <motion.div
          className="absolute rounded-full pointer-events-none"
          style={{
            left: 18,
            top: 8,
            bottom: 8,
            width: 3,
            backgroundColor: getBarColor(),
          }}
          animate={isProcessing ? { opacity: [0.4, 1] } : { opacity: 1 }}
          transition={isProcessing ? { repeat: Infinity, duration: 1.2, ease: 'easeInOut' } : { duration: 0.2 }}
        />

        {/* Processing shimmer overlay */}
        <AnimatePresence>
          {isProcessing && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="absolute inset-0 pointer-events-none"
              style={{
                background: 'linear-gradient(90deg, transparent 0%, rgba(212,165,116,0.04) 50%, transparent 100%)',
                backgroundSize: '200% 100%',
              }}
            >
              <motion.div
                className="absolute inset-0"
                style={{
                  background: 'linear-gradient(90deg, transparent 0%, rgba(212,165,116,0.06) 50%, transparent 100%)',
                  backgroundSize: '200% 100%',
                }}
                animate={{ backgroundPosition: ['200% 0%', '-200% 0%'] }}
                transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Processing badge */}
        <AnimatePresence>
          {isProcessing && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.25 }}
              className="ai-processing-badge flex items-center gap-2 px-3 py-1.5 mx-4 ml-[34px] mt-1 rounded-lg bg-processing/10 border border-processing/20 pointer-events-none z-10 relative"
            >
              <div className="dot-loader">
                <span />
                <span />
                <span />
              </div>
              <span className="text-xs font-medium text-processing">AI 正在处理...</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Content area */}
        <div className={`px-4 pb-2 pl-[34px] ${isProcessing ? 'pt-1' : 'pt-2'}`}>
          {isEditing ? (
            <textarea
              ref={textareaRef}
              value={displayText}
              onChange={handleTextChange}
              onBlur={() => setIsEditing(false)}
              onKeyDown={handleKeyDown}
              className="editor-font w-full bg-transparent outline-none whitespace-pre-wrap break-words resize-none overflow-hidden cursor-text min-h-[28px]"
              autoFocus
              rows={1}
              placeholder={isUserPane ? '从这里开始写作...' : ''}
            />
          ) : (
            <motion.div
              key={`content-${paragraph.id}-${paragraph.aiStatus}`}
              initial={paragraph.aiStatus === 'completed' && !isUserPane && paragraph.aiText ? { opacity: 0 } : false}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              onClick={handleClick}
              className="editor-font cursor-text whitespace-pre-wrap break-words min-h-[28px]"
            >
              {displayText || (
                <span className="text-text-tertiary italic">
                  {isUserPane ? '点击开始写作...' : 'AI 处理后的内容将显示在这里'}
                </span>
              )}
            </motion.div>
          )}
        </div>
      </div>
    );
  }
);

ParagraphBlock.displayName = 'ParagraphBlock';
export default ParagraphBlock;
