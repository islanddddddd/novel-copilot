import { useCallback, useState, useEffect, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNovelStore } from '../../store/useNovelStore';
import { useUIStore } from '../../store/useUIStore';
import { useAIStore } from '../../store/useAIStore';
import EditorPane from '../editor/EditorPane';
import { sendAIRequest } from '../../lib/ai-service';
import type { AIOperationItem } from '../../lib/types';

const DEFAULT_OPERATIONS: AIOperationItem[] = [
  { id: 'polish', name: '润色', template: '', isDefault: true },
  { id: 'expand', name: '扩写', template: '', isDefault: true },
  { id: 'review', name: '审查', template: '', isDefault: true },
];

export default function SplitEditor() {
  const { novels, currentNovelId, currentChapterId, updateParagraph, addParagraph, deleteParagraph } = useNovelStore();
  const { syncHeight } = useUIStore();
  const { setIsProcessing } = useAIStore();
  const [selectedParagraphIds, setSelectedParagraphIds] = useState<string[]>([]);
  const processingRef = useRef<Set<string>>(new Set());

  // Refs
  const userOuterRef = useRef<HTMLDivElement>(null);
  const aiOuterRef = useRef<HTMLDivElement>(null);
  const heightSyncRafRef = useRef<number>(0);

  // Drag selection
  const [isDragging, setIsDragging] = useState(false);
  const [dragPane, setDragPane] = useState<'user' | 'ai' | null>(null);
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const dragEndRef = useRef<{ x: number; y: number } | null>(null);
  const [dragBox, setDragBox] = useState<{ x: number; y: number; w: number; h: number } | null>(null);

  const currentNovel = novels.find((n) => n.id === currentNovelId);
  const currentChapter = currentNovel?.chapters.find((c) => c.id === currentChapterId);
  const hasAI = useAIStore((s) => !!s.configs.find((c) => c.id === s.currentConfigId)?.apiKey);
  const paragraphs = currentChapter?.paragraphs || [];

  // Build AI operations list: user templates override defaults by name
  const aiOperations: AIOperationItem[] = useMemo(() => {
    const userTemplates = currentNovel?.promptTemplates || [];
    // Start with defaults
    const ops = [...DEFAULT_OPERATIONS];
    // Add user templates that don't override a default name
    userTemplates.forEach((t) => {
      const existingIdx = ops.findIndex((o) => o.name === t.name);
      if (existingIdx >= 0) {
        ops[existingIdx] = { ...t, isDefault: false };
      } else {
        ops.push({ ...t, isDefault: false });
      }
    });
    return ops;
  }, [currentNovel?.promptTemplates]);

  // ===== HEIGHT SYNC =====
  useEffect(() => {
    if (!syncHeight || !userOuterRef.current || !aiOuterRef.current) {
      [userOuterRef, aiOuterRef].forEach((ref) => {
        ref.current?.querySelectorAll('[data-paragraph-id]').forEach((el) => {
          (el as HTMLElement).style.minHeight = '';
        });
      });
      return;
    }
    const sync = () => {
      if (!userOuterRef.current || !aiOuterRef.current) return;
      const userEls = userOuterRef.current.querySelectorAll('[data-paragraph-id]');
      const aiEls = aiOuterRef.current.querySelectorAll('[data-paragraph-id]');
      const aiMap = new Map<string, HTMLElement>();
      aiEls.forEach((el) => {
        const id = el.getAttribute('data-paragraph-id');
        if (id) aiMap.set(id, el as HTMLElement);
      });
      userEls.forEach((el) => {
        const id = el.getAttribute('data-paragraph-id');
        if (!id) return;
        const aiEl = aiMap.get(id);
        if (!aiEl) return;
        const uh = el.getBoundingClientRect().height;
        const ah = aiEl.getBoundingClientRect().height;
        const mh = Math.max(uh, ah);
        (el as HTMLElement).style.minHeight = `${mh}px`;
        aiEl.style.minHeight = `${mh}px`;
      });
    };
    const ro = new ResizeObserver(() => {
      cancelAnimationFrame(heightSyncRafRef.current);
      heightSyncRafRef.current = requestAnimationFrame(sync);
    });
    if (userOuterRef.current) ro.observe(userOuterRef.current);
    if (aiOuterRef.current) ro.observe(aiOuterRef.current);
    const t1 = setTimeout(sync, 50);
    const t2 = setTimeout(sync, 300);
    return () => { clearTimeout(t1); clearTimeout(t2); cancelAnimationFrame(heightSyncRafRef.current); ro.disconnect(); };
  }, [syncHeight, paragraphs.length]);

  useEffect(() => {
    if (!syncHeight) return;
    const timer = setTimeout(() => {
      if (!userOuterRef.current || !aiOuterRef.current) return;
      const uEls = userOuterRef.current.querySelectorAll('[data-paragraph-id]');
      const aEls = aiOuterRef.current.querySelectorAll('[data-paragraph-id]');
      const aMap = new Map<string, HTMLElement>();
      aEls.forEach((el) => { const id = el.getAttribute('data-paragraph-id'); if (id) aMap.set(id, el as HTMLElement); });
      uEls.forEach((el) => {
        const id = el.getAttribute('data-paragraph-id');
        if (!id) return;
        const aEl = aMap.get(id);
        if (!aEl) return;
        (el as HTMLElement).style.minHeight = '';
        aEl.style.minHeight = '';
        const mh = Math.max(el.getBoundingClientRect().height, aEl.getBoundingClientRect().height);
        (el as HTMLElement).style.minHeight = `${mh}px`;
        aEl.style.minHeight = `${mh}px`;
      });
    }, 50);
    return () => clearTimeout(timer);
  }, [paragraphs.map((p) => p.userText + (p.aiText || '')).join('|'), syncHeight]);

  // AI processing
  const processAI = useCallback(async (paragraphId: string, op: AIOperationItem) => {
    if (!currentChapterId) return;
    const storeState = useAIStore.getState();

    // Determine mode: from op, or default
    const mode = op.mode || storeState.defaultMode;
    const modeSetting = storeState.modeSettings[mode];
    const config = storeState.getModeConfig(mode);

    if (!config || !config.apiKey) {
      storeState.addError(`未配置AI（${mode}模式）：请在设置中添加API Key`);
      updateParagraph(currentChapterId, paragraphId, { aiStatus: 'error' });
      return;
    }

    const paragraph = paragraphs.find((p) => p.id === paragraphId);
    if (!paragraph || !paragraph.userText.trim()) return;
    if (processingRef.current.has(paragraphId)) return;
    processingRef.current.add(paragraphId);

    const configName = config.name;

    updateParagraph(currentChapterId, paragraphId, {
      aiStatus: 'processing',
      aiOperation: op.id as any,
      aiMode: mode,
      aiConfigName: configName,
    });
    setIsProcessing(true);

    const style = currentNovel?.defaultStyleId
      ? currentNovel.writingStyles.find((s) => s.id === currentNovel.defaultStyleId)
      : undefined;

    // Resolve template
    let promptTemplate = op.template;
    if (op.isDefault && !op.template) {
      try {
        const { getDefaultTemplate } = await import('../../lib/ai-service');
        promptTemplate = getDefaultTemplate(op.id as any);
      } catch (e) {
        console.error('[AI] 加载默认模板失败:', e);
      }
    }

    try {
      const response = await sendAIRequest(
        config,
        {
          operation: op.id as any,
          text: paragraph.userText,
          context: {
            outline: currentNovel?.outline,
            settings: currentNovel?.settings.map((s) => `${s.name}: ${s.content}`),
            previousParagraphs: paragraphs.slice(0, paragraphs.indexOf(paragraph)).slice(-3).map((p) => p.userText),
            style: style?.promptFragment,
          },
          customPrompt: op.id === 'custom' ? op.template : undefined,
        },
        style,
        promptTemplate,
        modeSetting
      );

      if (response.success) {
        updateParagraph(currentChapterId, paragraphId, {
          aiText: response.result,
          aiStatus: 'completed',
        });
        storeState.addHistory({
          id: `rec-${Date.now()}`,
          paragraphId,
          operation: op.name,
          mode,
          configName,
          success: true,
          timestamp: Date.now(),
        });
      } else {
        // Error: do NOT overwrite aiText, only set status
        storeState.addError(`${op.name}失败: ${response.error || '未知错误'}`);
        updateParagraph(currentChapterId, paragraphId, { aiStatus: 'error' });
        storeState.addHistory({
          id: `rec-${Date.now()}`,
          paragraphId,
          operation: op.name,
          mode,
          configName,
          success: false,
          timestamp: Date.now(),
        });
      }
    } catch (err) {
      console.error('[AI] 处理异常:', err);
      storeState.addError(`${op.name}异常: ${err instanceof Error ? err.message : '未知错误'}`);
      updateParagraph(currentChapterId, paragraphId, { aiStatus: 'error' });
      storeState.addHistory({
        id: `rec-${Date.now()}`,
        paragraphId,
        operation: op.name,
        mode,
        configName,
        success: false,
        timestamp: Date.now(),
      });
    } finally {
      processingRef.current.delete(paragraphId);
      setIsProcessing(false);
    }
  }, [currentChapterId, paragraphs, currentNovel, updateParagraph, setIsProcessing]);

  // Sync: reset AI text to user text
  const handleSync = useCallback((paragraphId: string) => {
    if (!currentChapterId) return;
    const paragraph = paragraphs.find((p) => p.id === paragraphId);
    if (!paragraph) return;
    updateParagraph(currentChapterId, paragraphId, {
      aiText: paragraph.userText,
      aiStatus: 'completed',
    });
  }, [currentChapterId, paragraphs, updateParagraph]);

  const handleAIAction = useCallback((paragraphId: string, op: AIOperationItem) => {
    processAI(paragraphId, op);
  }, [processAI]);

  const handleBatchAI = useCallback((op: AIOperationItem) => {
    selectedParagraphIds.forEach((id) => processAI(id, op));
    setSelectedParagraphIds([]);
  }, [selectedParagraphIds, processAI]);

  const handleCreateNextParagraph = useCallback((_afterParagraphId: string) => {
    if (!currentChapterId) return;
    addParagraph(currentChapterId, {
      id: `p-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      userText: '', aiStatus: 'idle', createdAt: Date.now(), updatedAt: Date.now(),
    });
  }, [currentChapterId, addParagraph]);

  const handleDeleteParagraph = useCallback((paragraphId: string) => {
    if (!currentChapterId) return;
    deleteParagraph(currentChapterId, paragraphId);
    setSelectedParagraphIds((prev) => prev.filter((id) => id !== paragraphId));
  }, [currentChapterId, deleteParagraph]);

  const handleToggleSelect = useCallback((paragraphId: string, shiftKey?: boolean, ctrlKey?: boolean) => {
    setSelectedParagraphIds((prev) => {
      if (shiftKey && prev.length > 0) {
        const ids = paragraphs.map((p) => p.id);
        const lastIdx = ids.indexOf(prev[prev.length - 1]);
        const currIdx = ids.indexOf(paragraphId);
        const start = Math.min(lastIdx, currIdx);
        const end = Math.max(lastIdx, currIdx);
        return Array.from(new Set([...prev, ...ids.slice(start, end + 1)]));
      }
      if (ctrlKey) return prev.includes(paragraphId) ? prev.filter((id) => id !== paragraphId) : [...prev, paragraphId];
      return [paragraphId];
    });
  }, [paragraphs]);

  // Drag selection
  const startDrag = useCallback((pane: 'user' | 'ai', e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('textarea, button, input')) return;
    const el = pane === 'user' ? userOuterRef.current : aiOuterRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    dragStartRef.current = { x: e.clientX - rect.left + el.scrollLeft, y: e.clientY - rect.top + el.scrollTop };
    dragEndRef.current = dragStartRef.current;
    setDragPane(pane);
    setIsDragging(true);
    if (!e.shiftKey && !e.ctrlKey && !e.metaKey) setSelectedParagraphIds([]);
  }, []);

  const moveDrag = useCallback((pane: 'user' | 'ai', e: React.MouseEvent) => {
    if (!isDragging || !dragStartRef.current) return;
    const el = pane === 'user' ? userOuterRef.current : aiOuterRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    dragEndRef.current = { x: e.clientX - rect.left + el.scrollLeft, y: e.clientY - rect.top + el.scrollTop };
    const x1 = Math.min(dragStartRef.current.x, dragEndRef.current.x);
    const y1 = Math.min(dragStartRef.current.y, dragEndRef.current.y);
    const x2 = Math.max(dragStartRef.current.x, dragEndRef.current.x);
    const y2 = Math.max(dragStartRef.current.y, dragEndRef.current.y);
    setDragBox({ x: x1, y: y1, w: x2 - x1, h: y2 - y1 });
  }, [isDragging]);

  const endDrag = useCallback(() => {
    if (!isDragging || !dragBox || !userOuterRef.current) {
      setIsDragging(false); setDragBox(null); setDragPane(null);
      dragStartRef.current = null; dragEndRef.current = null;
      return;
    }
    const allEls = [
      ...(userOuterRef.current?.querySelectorAll('[data-paragraph-id]') || []),
      ...(aiOuterRef.current?.querySelectorAll('[data-paragraph-id]') || []),
    ];
    const userRect = userOuterRef.current.getBoundingClientRect();
    const userScroll = userOuterRef.current.scrollTop;
    const aiRect = aiOuterRef.current?.getBoundingClientRect();
    const aiScroll = aiOuterRef.current?.scrollTop || 0;

    const intersectedIds = new Set<string>();
    allEls.forEach((el) => {
      const id = el.getAttribute('data-paragraph-id');
      if (!id) return;
      const isInUser = (el as HTMLElement).closest('[data-pane="user"]') !== null;
      const paneRect = isInUser ? userRect : aiRect;
      const paneScroll = isInUser ? userScroll : aiScroll;
      if (!paneRect) return;
      const r = el.getBoundingClientRect();
      const et = r.top - paneRect.top + paneScroll;
      const eb = et + r.height;
      const el_ = r.left - paneRect.left;
      const er = el_ + r.width;
      if (el_ < dragBox.x + dragBox.w && er > dragBox.x && et < dragBox.y + dragBox.h && eb > dragBox.y) {
        const p = paragraphs.find((para) => para.id === id);
        if (p && p.userText.trim()) intersectedIds.add(id);
      }
    });

    if (intersectedIds.size > 0) setSelectedParagraphIds((prev) => Array.from(new Set([...prev, ...intersectedIds])));
    setIsDragging(false); setDragBox(null); setDragPane(null);
    dragStartRef.current = null; dragEndRef.current = null;
  }, [isDragging, dragBox, paragraphs]);

  useEffect(() => {
    const onUp = () => { if (isDragging) endDrag(); };
    window.addEventListener('mouseup', onUp);
    return () => window.removeEventListener('mouseup', onUp);
  }, [isDragging, endDrag]);

  useEffect(() => {
    const handler = () => {
      if (!currentChapterId) return;
      addParagraph(currentChapterId, { id: `p-${Date.now()}`, userText: '', aiStatus: 'idle', createdAt: Date.now(), updatedAt: Date.now() });
    };
    window.addEventListener('create-first-paragraph', handler);
    return () => window.removeEventListener('create-first-paragraph', handler);
  }, [currentChapterId, addParagraph]);

  useEffect(() => {
    if (currentNovel?.aiMode !== 'auto' || !currentChapterId || !hasAI) return;
    const chapter = currentNovel.chapters.find((c) => c.id === currentChapterId);
    if (!chapter) return;
    const pending = chapter.paragraphs.find((p) => p.aiStatus === 'idle' && p.userText.trim().length > 15 && !p.aiText);
    if (pending) {
      const timer = setTimeout(() => {
        const polishOp = aiOperations.find((o) => o.id === 'polish');
        if (polishOp) processAI(pending.id, polishOp);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [currentNovel, currentChapterId, hasAI, paragraphs, processAI, aiOperations]);

  if (!currentChapter) {
    return (
      <div className="flex-1 flex items-center justify-center bg-surface">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <div className="text-6xl mb-4">📝</div>
          <h2 className="text-lg font-medium text-text-primary mb-2">选择一个章节开始写作</h2>
          <p className="text-sm text-text-tertiary">在左侧目录中选择一个章节，或创建新章节</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex min-w-0 relative">
      <div ref={userOuterRef} data-pane="user"
        className="flex-1 flex flex-col min-w-0 border-r border-border relative"
        onMouseDown={(e) => startDrag('user', e)} onMouseMove={(e) => moveDrag('user', e)}
        style={{ userSelect: isDragging ? 'none' : undefined }}>
        {dragPane === 'user' && dragBox && (
          <div className="absolute z-40 pointer-events-none border border-accent bg-accent/10 rounded-sm"
            style={{ left: dragBox.x, top: dragBox.y, width: dragBox.w, height: dragBox.h }} />
        )}
        <EditorPane paragraphs={paragraphs} chapterId={currentChapterId!} isUserPane={true}
          aiOperations={aiOperations} onAIAction={handleAIAction}
          onCreateNextParagraph={handleCreateNextParagraph} onDeleteParagraph={handleDeleteParagraph}
          selectedParagraphIds={selectedParagraphIds} onToggleSelect={handleToggleSelect}
          onBatchAI={handleBatchAI} syncHeight={syncHeight} />
      </div>
      <div ref={aiOuterRef} data-pane="ai"
        className="flex-1 flex flex-col min-w-0 relative"
        onMouseDown={(e) => startDrag('ai', e)} onMouseMove={(e) => moveDrag('ai', e)}
        style={{ userSelect: isDragging ? 'none' : undefined }}>
        {dragPane === 'ai' && dragBox && (
          <div className="absolute z-40 pointer-events-none border border-accent bg-accent/10 rounded-sm"
            style={{ left: dragBox.x, top: dragBox.y, width: dragBox.w, height: dragBox.h }} />
        )}
        <EditorPane paragraphs={paragraphs} chapterId={currentChapterId!} isUserPane={false}
          aiOperations={aiOperations} onAIAction={handleAIAction} onSync={handleSync}
          onCreateNextParagraph={handleCreateNextParagraph} onDeleteParagraph={handleDeleteParagraph}
          selectedParagraphIds={selectedParagraphIds} onToggleSelect={handleToggleSelect}
          onBatchAI={handleBatchAI} syncHeight={syncHeight} />
      </div>
      {selectedParagraphIds.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="absolute top-12 left-1/2 -translate-x-1/2 z-30 px-3 py-1.5 rounded-full bg-accent text-white text-xs shadow-lg">
          已选择 {selectedParagraphIds.length} 段<span className="ml-1 opacity-80">(鼠标移到任意段落上可操作)</span>
        </motion.div>
      )}
    </div>
  );
}
