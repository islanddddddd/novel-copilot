import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Users } from 'lucide-react';
import { useNovelStore } from '../../store/useNovelStore';
import type { Character } from '../../lib/types';

const ROLE_COLORS: Record<string, string> = {
  protagonist: 'bg-accent-light text-accent border-accent/30',
  supporting: 'bg-blue-50 text-blue-600 border-blue-200',
  antagonist: 'bg-red-50 text-red-600 border-red-200',
  minor: 'bg-gray-50 text-gray-500 border-gray-200',
};

const ROLE_LABELS: Record<string, string> = {
  protagonist: '主角',
  supporting: '配角',
  antagonist: '反派',
  minor: '龙套',
};

export default function CharacterPanel() {
  const { novels, currentNovelId, addCharacter, updateCharacter, deleteCharacter } = useNovelStore();
  const [showForm, setShowForm] = useState(false);
  const [editingChar, setEditingChar] = useState<Character | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    role: 'protagonist' as Character['role'],
    description: '',
    appearance: '',
    personality: '',
    background: '',
  });

  const currentNovel = novels.find((n) => n.id === currentNovelId);
  const characters = currentNovel?.characters || [];

  const handleSubmit = () => {
    if (!formData.name.trim() || !currentNovelId) return;

    if (editingChar) {
      updateCharacter(currentNovelId, editingChar.id, {
        ...formData,
        name: formData.name.trim(),
      });
    } else {
      const newChar: Character = {
        id: `char-${Date.now()}`,
        name: formData.name.trim(),
        role: formData.role,
        description: formData.description,
        appearance: formData.appearance,
        personality: formData.personality,
        background: formData.background,
        relationships: [],
      };
      addCharacter(currentNovelId, newChar);
    }

    resetForm();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      role: 'protagonist' as Character['role'],
      description: '',
      appearance: '',
      personality: '',
      background: '',
    });
    setEditingChar(null);
    setShowForm(false);
  };

  const startEdit = (char: Character) => {
    setEditingChar(char);
    setFormData({
      name: char.name,
      role: char.role,
      description: char.description || '',
      appearance: char.appearance || '',
      personality: char.personality || '',
      background: char.background || '',
    });
    setShowForm(true);
  };

  const getAvatarColor = (name: string) => {
    const colors = ['#B85450', '#4A7C9B', '#6B8E6B', '#D4A574', '#8B7CB3'];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <div className="flex flex-col h-full">
      {/* Character List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {characters.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-text-tertiary text-sm">
            <Users className="w-8 h-8 mb-2 opacity-40" />
            <p>还没有人物</p>
            <p className="text-xs mt-1">添加第一个角色吧</p>
          </div>
        ) : (
          characters.map((char) => (
            <motion.div
              key={char.id}
              layout
              className="group p-3 rounded-lg bg-surface border border-border-light hover:border-border transition-all cursor-pointer"
              onClick={() => startEdit(char)}
            >
              <div className="flex items-start gap-2.5">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
                  style={{ backgroundColor: getAvatarColor(char.name) }}
                >
                  {char.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{char.name}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded border ${ROLE_COLORS[char.role]}`}>
                      {ROLE_LABELS[char.role]}
                    </span>
                  </div>
                  {char.description && (
                    <p className="text-xs text-text-secondary mt-1 line-clamp-2">{char.description}</p>
                  )}
                </div>
              </div>
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
          添加人物
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
              transition={{ duration: 0.2 }}
              className="fixed inset-x-4 top-[10%] max-w-md mx-auto bg-surface rounded-xl shadow-xl border border-border p-4 z-50 max-h-[80vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium">
                  {editingChar ? '编辑人物' : '添加人物'}
                </h3>
                <button onClick={resetForm} className="p-1 hover:bg-bg-secondary rounded">
                  <X className="w-4 h-4 text-text-tertiary" />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs text-text-secondary mb-1 block">姓名 *</label>
                  <input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-bg-secondary border border-border focus:border-accent outline-none text-sm"
                    placeholder="角色姓名"
                  />
                </div>

                <div>
                  <label className="text-xs text-text-secondary mb-1 block">角色定位</label>
                  <div className="flex gap-2">
                    {(['protagonist', 'supporting', 'antagonist', 'minor'] as const).map((role) => (
                      <button
                        key={role}
                        onClick={() => setFormData({ ...formData, role })}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                          formData.role === role
                            ? ROLE_COLORS[role]
                            : 'bg-bg-tertiary text-text-secondary hover:bg-border-light'
                        }`}
                      >
                        {ROLE_LABELS[role]}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs text-text-secondary mb-1 block">简介</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-bg-secondary border border-border focus:border-accent outline-none text-sm resize-none h-16"
                    placeholder="角色的简要介绍"
                  />
                </div>

                <div>
                  <label className="text-xs text-text-secondary mb-1 block">外貌</label>
                  <textarea
                    value={formData.appearance}
                    onChange={(e) => setFormData({ ...formData, appearance: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-bg-secondary border border-border focus:border-accent outline-none text-sm resize-none h-16"
                    placeholder="外貌特征"
                  />
                </div>

                <div>
                  <label className="text-xs text-text-secondary mb-1 block">性格</label>
                  <textarea
                    value={formData.personality}
                    onChange={(e) => setFormData({ ...formData, personality: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-bg-secondary border border-border focus:border-accent outline-none text-sm resize-none h-16"
                    placeholder="性格特点"
                  />
                </div>

                <div>
                  <label className="text-xs text-text-secondary mb-1 block">背景</label>
                  <textarea
                    value={formData.background}
                    onChange={(e) => setFormData({ ...formData, background: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-bg-secondary border border-border focus:border-accent outline-none text-sm resize-none h-16"
                    placeholder="人物背景故事"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  {editingChar && (
                    <button
                      onClick={() => {
                        if (currentNovelId) {
                          deleteCharacter(currentNovelId, editingChar.id);
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
                    {editingChar ? '保存' : '添加'}
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
