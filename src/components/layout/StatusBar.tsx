import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Save, Loader2, X, Sparkles, AlertCircle, History, CheckCircle2, FileText } from 'lucide-react';
import { useNovelStore } from '../../store/useNovelStore';
import { useAIStore } from '../../store/useAIStore';

export default function StatusBar() {
  const { novels, currentNovelId, currentChapterId } = useNovelStore();
  const { errorMessages, clearErrors, history, clearHistory, notifications, clearNotifications } = useAIStore();
  const currentNovel = novels.find((n) => n.id === currentNovelId);
  const currentChapter = currentNovel?.chapters.find((c) => c.id === currentChapterId);
  const [showPanel, setShowPanel] = useState(false);
  const [panelTab, setPanelTab] = useState<'progress' | 'history' | 'notifications'>('progress');

  const stats = useMemo(() => {
    if (!currentChapter) return null;
    const allText = currentChapter.paragraphs.map((p) => p.userText).join('');
    const totalChars = allText.length;
    const chineseChars = (allText.match(/[\u4e00-\u9fff]/g) || []).length;
    const punctuationMarks = (allText.match(/[\u3000-\u303f\uff00-\uffef\u2000-\u206f.,;:!?'"()[\]{}]/g) || []).length;
    const processingItems = currentChapter.paragraphs
      .filter((p) => p.aiStatus === 'processing')
      .map((p) => ({
        id: p.id,
        text: p.userText.slice(0, 40) + (p.userText.length > 40 ? '...' : ''),
        mode: p.aiMode,
        operation: p.aiOperation,
      }));
    const completedCount = currentChapter.paragraphs.filter((p) => p.aiStatus === 'completed' && p.aiText).length;
    return { totalChars, chineseChars, punctuationMarks, paragraphCount: currentChapter.paragraphs.length, processingItems, completedCount };
  }, [currentChapter]);

  if (!stats) {
    return (
      <motion.footer initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.3, ease: 'easeOut', delay: 0.3 }}
        className="h-7 flex items-center px-4 border-t border-border bg-surface shrink-0 text-xs text-text-tertiary select-none">
        <span>伴作 - AI 辅助小说写作</span>
        <div className="flex-1" />
        <div className="flex items-center gap-1"><Save className="w-3 h-3" /><span>自动保存</span></div>
      </motion.footer>
    );
  }

  const hasProcessing = stats.processingItems.length > 0;
  const hasCompleted = stats.completedCount > 0;
  const hasErrors = errorMessages.length > 0;
  const hasNotifications = notifications.length > 0;
  const hasHistory = history.length > 0;

  const modeColor = (mode?: string) => {
    if (mode === 'high') return 'text-accent';
    if (mode === 'fast') return 'text-success';
    return 'text-processing';
  };

  const modeLabel = (mode?: string) => {
    if (mode === 'high') return '高质量';
    if (mode === 'fast') return '快速';
    return '均衡';
  };

  const operationLabel = (op?: string) => {
    if (op === 'polish') return '润色';
    if (op === 'expand') return '扩写';
    if (op === 'review') return '审查';
    if (op === 'custom') return '自定义';
    return '处理';
  };

  return (
    <>
      <motion.footer initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.3, ease: 'easeOut', delay: 0.3 }}
        className="h-7 flex items-center px-4 border-t border-border bg-surface shrink-0 text-xs select-none">
        {/* Left: Character Stats */}
        <div className="flex items-center gap-3 text-text-secondary">
          <span title="总字符数">字符 {stats.totalChars.toLocaleString()}</span>
          <span className="text-border">|</span>
          <span title="中文字数">中文 {stats.chineseChars.toLocaleString()}</span>
          <span className="text-border">|</span>
          <span title="标点数量">标点 {stats.punctuationMarks.toLocaleString()}</span>
          <span className="text-border">|</span>
          <span className="text-text-tertiary">{stats.paragraphCount} 段</span>
        </div>

        <div className="flex-1" />

        {/* Right: AI errors + status + history + save */}
        <div className="flex items-center gap-3">
          {/* Error messages */}
          <AnimatePresence>
            {hasErrors && (
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="flex items-center gap-1.5"
              >
                <div className="flex items-center gap-1 text-error">
                  <AlertCircle className="w-3 h-3" />
                  <span className="max-w-[200px] truncate" title={errorMessages[errorMessages.length - 1]}>
                    {errorMessages[errorMessages.length - 1]}
                  </span>
                  {errorMessages.length > 1 && (
                    <span className="text-[10px] opacity-70">+{errorMessages.length - 1}</span>
                  )}
                </div>
                <button
                  onClick={clearErrors}
                  className="p-0.5 rounded hover:bg-bg-secondary text-text-tertiary"
                  title="清除错误"
                >
                  <X className="w-3 h-3" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Review notifications */}
          <AnimatePresence>
            {hasNotifications && (
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="flex items-center gap-1.5"
              >
                <button
                  onClick={() => { setPanelTab('notifications'); setShowPanel(true); }}
                  className="flex items-center gap-1 text-accent hover:text-accent-hover cursor-pointer transition-colors"
                  title="查看审查结果"
                >
                  <FileText className="w-3 h-3" />
                  <span className="max-w-[150px] truncate">
                    {notifications[notifications.length - 1].title}
                  </span>
                  {notifications.length > 1 && (
                    <span className="text-[10px] opacity-70">+{notifications.length - 1}</span>
                  )}
                </button>
                <button
                  onClick={clearNotifications}
                  className="p-0.5 rounded hover:bg-bg-secondary text-text-tertiary"
                  title="清除通知"
                >
                  <X className="w-3 h-3" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* AI Status */}
          <AnimatePresence mode="wait">
            {hasProcessing && (
              <motion.button
                key="processing"
                initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}
                onClick={() => { setPanelTab('progress'); setShowPanel(true); }}
                className="flex items-center gap-1.5 text-processing hover:text-accent cursor-pointer transition-colors"
              >
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>AI 处理中 ({stats.processingItems.length})</span>
              </motion.button>
            )}
            {!hasProcessing && (hasCompleted || hasHistory) && (
              <motion.button
                key="completed"
                initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}
                onClick={() => { setPanelTab('history'); setShowPanel(true); }}
                className="flex items-center gap-1.5 text-success hover:text-accent cursor-pointer transition-colors"
              >
                <Sparkles className="w-3 h-3" />
                <span>{stats.completedCount} 段已处理</span>
              </motion.button>
            )}
          </AnimatePresence>

          {/* History button */}
          {hasHistory && (
            <button
              onClick={() => { setPanelTab('history'); setShowPanel(true); }}
              className="flex items-center gap-1 text-text-tertiary hover:text-text-secondary transition-colors"
              title="处理历史"
            >
              <History className="w-3 h-3" />
              <span className="text-[10px]">{history.length}</span>
            </button>
          )}

          <div className="flex items-center gap-1 text-text-tertiary">
            <Save className="w-3 h-3" /><span>自动保存</span>
          </div>
        </div>
      </motion.footer>

      {/* AI Panel: Progress + History */}
      <AnimatePresence>
        {showPanel && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/20 z-50" onClick={() => setShowPanel(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2 }}
              className="fixed bottom-10 right-4 w-96 bg-surface rounded-xl shadow-xl border border-border z-50 overflow-hidden flex flex-col max-h-[70vh]">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setPanelTab('progress')}
                    className={`text-sm font-medium transition-colors ${panelTab === 'progress' ? 'text-accent' : 'text-text-tertiary hover:text-text-secondary'}`}
                  >
                    处理进度
                  </button>
                  <button
                    onClick={() => setPanelTab('history')}
                    className={`text-sm font-medium transition-colors flex items-center gap-1 ${panelTab === 'history' ? 'text-accent' : 'text-text-tertiary hover:text-text-secondary'}`}
                  >
                    历史记录
                    {history.length > 0 && <span className="text-[10px] px-1 py-0.5 rounded bg-bg-tertiary">{history.length}</span>}
                  </button>
                  <button
                    onClick={() => setPanelTab('notifications')}
                    className={`text-sm font-medium transition-colors flex items-center gap-1 ${panelTab === 'notifications' ? 'text-accent' : 'text-text-tertiary hover:text-text-secondary'}`}
                  >
                    审查结果
                    {notifications.length > 0 && <span className="text-[10px] px-1 py-0.5 rounded bg-bg-tertiary">{notifications.length}</span>}
                  </button>
                </div>
                <div className="flex items-center gap-1">
                  {panelTab === 'history' && history.length > 0 && (
                    <button onClick={clearHistory} className="text-[10px] text-text-tertiary hover:text-error px-2 py-1 rounded hover:bg-bg-secondary transition-colors">
                      清空
                    </button>
                  )}
                  {panelTab === 'notifications' && notifications.length > 0 && (
                    <button onClick={clearNotifications} className="text-[10px] text-text-tertiary hover:text-error px-2 py-1 rounded hover:bg-bg-secondary transition-colors">
                      清空
                    </button>
                  )}
                  <button onClick={() => setShowPanel(false)} className="p-1 rounded hover:bg-bg-secondary">
                    <X className="w-3.5 h-3.5 text-text-tertiary" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto py-2 min-h-0">
                {panelTab === 'progress' ? (
                  stats.processingItems.length > 0 ? (
                    stats.processingItems.map((item) => (
                      <div key={item.id} className="flex items-start gap-3 px-4 py-2.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-processing mt-1.5 shrink-0 animate-pulse" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-text-primary truncate">{item.text}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] font-medium text-text-secondary">{operationLabel(item.operation)}</span>
                            <span className="text-[10px] text-border">|</span>
                            <span className={`text-[10px] font-medium ${modeColor(item.mode)}`}>{modeLabel(item.mode)}</span>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-text-tertiary">
                      <CheckCircle2 className="w-6 h-6 mb-2 opacity-40" />
                      <span className="text-xs">暂无处理中的任务</span>
                    </div>
                  )
                ) : panelTab === 'history' ? (
                  history.length > 0 ? (
                    history.slice().reverse().map((rec) => (
                      <div key={rec.id} className="flex items-start gap-3 px-4 py-2 border-b border-border-light last:border-0">
                        <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${rec.success ? 'bg-success' : 'bg-error'}`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-text-primary">{rec.operation}</span>
                            <span className={`text-[10px] font-medium ${modeColor(rec.mode)}`}>{modeLabel(rec.mode)}</span>
                            {!rec.success && <span className="text-[10px] text-error">失败</span>}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] text-text-tertiary">{rec.configName}</span>
                            <span className="text-[10px] text-text-tertiary opacity-50">
                              {new Date(rec.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-text-tertiary">
                      <History className="w-6 h-6 mb-2 opacity-40" />
                      <span className="text-xs">暂无历史记录</span>
                    </div>
                  )
                ) : (
                  notifications.length > 0 ? (
                    notifications.slice().reverse().map((notif) => (
                      <div key={notif.id} className="px-4 py-3 border-b border-border-light last:border-0">
                        <div className="flex items-center gap-2 mb-2">
                          <FileText className="w-3.5 h-3.5 text-accent" />
                          <span className="text-xs font-medium text-text-primary">{notif.title}</span>
                          <span className="text-[10px] text-text-tertiary ml-auto">
                            {new Date(notif.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <div className="text-xs text-text-secondary whitespace-pre-wrap bg-bg-secondary rounded-lg p-3 max-h-40 overflow-y-auto">
                          {notif.content}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-text-tertiary">
                      <FileText className="w-6 h-6 mb-2 opacity-40" />
                      <span className="text-xs">暂无审查结果</span>
                    </div>
                  )
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
