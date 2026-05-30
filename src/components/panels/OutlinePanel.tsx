import { useState, useEffect } from 'react';
import { Pin, PinOff } from 'lucide-react';
import { useNovelStore } from '../../store/useNovelStore';
import { useUIStore } from '../../store/useUIStore';

export default function OutlinePanel() {
  const { novels, currentNovelId, updateNovel } = useNovelStore();
  const { outlinePinned, toggleOutlinePinned } = useUIStore();
  const [localOutline, setLocalOutline] = useState('');

  const currentNovel = novels.find((n) => n.id === currentNovelId);

  useEffect(() => {
    setLocalOutline(currentNovel?.outline || '');
  }, [currentNovel?.outline]);

  const handleSave = () => {
    if (currentNovelId) {
      updateNovel(currentNovelId, { outline: localOutline });
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border">
        <span className="text-xs font-medium text-text-secondary">故事大纲</span>
        <button
          onClick={toggleOutlinePinned}
          className={`p-1.5 rounded-md transition-colors ${
            outlinePinned ? 'bg-accent-light text-accent' : 'hover:bg-bg-tertiary text-text-tertiary'
          }`}
          title={outlinePinned ? '取消固定到右侧' : '固定到右侧'}
        >
          {outlinePinned ? <Pin className="w-3.5 h-3.5" /> : <PinOff className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Editor */}
      <div className="flex-1 p-3">
        <textarea
          value={localOutline}
          onChange={(e) => setLocalOutline(e.target.value)}
          onBlur={handleSave}
          placeholder="在这里编写故事大纲...

支持 markdown 格式：
# 主要情节
## 第一卷
- 开篇：主角发现神秘信件
- 发展：追踪信件来源
- 高潮：真相大白
- 结局：留下悬念"
          className="w-full h-full bg-transparent text-sm leading-relaxed resize-none outline-none placeholder:text-text-tertiary"
        />
      </div>

      {outlinePinned && (
        <div className="px-3 py-2 border-t border-border text-xs text-accent bg-accent-light">
          大纲已固定到右侧
        </div>
      )}
    </div>
  );
}
