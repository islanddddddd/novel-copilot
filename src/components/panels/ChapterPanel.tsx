import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Plus,
  MoreVertical,
  GripVertical,
  FileText,
  Trash2,
  Edit3,
} from 'lucide-react';
import { useNovelStore } from '../../store/useNovelStore';

interface ChapterPanelProps {
  onCreateChapter: () => void;
}

export default function ChapterPanel({ onCreateChapter }: ChapterPanelProps) {
  const { novels, currentNovelId, currentChapterId, setCurrentChapter, deleteChapter, updateChapter } =
    useNovelStore();
  const [editingChapter, setEditingChapter] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  const currentNovel = novels.find((n) => n.id === currentNovelId);
  const chapters = currentNovel?.chapters || [];

  const handleEditSubmit = (chapterId: string) => {
    if (editTitle.trim()) {
      updateChapter(currentNovelId!, chapterId, { title: editTitle.trim() });
    }
    setEditingChapter(null);
    setEditTitle('');
  };

  const handleDelete = (chapterId: string) => {
    if (window.confirm('确定要删除这个章节吗？内容将无法恢复。')) {
      deleteChapter(currentNovelId!, chapterId);
    }
    setMenuOpen(null);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto py-2">
        {chapters.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-text-tertiary text-sm">
            <FileText className="w-8 h-8 mb-2 opacity-40" />
            <p>暂无章节</p>
          </div>
        ) : (
          <div className="space-y-0.5">
            {chapters.map((chapter, index) => (
              <motion.div
                key={chapter.id}
                layout
                className={`group flex items-center gap-1 px-3 py-2 cursor-pointer transition-colors ${
                  chapter.id === currentChapterId
                    ? 'bg-accent-light text-accent'
                    : 'hover:bg-bg-tertiary text-text-primary'
                }`}
                onClick={() => setCurrentChapter(chapter.id)}
              >
                <GripVertical className="w-3.5 h-3.5 text-text-tertiary opacity-0 group-hover:opacity-50 cursor-grab shrink-0" />

                <span className="text-xs text-text-tertiary w-8 shrink-0">
                  第{index + 1}章
                </span>

                {editingChapter === chapter.id ? (
                  <input
                    autoFocus
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onBlur={() => handleEditSubmit(chapter.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleEditSubmit(chapter.id);
                      if (e.key === 'Escape') setEditingChapter(null);
                    }}
                    className="flex-1 text-sm bg-transparent outline-none border-b border-accent"
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <span className="flex-1 text-sm truncate">{chapter.title}</span>
                )}

                <span className="text-xs text-text-tertiary shrink-0">
                  {chapter.paragraphs.reduce((s, p) => s + p.userText.length, 0)}
                </span>

                <div className="relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuOpen(menuOpen === chapter.id ? null : chapter.id);
                    }}
                    className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-bg-secondary transition-all shrink-0"
                  >
                    <MoreVertical className="w-3.5 h-3.5" />
                  </button>

                  {menuOpen === chapter.id && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setMenuOpen(null)}
                      />
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="absolute right-0 top-full mt-1 w-32 bg-surface rounded-lg shadow-lg border border-border py-1 z-50"
                      >
                        <button
                          onClick={() => {
                            setEditingChapter(chapter.id);
                            setEditTitle(chapter.title);
                            setMenuOpen(null);
                          }}
                          className="w-full text-left px-3 py-1.5 text-sm hover:bg-bg-secondary flex items-center gap-2"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          重命名
                        </button>
                        <button
                          onClick={() => handleDelete(chapter.id)}
                          className="w-full text-left px-3 py-1.5 text-sm hover:bg-accent-light text-accent flex items-center gap-2"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          删除
                        </button>
                      </motion.div>
                    </>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Add Chapter Button */}
      <div className="p-3 border-t border-border">
        <button
          onClick={onCreateChapter}
          className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-bg-tertiary hover:bg-border-light text-text-secondary hover:text-text-primary text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          新建章节
        </button>
      </div>
    </div>
  );
}
