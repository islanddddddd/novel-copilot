import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, BookOpen, Sparkles, Loader2, Trash2 } from 'lucide-react';
import { useNovelStore } from '../../store/useNovelStore';
import { useAIStore } from '../../store/useAIStore';
import { learnStyleFromText } from '../../lib/ai-service';
import type { WritingStyle } from '../../lib/types';

interface StyleLearnerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function StyleLearner({ isOpen, onClose }: StyleLearnerProps) {
  const { novels, currentNovelId, addWritingStyle, deleteWritingStyle, setDefaultStyle } = useNovelStore();
  const getCurrentConfig = useAIStore((s) => s.getCurrentConfig);
  const [mode, setMode] = useState<'list' | 'learn'>('list');
  const [sampleText, setSampleText] = useState('');
  const [styleName, setStyleName] = useState('');
  const [isLearning, setIsLearning] = useState(false);

  const currentNovel = novels.find((n) => n.id === currentNovelId);
  const styles = currentNovel?.writingStyles || [];
  const config = getCurrentConfig();
  const hasAI = !!config?.apiKey;

  const handleLearn = async () => {
    if (!sampleText.trim() || !styleName.trim() || !currentNovelId || !config) return;

    setIsLearning(true);
    try {
      const result = await learnStyleFromText(sampleText, config);
      const newStyle: WritingStyle = {
        id: `style-${Date.now()}`,
        name: styleName.trim(),
        sourceText: sampleText.slice(0, 500),
        description: result.description || '自定义文风',
        promptFragment: result.promptFragment || '',
        createdAt: Date.now(),
      };
      addWritingStyle(currentNovelId, newStyle);

      // If first style, set as default
      if (styles.length === 0) {
        setDefaultStyle(currentNovelId, newStyle.id);
      }

      setMode('list');
      setSampleText('');
      setStyleName('');
    } catch {
      alert('文风学习失败，请检查 API 配置');
    } finally {
      setIsLearning(false);
    }
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
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-x-4 top-[8%] max-w-lg mx-auto bg-surface rounded-xl shadow-xl border border-border p-5 z-50 max-h-[84vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-medium">文风管理</h2>
              <button onClick={onClose} className="p-1.5 hover:bg-bg-secondary rounded-lg">
                <X className="w-4 h-4 text-text-tertiary" />
              </button>
            </div>

            {mode === 'list' ? (
              <>
                {/* Style List */}
                <div className="space-y-2 mb-4">
                  {styles.length === 0 ? (
                    <div className="text-center py-8 text-text-tertiary text-sm">
                      <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-40" />
                      <p>还没有保存的文风</p>
                    </div>
                  ) : (
                    styles.map((style) => (
                      <div
                        key={style.id}
                        className={`p-3 rounded-lg border transition-all ${
                          currentNovel?.defaultStyleId === style.id
                            ? 'border-accent bg-accent-light'
                            : 'border-border-light bg-bg-secondary hover:border-border'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">{style.name}</span>
                              {currentNovel?.defaultStyleId === style.id && (
                                <span className="text-xs px-1.5 py-0.5 rounded bg-accent text-white">
                                  默认
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-text-secondary mt-1 truncate">
                              {style.description}
                            </p>
                          </div>
                          <div className="flex items-center gap-1 ml-2">
                            {currentNovel?.defaultStyleId !== style.id && (
                              <button
                                onClick={() => currentNovelId && setDefaultStyle(currentNovelId, style.id)}
                                className="p-1.5 rounded hover:bg-bg-tertiary text-xs text-accent"
                                title="设为默认"
                              >
                                设为默认
                              </button>
                            )}
                            <button
                              onClick={() => currentNovelId && deleteWritingStyle(currentNovelId, style.id)}
                              className="p-1.5 rounded hover:bg-red-50 text-text-tertiary hover:text-red-500"
                              title="删除"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Add Button */}
                {hasAI ? (
                  <button
                    onClick={() => setMode('learn')}
                    className="w-full py-2.5 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent-hover transition-colors flex items-center justify-center gap-2"
                  >
                    <Sparkles className="w-4 h-4" />
                    学习新文风
                  </button>
                ) : (
                  <p className="text-xs text-text-tertiary text-center py-2">
                    请先配置 API Key 以使用文风学习功能
                  </p>
                )}
              </>
            ) : (
              <>
                {/* Learn Form */}
                <button
                  onClick={() => setMode('list')}
                  className="text-xs text-accent mb-3 hover:underline"
                >
                  ← 返回列表
                </button>

                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-text-secondary mb-1.5 block">文风名称 *</label>
                    <input
                      value={styleName}
                      onChange={(e) => setStyleName(e.target.value)}
                      placeholder="例如：金庸风格、张爱玲风格"
                      className="w-full px-3 py-2.5 rounded-lg bg-bg-secondary border border-border focus:border-accent outline-none text-sm"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-text-secondary mb-1.5 block">
                      参考文本 *（粘贴一段代表性文字，建议 500-3000 字）
                    </label>
                    <textarea
                      value={sampleText}
                      onChange={(e) => setSampleText(e.target.value)}
                      placeholder="粘贴你想要 AI 学习的文风样本..."
                      className="w-full px-3 py-2.5 rounded-lg bg-bg-secondary border border-border focus:border-accent outline-none text-sm resize-none h-40"
                    />
                    <p className="text-xs text-text-tertiary mt-1 text-right">
                      {sampleText.length} 字
                    </p>
                  </div>

                  <button
                    onClick={handleLearn}
                    disabled={!sampleText.trim() || !styleName.trim() || isLearning}
                    className="w-full py-2.5 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent-hover transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isLearning ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        分析中...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        开始分析
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
