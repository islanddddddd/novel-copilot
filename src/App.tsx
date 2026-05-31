import { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Plus } from 'lucide-react';
import TopBar from './components/layout/TopBar';
import LeftPanel from './components/layout/LeftPanel';
import SplitEditor from './components/layout/SplitEditor';
import StatusBar from './components/layout/StatusBar';
import NovelCreator from './components/novel/NovelCreator';
import SettingsModal from './components/common/SettingsModal';
import { useNovelStore } from './store/useNovelStore';
import { useUIStore } from './store/useUIStore';
import type { Chapter } from './lib/types';

function App() {
  const { novels, currentNovelId, addNovel, addChapter, setCurrentChapter } = useNovelStore();
  const { showSettings, setShowSettings, settingsTab, togglePanel, theme } = useUIStore();
  const [showNovelCreator, setShowNovelCreator] = useState(false);
  const demoCreatedRef = useRef(false);

  // Apply dark theme to html
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Listen to system theme changes when in system mode
  useEffect(() => {
    const { themeMode } = useUIStore.getState();
    if (themeMode !== 'system') return;
    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => {
      useUIStore.setState({ theme: e.matches ? 'dark' : 'light' });
    };
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  // Create demo novel (only once, even with StrictMode)
  useEffect(() => {
    if (novels.length === 0 && !demoCreatedRef.current) {
      demoCreatedRef.current = true;
      addNovel({
        id: 'demo-novel',
        title: '我的第一本小说',
        summary: '这是一个示例小说，你可以从这里开始创作',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        chapters: [
          {
            id: 'demo-ch-1', title: '第一章', order: 0,
            paragraphs: [
              {
                id: 'demo-p-1',
                userText: '夕阳西下，金色的余晖洒在古老的石板路上。林墨站在村口的老槐树下，望着远方连绵起伏的山峦，心中涌起一股莫名的惆怅。',
                aiText: '暮色四合，最后一抹斜阳将碎金般的光芒倾洒在斑驳的石板古道上。林墨孑然独立于村口那株百年老槐之下，目光越过层层叠叠的远山，那些青黛色的轮廓在渐浓的暮霭中化作水墨般的剪影。一种说不清道不明的怅惘，如同这渐起的晚风，悄然漫过他的心田。',
                aiStatus: 'completed' as const, aiOperation: 'polish' as const,
                createdAt: Date.now(), updatedAt: Date.now(),
              },
              { id: 'demo-p-2', userText: '他想起三年前离开村子时的情景，那时候他还是个意气风发的少年，满怀着对江湖的憧憬。如今归来，却已是满身疲惫，心如止水。', aiText: '', aiStatus: 'idle' as const, createdAt: Date.now(), updatedAt: Date.now() },
            ],
            createdAt: Date.now(), updatedAt: Date.now(),
          },
        ],
        characters: [
          { id: 'demo-char-1', name: '林墨', role: 'protagonist' as const, description: '本书主角', appearance: '身材修长', personality: '内敛沉稳', background: '离家三年', relationships: [] },
        ],
        settings: [
          { id: 'demo-set-1', category: 'world' as const, name: '青石村', content: '位于群山脚下的小村庄', createdAt: Date.now() },
        ],
        writingStyles: [], promptTemplates: [], aiMode: 'manual' as const,
      });
    }
  }, []);

  const handleCreateNovel = useCallback((novel: Parameters<typeof addNovel>[0]) => addNovel(novel), [addNovel]);

  const handleCreateChapter = useCallback(() => {
    if (!currentNovelId) return;
    const nc = novels.find((n) => n.id === currentNovelId);
    const newChapter: Chapter = {
      id: `ch-${Date.now()}`, title: `第${(nc?.chapters.length || 0) + 1}章`, order: 0,
      paragraphs: [], createdAt: Date.now(), updatedAt: Date.now(),
    };
    addChapter(currentNovelId, newChapter);
    setCurrentChapter(newChapter.id);
  }, [currentNovelId, novels, addChapter, setCurrentChapter]);

  return (
    <div className="h-screen w-screen flex flex-col bg-bg-primary overflow-hidden">
      <TopBar onCreateNovel={() => setShowNovelCreator(true)} onTogglePanel={togglePanel} />
      <div className="flex-1 flex min-h-0">
        <LeftPanel onCreateChapter={handleCreateChapter} />
        {currentNovelId ? <SplitEditor /> : (
          <div className="flex-1 flex items-center justify-center">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
              <div className="w-20 h-20 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-10 h-10 text-accent" />
              </div>
              <h2 className="text-lg font-medium text-text-primary mb-2">欢迎来到伴作</h2>
              <p className="text-sm text-text-tertiary mb-4">创建你的第一本小说，开始 AI 辅助写作之旅</p>
              <button onClick={() => setShowNovelCreator(true)} className="px-5 py-2.5 rounded-xl bg-accent text-white font-medium hover:bg-accent-hover transition-colors flex items-center gap-2 mx-auto">
                <Plus className="w-4 h-4" />创建小说
              </button>
            </motion.div>
          </div>
        )}
      </div>
      <StatusBar />
      <NovelCreator isOpen={showNovelCreator} onClose={() => setShowNovelCreator(false)} onCreate={handleCreateNovel} />
      <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} initialTab={settingsTab} />
    </div>
  );
}

export default App;
