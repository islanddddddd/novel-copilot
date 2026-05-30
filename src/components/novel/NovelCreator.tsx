import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Sparkles } from 'lucide-react';
import type { Novel } from '../../lib/types';

interface NovelCreatorProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (novel: Novel) => void;
}

export default function NovelCreator({ isOpen, onClose, onCreate }: NovelCreatorProps) {
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');

  const handleSubmit = () => {
    if (!title.trim()) return;

    const novelId = `novel-${Date.now()}`;
    const chapterId = `ch-${Date.now()}`;

    const novel: Novel = {
      id: novelId,
      title: title.trim(),
      summary: summary.trim() || undefined,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      chapters: [
        {
          id: chapterId,
          title: '第一章',
          order: 0,
          paragraphs: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ],
      characters: [],
      settings: [],
      writingStyles: [],
      promptTemplates: [],
      aiMode: 'manual',
    };

    onCreate(novel);
    setTitle('');
    setSummary('');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
          >
            <div className="bg-surface rounded-2xl shadow-2xl border border-border p-8 w-full max-w-md mx-4 pointer-events-auto">
              {/* Decorative ink splash */}
              <div className="flex justify-center mb-6">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                  className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center"
                >
                  <BookOpen className="w-8 h-8 text-accent" />
                </motion.div>
              </div>

              <h2 className="text-xl font-semibold text-center mb-1">开始你的创作之旅</h2>
              <p className="text-sm text-text-tertiary text-center mb-6">
                创建一本新小说，让 AI 成为你的写作助手
              </p>

              <div className="space-y-4">
                <div>
                  <label className="text-sm text-text-secondary mb-1.5 block">小说名称 *</label>
                  <input
                    autoFocus
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                    placeholder="给你的小说起个名字"
                    className="w-full px-4 py-3 rounded-xl bg-bg-secondary border border-border focus:border-accent outline-none text-base"
                  />
                </div>

                <div>
                  <label className="text-sm text-text-secondary mb-1.5 block">简介（可选）</label>
                  <textarea
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    placeholder="简要描述一下你的小说..."
                    className="w-full px-4 py-3 rounded-xl bg-bg-secondary border border-border focus:border-accent outline-none text-sm resize-none h-20"
                  />
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={!title.trim()}
                  className="w-full py-3 rounded-xl bg-accent text-white font-medium hover:bg-accent-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  创建小说
                </button>

                <button
                  onClick={onClose}
                  className="w-full py-2 text-sm text-text-tertiary hover:text-text-secondary transition-colors"
                >
                  取消
                </button>
              </div>

              <p className="text-xs text-text-tertiary text-center mt-4">
                所有数据保存在本地浏览器中，随时可以导出备份
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
