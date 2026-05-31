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
    const [showCompletion, setShowCompletion] = useState(false);

    // Track completion to trigger animation only once
    useEffect(() => {
      if (paragraph.aiStatus === 'completed' && !isUserPane && paragraph.aiText) {
        setShowCompletion(true);
        const timer = setTimeout(() => setShowCompletion(false), 1500);
        return () => clearTimeout(timer);
      }
    }, [paragraph.aiStatus, paragraph.aiText, isUserPane]);

    return (
      <div
        ref={ref}
        data-paragraph-id={paragraph.id}
        className={`relative group transition-all duration-150 ${
          isSelected ? 'bg-accent/15' : ''
        }`}
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

        {/* Processing charging effect */}
        <AnimatePresence>
          {isProcessing && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0 pointer-events-none overflow-hidden"
            >
              {/* Background fill */}
              <motion.div
                className="absolute left-0 top-0 bottom-0 w-full"
                style={{
                  background: 'linear-gradient(90deg, rgba(212,165,116,0.2) 0%, rgba(212,165,116,0.1) 60%, rgba(212,165,116,0.03) 100%)',
                }}
                animate={{
                  opacity: [0, 1, 1, 0, 0],
                  scaleX: [0, 0, 1, 1, 0],
                  transformOrigin: 'left',
                }}
                transition={{
                  duration: 5,
                  repeat: Infinity,
                  times: [0, 0.01, 0.7, 0.85, 1],
                  ease: 'easeInOut',
                }}
              />
              {/* Leading edge glow */}
              <motion.div
                className="absolute top-0 bottom-0 w-8"
                style={{
                  background: 'linear-gradient(90deg, transparent, rgba(212,165,116,0.35), transparent)',
                  filter: 'blur(4px)',
                }}
                animate={{
                  left: ['-5%', '95%'],
                  opacity: [0, 0, 1, 1, 0],
                }}
                transition={{
                  duration: 5,
                  repeat: Infinity,
                  times: [0, 0.01, 0.1, 0.7, 0.85],
                  ease: 'easeInOut',
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Completion effect */}
        <AnimatePresence>
          {showCompletion && (
            <motion.div
              initial={{ opacity: 1 }}
              animate={{ opacity: 0 }}
              transition={{ duration: 1.5, ease: 'easeOut' }}
              className="absolute inset-0 pointer-events-none overflow-hidden"
            >
              {/* Green sweep from left to right */}
              <motion.div
                className="absolute top-0 bottom-0 w-full"
                style={{
                  background: 'linear-gradient(90deg, transparent, rgba(107,142,107,0.15), transparent)',
                }}
                initial={{ x: '-100%' }}
                animate={{ x: '100%' }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              />
              {/* Brief green border flash */}
              <motion.div
                className="absolute inset-0 border-2 border-success/30 rounded"
                initial={{ opacity: 1 }}
                animate={{ opacity: 0 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
              />
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
