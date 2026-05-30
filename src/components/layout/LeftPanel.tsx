import { motion } from 'framer-motion';
import {
  BookOpen,
  List,
  Users,
  Settings,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useNovelStore } from '../../store/useNovelStore';
import { useUIStore } from '../../store/useUIStore';
import ChapterPanel from '../panels/ChapterPanel';
import OutlinePanel from '../panels/OutlinePanel';
import CharacterPanel from '../panels/CharacterPanel';
import SettingPanel from '../panels/SettingPanel';
import type { PanelTab } from '../../lib/types';

const tabs: { key: PanelTab; label: string; icon: React.ReactNode }[] = [
  { key: 'chapters', label: '目录', icon: <BookOpen className="w-4 h-4" /> },
  { key: 'outline', label: '大纲', icon: <List className="w-4 h-4" /> },
  { key: 'characters', label: '人物', icon: <Users className="w-4 h-4" /> },
  { key: 'settings', label: '设定', icon: <Settings className="w-4 h-4" /> },
];

interface LeftPanelProps {
  onCreateChapter: () => void;
}

export default function LeftPanel({ onCreateChapter }: LeftPanelProps) {
  const { activePanel, panelCollapsed, setActivePanel, togglePanel } = useUIStore();
  const { currentNovelId } = useNovelStore();

  if (panelCollapsed) {
    return (
      <motion.div
        initial={{ x: -30, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut', delay: 0.1 }}
        className="w-10 border-r border-border bg-bg-secondary flex flex-col items-center py-2 shrink-0"
      >
        <button
          onClick={togglePanel}
          className="p-1.5 rounded-md hover:bg-bg-tertiary transition-colors mb-2"
          title="展开侧边栏"
        >
          <ChevronRight className="w-4 h-4 text-text-secondary" />
        </button>
        <div className="w-px h-4 bg-border my-1" />
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => {
              setActivePanel(tab.key);
              togglePanel();
            }}
            className={`p-2 rounded-md transition-colors my-0.5 ${
              activePanel === tab.key
                ? 'bg-accent-light text-accent'
                : 'text-text-secondary hover:bg-bg-tertiary'
            }`}
            title={tab.label}
          >
            {tab.icon}
          </button>
        ))}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ x: -30, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut', delay: 0.1 }}
      className="w-60 border-r border-border bg-bg-secondary flex flex-col shrink-0"
    >
      {/* Tabs */}
      <div className="flex items-center border-b border-border">
        <button
          onClick={togglePanel}
          className="p-2 hover:bg-bg-tertiary transition-colors shrink-0"
          title="收起侧边栏"
        >
          <ChevronLeft className="w-4 h-4 text-text-secondary" />
        </button>
        <div className="flex-1 flex">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActivePanel(tab.key)}
              className={`flex-1 flex items-center justify-center gap-1 py-2 text-xs font-medium transition-colors relative ${
                activePanel === tab.key
                  ? 'text-accent'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {tab.icon}
              <span className="hidden lg:inline">{tab.label}</span>
              {activePanel === tab.key && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-1/4 right-1/4 h-0.5 bg-accent rounded-full"
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Panel Content */}
      <div className="flex-1 overflow-y-auto">
        {currentNovelId ? (
          <motion.div
            key={activePanel}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.15 }}
            className="h-full"
          >
            {activePanel === 'chapters' && (
              <ChapterPanel onCreateChapter={onCreateChapter} />
            )}
            {activePanel === 'outline' && <OutlinePanel />}
            {activePanel === 'characters' && <CharacterPanel />}
            {activePanel === 'settings' && <SettingPanel />}
          </motion.div>
        ) : (
          <div className="flex items-center justify-center h-full text-text-tertiary text-sm">
            请先创建或选择小说
          </div>
        )}
      </div>
    </motion.div>
  );
}
