import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Globe, Building2, Package, Tag } from 'lucide-react';
import { useNovelStore } from '../../store/useNovelStore';
import type { SettingItem } from '../../lib/types';

const CATEGORIES: { key: SettingItem['category']; label: string; icon: React.ReactNode }[] = [
  { key: 'world', label: '世界观', icon: <Globe className="w-3.5 h-3.5" /> },
  { key: 'faction', label: '势力', icon: <Building2 className="w-3.5 h-3.5" /> },
  { key: 'item', label: '道具', icon: <Package className="w-3.5 h-3.5" /> },
  { key: 'other', label: '其他', icon: <Tag className="w-3.5 h-3.5" /> },
];

const CATEGORY_COLORS: Record<string, string> = {
  world: 'bg-blue-50 text-blue-600',
  faction: 'bg-purple-50 text-purple-600',
  item: 'bg-amber-50 text-amber-600',
  other: 'bg-gray-50 text-gray-500',
};

export default function SettingPanel() {
  const { novels, currentNovelId, addSetting, updateSetting, deleteSetting } = useNovelStore();
  const [activeCategory, setActiveCategory] = useState<SettingItem['category']>('world');
  const [showForm, setShowForm] = useState(false);
  const [editingSetting, setEditingSetting] = useState<SettingItem | null>(null);
  const [formData, setFormData] = useState({ name: '', content: '' });

  const currentNovel = novels.find((n) => n.id === currentNovelId);
  const settings = currentNovel?.settings.filter((s) => s.category === activeCategory) || [];

  const handleSubmit = () => {
    if (!formData.name.trim() || !currentNovelId) return;

    if (editingSetting) {
      updateSetting(currentNovelId, editingSetting.id, {
        name: formData.name.trim(),
        content: formData.content,
      });
    } else {
      const newSetting: SettingItem = {
        id: `set-${Date.now()}`,
        category: activeCategory,
        name: formData.name.trim(),
        content: formData.content,
        createdAt: Date.now(),
      };
      addSetting(currentNovelId, newSetting);
    }

    resetForm();
  };

  const resetForm = () => {
    setFormData({ name: '', content: '' });
    setEditingSetting(null);
    setShowForm(false);
  };

  const startEdit = (setting: SettingItem) => {
    setEditingSetting(setting);
    setFormData({ name: setting.name, content: setting.content });
    setShowForm(true);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Category Tabs */}
      <div className="flex border-b border-border">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.key}
            onClick={() => setActiveCategory(cat.key)}
            className={`flex-1 flex items-center justify-center gap-1 py-2 text-xs font-medium transition-colors ${
              activeCategory === cat.key
                ? 'text-accent border-b-2 border-accent'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            {cat.icon}
            <span>{cat.label}</span>
          </button>
        ))}
      </div>

      {/* Settings List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {settings.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-24 text-text-tertiary text-sm">
            <p>暂无{CATEGORIES.find((c) => c.key === activeCategory)?.label}设定</p>
          </div>
        ) : (
          settings.map((setting) => (
            <motion.div
              key={setting.id}
              layout
              className="p-3 rounded-lg bg-surface border border-border-light hover:border-border transition-all cursor-pointer"
              onClick={() => startEdit(setting)}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-xs px-1.5 py-0.5 rounded ${CATEGORY_COLORS[setting.category]}`}>
                  {CATEGORIES.find((c) => c.key === setting.category)?.label}
                </span>
                <span className="text-sm font-medium">{setting.name}</span>
              </div>
              <p className="text-xs text-text-secondary line-clamp-3">{setting.content}</p>
            </motion.div>
          ))
        )}
      </div>

      {/* Add Button */}
      <div className="p-3 border-t border-border">
        <button
          onClick={() => setShowForm(true)}
          className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-bg-tertiary hover:bg-border-light text-text-secondary hover:text-text-primary text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          添加{CATEGORIES.find((c) => c.key === activeCategory)?.label}
        </button>
      </div>

      {/* Form Modal */}
      <AnimatePresence>
        {showForm && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/30 z-50"
              onClick={resetForm}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-x-4 top-[15%] max-w-md mx-auto bg-surface rounded-xl shadow-xl border border-border p-4 z-50"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium">
                  {editingSetting ? '编辑设定' : `添加${CATEGORIES.find((c) => c.key === activeCategory)?.label}`}
                </h3>
                <button onClick={resetForm} className="p-1 hover:bg-bg-secondary rounded">
                  <X className="w-4 h-4 text-text-tertiary" />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs text-text-secondary mb-1 block">名称 *</label>
                  <input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-bg-secondary border border-border focus:border-accent outline-none text-sm"
                    placeholder={`${CATEGORIES.find((c) => c.key === activeCategory)?.label}名称`}
                  />
                </div>

                <div>
                  <label className="text-xs text-text-secondary mb-1 block">内容</label>
                  <textarea
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-bg-secondary border border-border focus:border-accent outline-none text-sm resize-none h-24"
                    placeholder="详细描述..."
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  {editingSetting && (
                    <button
                      onClick={() => {
                        if (currentNovelId) {
                          deleteSetting(currentNovelId, editingSetting.id);
                        }
                        resetForm();
                      }}
                      className="flex-1 py-2 rounded-lg border border-accent text-accent text-sm font-medium hover:bg-accent-light transition-colors"
                    >
                      删除
                    </button>
                  )}
                  <button
                    onClick={handleSubmit}
                    className="flex-1 py-2 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent-hover transition-colors"
                  >
                    {editingSetting ? '保存' : '添加'}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
