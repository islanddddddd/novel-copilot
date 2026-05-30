import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Key, Sparkles, Type, Palette, FileText, AlignVerticalSpaceAround,
  Trash2, Plus, Edit3, Save, RotateCcw, BookOpen, Settings2, ChevronRight,
  Sun, Moon, Monitor, TestTube, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAIStore, type SavedAIConfig } from '../../store/useAIStore';
import { useNovelStore } from '../../store/useNovelStore';
import { useUIStore } from '../../store/useUIStore';
import type { PromptTemplate, WritingStyle, AIConfig, AIMode } from '../../lib/types';
import type { SettingsTab } from '../../lib/types';

interface SettingsModalProps { isOpen: boolean; onClose: () => void; initialTab?: SettingsTab; }

const PROVIDERS = [
  { key: 'openai', label: 'OpenAI', defaultUrl: 'https://api.openai.com/v1', models: 'gpt-4o, gpt-4o-mini' },
  { key: 'deepseek', label: 'DeepSeek', defaultUrl: 'https://api.deepseek.com/v1', models: 'deepseek-chat, deepseek-reasoner' },
  { key: 'siliconflow', label: '硅基流动', defaultUrl: 'https://api.siliconflow.cn/v1', models: 'deepseek-ai/DeepSeek-V3' },
  { key: 'custom', label: '自定义', defaultUrl: '', models: '自定义模型' },
];

const DEFAULT_PROMPTS: Omit<PromptTemplate, 'id'>[] = [
  { name: '润色', template: `你是一位专业的小说编辑。请对以下段落进行润色，保持原文的意思和情节，但提升文笔质量。\n\n{{STYLE}}\n\n原文：\n{{TEXT}}\n\n请直接返回润色后的文本，不要添加任何解释或标注。`, isDefault: true },
  { name: '扩写', template: `你是一位专业的小说作者。请对以下段落进行扩写，在保持原有情节和风格的基础上，增加更多细节描写、环境渲染、心理活动或对话，使内容更加丰富饱满。\n\n{{STYLE}}\n\n原文：\n{{TEXT}}\n\n请直接返回扩写后的文本，不要添加任何解释或标注。`, isDefault: true },
  { name: '审查', template: `你是一位专业的小说审稿人。请审查以下段落，检查：\n1. 是否与前文大纲和设定一致\n2. 是否存在逻辑矛盾或设定冲突\n3. 伏笔是否得到呼应\n4. 文笔质量和改进建议\n\n大纲：\n{{OUTLINE}}\n\n设定：\n{{SETTINGS}}\n\n前文：\n{{PREVIOUS}}\n\n当前段落：\n{{TEXT}}\n\n请简要返回审查结果。`, isDefault: true },
];

const NAV_ITEMS: { key: SettingsTab; label: string; icon: React.ReactNode }[] = [
  { key: 'ai', label: 'AI 配置', icon: <Key className="w-4 h-4" /> },
  { key: 'editor', label: '编辑器设置', icon: <Settings2 className="w-4 h-4" /> },
  { key: 'styles', label: '文风管理', icon: <Palette className="w-4 h-4" /> },
  { key: 'prompts', label: 'Prompt 模板', icon: <FileText className="w-4 h-4" /> },
];

export default function SettingsModal({ isOpen, onClose, initialTab = 'ai' }: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>(initialTab);
  const { novels, currentNovelId, updateNovel, addWritingStyle, deleteWritingStyle, setDefaultStyle } = useNovelStore();
  const { themeMode, setThemeMode, syncHeight, setSyncHeight } = useUIStore();

  // AI Config management
  const configs = useAIStore((s) => s.configs);
  const currentConfigId = useAIStore((s) => s.currentConfigId);
  const addConfig = useAIStore((s) => s.addConfig);
  const updateConfig = useAIStore((s) => s.updateConfig);
  const deleteConfig = useAIStore((s) => s.deleteConfig);
  const setCurrentConfig = useAIStore((s) => s.setCurrentConfig);
  const modeSettings = useAIStore((s) => s.modeSettings);
  const defaultMode = useAIStore((s) => s.defaultMode);
  const setModeConfigId = useAIStore((s) => s.setModeConfigId);
  const setModeParam = useAIStore((s) => s.setModeParam);
  const setModeReasoning = useAIStore((s) => s.setModeReasoning);
  const setDefaultMode = useAIStore((s) => s.setDefaultMode);

  const [editingConfig, setEditingConfig] = useState<SavedAIConfig | null | undefined>(undefined);
  const [configName, setConfigName] = useState('');
  const [provider, setProvider] = useState<AIConfig['provider']>('deepseek');
  const [apiKey, setApiKey] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [model, setModel] = useState('');
  const [testedModels, setTestedModels] = useState<string[]>([]);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState('');

  const currentNovel = novels.find((n) => n.id === currentNovelId);

  // Style state
  const [styleSample, setStyleSample] = useState('');
  const [styleName, setStyleName] = useState('');
  const [learningStyle, setLearningStyle] = useState(false);

  // Prompt state
  const [editingPrompt, setEditingPrompt] = useState<PromptTemplate | null>(null);
  const [showPromptForm, setShowPromptForm] = useState(false);
  const [promptName, setPromptName] = useState('');
  const [promptContent, setPromptContent] = useState('');
  const [promptMode, setPromptMode] = useState<AIMode>('medium');

  useEffect(() => { if (isOpen) setActiveTab(initialTab); }, [isOpen, initialTab]);

  // ===== AI CONFIG =====
  const startEditConfig = (cfg?: SavedAIConfig) => {
    if (cfg) {
      setEditingConfig(cfg);
      setConfigName(cfg.name);
      setProvider(cfg.provider);
      setApiKey(cfg.apiKey);
      setBaseUrl(cfg.baseUrl || '');
      setModel(cfg.model || '');
    } else {
      // Add new config
      setEditingConfig(null);
      setConfigName('');
      setProvider('deepseek');
      setApiKey('');
      setBaseUrl('');
      setModel('');
    }
    setTestStatus('idle');
    setTestMessage('');
    setTestedModels([]);
  };

  const closeConfigForm = () => {
    setEditingConfig(undefined);
    setConfigName('');
    setApiKey('');
    setBaseUrl('');
    setModel('');
    setTestStatus('idle');
    setTestedModels([]);
  };

  const detectProvider = (url: string): AIConfig['provider'] => {
    if (url.includes('openai.com')) return 'openai';
    if (url.includes('deepseek.com')) return 'deepseek';
    if (url.includes('siliconflow.cn')) return 'siliconflow';
    return 'custom';
  };

  const handleSaveConfig = () => {
    if (!configName.trim() || !apiKey.trim()) return;
    const detectedProvider = detectProvider(baseUrl.trim());
    const cfgData = {
      name: configName.trim(),
      provider: detectedProvider,
      apiKey: apiKey.trim(),
      baseUrl: baseUrl.trim() || undefined,
      model: model.trim() || 'gpt-4o-mini',
    };
    if (editingConfig) {
      updateConfig(editingConfig.id, cfgData);
    } else {
      addConfig({ ...cfgData, id: `cfg-${Date.now()}` });
    }
    closeConfigForm();
  };

  const handleTestConfig = async () => {
    setTestStatus('testing');
    setTestMessage('');
    setTestedModels([]);
    const base = baseUrl.trim() || (PROVIDERS.find((p) => p.key === provider)?.defaultUrl) || '';
    if (!base || !apiKey.trim()) {
      setTestStatus('error'); setTestMessage('请先填写 API 地址和 Key'); return;
    }
    try {
      // Fetch available models (primary: lets user pick model first)
      const res = await fetch(`${base}/models`, {
        headers: { 'Authorization': `Bearer ${apiKey.trim()}` },
      });

      if (!res.ok) {
        // /models failed — try to extract error message
        let errMsg = '';
        try {
          const errJson = await res.json();
          errMsg = errJson.error?.message || `HTTP ${res.status}`;
        } catch {
          errMsg = `HTTP ${res.status}`;
        }
        setTestStatus('error');
        setTestMessage(`连接失败: ${errMsg}`);
        return;
      }

      // Parse model list
      const data = await res.json();
      const modelIds: string[] = data.data?.map((m: { id: string }) => m.id) || [];
      setTestedModels(modelIds);
      const preview = modelIds.slice(0, 3).join(', ');
      setTestStatus('success');
      setTestMessage(`连接成功！发现 ${modelIds.length} 个可用模型${preview ? ': ' + preview : ''}${modelIds.length > 3 ? '...' : ''}`);
    } catch (e) {
      setTestStatus('error');
      setTestMessage(`连接失败: ${e instanceof Error ? e.message : '网络错误'}`);
    }
  };

  // ===== STYLE =====
  const handleLearnStyle = async () => {
    if (!styleSample.trim() || !styleName.trim() || !currentNovelId) return;
    const currentCfg = configs.find((c) => c.id === currentConfigId);
    if (!currentCfg?.apiKey) { alert('请先配置 API'); return; }
    setLearningStyle(true);
    try {
      const { learnStyleFromText } = await import('../../lib/ai-service');
      const result = await learnStyleFromText(styleSample, currentCfg);
      const newStyle: WritingStyle = {
        id: `style-${Date.now()}`, name: styleName.trim(), sourceText: styleSample.slice(0, 500),
        description: result.description || '自定义文风', promptFragment: result.promptFragment || '', createdAt: Date.now(),
      };
      addWritingStyle(currentNovelId, newStyle);
      if (currentNovel && currentNovel.writingStyles.length === 0) setDefaultStyle(currentNovelId, newStyle.id);
      setStyleSample(''); setStyleName('');
    } catch { alert('文风学习失败'); }
    finally { setLearningStyle(false); }
  };

  // ===== PROMPT =====
  const handleSavePrompt = () => {
    if (!currentNovelId || !promptName.trim() || !promptContent.trim()) return;
    const currentPrompts = currentNovel?.promptTemplates || [];
    const templateData = { name: promptName.trim(), template: promptContent, mode: promptMode };
    if (editingPrompt) {
      // Directly update the template (including default ones)
      const existingIdx = currentPrompts.findIndex((t) => t.id === editingPrompt.id);
      if (existingIdx >= 0) {
        // Update existing user template
        const updated = [...currentPrompts];
        updated[existingIdx] = { ...updated[existingIdx], ...templateData };
        updateNovel(currentNovelId, { promptTemplates: updated });
      } else {
        // Editing a default template: add as override in user templates
        const newTemplate: PromptTemplate = { id: `prompt-${Date.now()}`, ...templateData, isDefault: false };
        updateNovel(currentNovelId, { promptTemplates: [...currentPrompts, newTemplate] });
      }
    } else {
      const newTemplate: PromptTemplate = { id: `prompt-${Date.now()}`, ...templateData };
      updateNovel(currentNovelId, { promptTemplates: [...currentPrompts, newTemplate] });
    }
    setEditingPrompt(null); setPromptName(''); setPromptContent(''); setPromptMode('medium'); setShowPromptForm(false);
  };

  const handleDeletePrompt = (templateId: string) => {
    if (!currentNovelId) return;
    const currentPrompts = currentNovel?.promptTemplates || [];
    updateNovel(currentNovelId, { promptTemplates: currentPrompts.filter((t) => t.id !== templateId) });
  };

  const resetPrompts = () => {
    if (!currentNovelId || !window.confirm('确定重置所有 Prompt 模板为默认？自定义模板将被删除。')) return;
    updateNovel(currentNovelId, { promptTemplates: DEFAULT_PROMPTS.map((p, i) => ({ ...p, id: `default-prompt-${i}` })) });
  };

  const startEditPrompt = (template: PromptTemplate) => {
    setEditingPrompt(template); setPromptName(template.name); setPromptContent(template.template); setPromptMode(template.mode || 'medium'); setShowPromptForm(true);
  };
  const startNewPrompt = () => {
    setEditingPrompt(null); setPromptName(''); setPromptContent(''); setPromptMode('medium'); setShowPromptForm(true);
  };
  const closePromptForm = () => {
    setEditingPrompt(null); setPromptName(''); setPromptContent(''); setPromptMode('medium'); setShowPromptForm(false);
  };

  const getAvatarColor = (name: string) => {
    const colors = ['#B85450', '#4A7C9B', '#6B8E6B', '#D4A574', '#8B7CB3'];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
  };

  const allPrompts: PromptTemplate[] = (() => {
    const userPrompts = currentNovel?.promptTemplates || [];
    const defaults = DEFAULT_PROMPTS.map((p, i) => ({ ...p, id: `default-prompt-${i}` }));
    // User templates override defaults by name
    return defaults.map((d) => {
      const override = userPrompts.find((u) => u.name === d.name);
      return override || d;
    }).concat(userPrompts.filter((u) => !defaults.find((d) => d.name === u.name)));
  })();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/30 z-50" onClick={onClose} />
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.2 }}
            className="fixed inset-4 md:inset-x-[10%] md:inset-y-[5%] max-w-3xl mx-auto bg-surface rounded-xl shadow-2xl border border-border z-50 flex overflow-hidden">
            {/* Sidebar */}
            <div className="w-48 border-r border-border bg-bg-secondary flex flex-col shrink-0">
              <div className="p-4 border-b border-border">
                <h2 className="text-sm font-medium flex items-center gap-2"><BookOpen className="w-4 h-4 text-accent" />设置</h2>
              </div>
              <nav className="flex-1 py-2">
                {NAV_ITEMS.map((item) => (
                  <button key={item.key} onClick={() => setActiveTab(item.key)}
                    className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors ${
                      activeTab === item.key ? 'text-accent bg-accent-light font-medium' : 'text-text-secondary hover:text-text-primary hover:bg-bg-tertiary'}`}>
                    {item.icon}<span>{item.label}</span>{activeTab === item.key && <ChevronRight className="w-3.5 h-3.5 ml-auto" />}
                  </button>
                ))}
              </nav>
            </div>

            {/* Content */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3 border-b border-border">
                <h3 className="text-sm font-medium">{NAV_ITEMS.find((n) => n.key === activeTab)?.label}</h3>
                <button onClick={onClose} className="p-1.5 hover:bg-bg-secondary rounded-lg transition-colors"><X className="w-4 h-4 text-text-tertiary" /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-5">

                {/* ========== AI CONFIG ========== */}
                {activeTab === 'ai' && (
                  <div className="space-y-4">
                    {/* Config list */}
                    <div className="space-y-2">
                      {configs.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-text-tertiary">
                          <div className="w-14 h-14 rounded-full bg-bg-tertiary flex items-center justify-center mb-3">
                            <Key className="w-6 h-6 text-text-tertiary" />
                          </div>
                          <p className="text-sm mb-1">还没有 API 配置</p>
                          <p className="text-xs mb-4">添加配置后即可使用 AI 辅助写作</p>
                          <button
                            onClick={() => startEditConfig()}
                            className="px-5 py-2 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent-hover transition-colors flex items-center gap-2"
                          >
                            <Plus className="w-4 h-4" />添加配置
                          </button>
                        </div>
                      ) : (
                        configs.map((cfg) => (
                          <div key={cfg.id} className={`p-3 rounded-lg border transition-all ${currentConfigId === cfg.id ? 'border-accent bg-accent-light' : 'border-border-light bg-bg-secondary hover:border-border'}`}>
                            <div className="flex items-center justify-between">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium">{cfg.name}</span>
                                  <span className="text-xs px-1.5 py-0.5 rounded bg-bg-tertiary text-text-secondary">{PROVIDERS.find((p) => p.key === cfg.provider)?.label || cfg.provider}</span>
                                  {currentConfigId === cfg.id && <span className="text-xs px-1.5 py-0.5 rounded bg-accent text-white">当前</span>}
                                </div>
                                <p className="text-xs text-text-tertiary mt-0.5 truncate">{cfg.baseUrl || PROVIDERS.find((p) => p.key === cfg.provider)?.defaultUrl}</p>
                              </div>
                              <div className="flex items-center gap-1 ml-2">
                                {currentConfigId !== cfg.id && (
                                  <button onClick={() => setCurrentConfig(cfg.id)} className="px-2 py-1 rounded text-xs text-accent hover:bg-accent-light">切换</button>
                                )}
                                <button onClick={() => startEditConfig(cfg)} className="p-1.5 rounded hover:bg-bg-tertiary text-text-tertiary"><Edit3 className="w-3.5 h-3.5" /></button>
                                <button onClick={() => deleteConfig(cfg.id)} className="p-1.5 rounded hover:bg-red-50 text-text-tertiary hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Add new config button - shown when there are configs and not editing */}
                    {configs.length > 0 && !editingConfig && (
                      <button
                        onClick={() => startEditConfig()}
                        className="w-full py-2.5 rounded-lg border border-dashed border-border text-sm text-text-secondary hover:text-accent hover:border-accent hover:bg-accent-light/50 transition-all flex items-center justify-center gap-2"
                      >
                        <Plus className="w-4 h-4" />添加新配置
                      </button>
                    )}

                    {/* Add / Edit form - only shown when editing */}
                    <AnimatePresence>
                      {editingConfig !== undefined && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="border-t border-border pt-4">
                            <h4 className="text-sm font-medium mb-3">{editingConfig ? `编辑: ${editingConfig.name}` : '添加新配置'}</h4>
                            <div className="space-y-3 max-w-md">
                              {/* Config name */}
                              <div>
                                <label className="text-xs text-text-secondary mb-1 block">配置名称</label>
                                <input value={configName} onChange={(e) => setConfigName(e.target.value)} placeholder="如：DeepSeek 主账号"
                                  className="w-full px-3 py-2 rounded-lg bg-bg-secondary border border-border focus:border-accent outline-none text-sm" />
                              </div>

                              {/* API Key */}
                              <div>
                                <label className="text-xs text-text-secondary mb-1 block">API Key</label>
                                <input type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)}
                                  placeholder="sk-xxxxxxxx"
                                  className="w-full px-3 py-2 rounded-lg bg-bg-secondary border border-border focus:border-accent outline-none text-sm" />
                              </div>

                              {/* API Base URL */}
                              <div>
                                <label className="text-xs text-text-secondary mb-1 block">API 地址</label>
                                <input value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)}
                                  placeholder="https://api.example.com/v1"
                                  className="w-full px-3 py-2 rounded-lg bg-bg-secondary border border-border focus:border-accent outline-none text-sm" />
                                <p className="text-xs text-text-tertiary mt-1">常用: https://api.deepseek.com/v1, https://api.openai.com/v1, https://api.siliconflow.cn/v1</p>
                              </div>

                              {/* Model + test result capsules */}
                              <div>
                                <label className="text-xs text-text-secondary mb-1 block">模型</label>
                                <input value={model} onChange={(e) => setModel(e.target.value)}
                                  placeholder="deepseek-chat"
                                  className="w-full px-3 py-2 rounded-lg bg-bg-secondary border border-border focus:border-accent outline-none text-sm" />
                                {/* Model capsules from test */}
                                <AnimatePresence>
                                  {testedModels.length > 0 && (
                                    <motion.div
                                      initial={{ opacity: 0, height: 0 }}
                                      animate={{ opacity: 1, height: 'auto' }}
                                      exit={{ opacity: 0, height: 0 }}
                                      className="mt-2 flex flex-wrap gap-1.5 overflow-hidden"
                                    >
                                      <span className="text-xs text-text-tertiary mr-1">可用模型:</span>
                                      {testedModels.slice(0, 8).map((m) => (
                                        <button
                                          key={m}
                                          onClick={() => setModel(m)}
                                          className="px-2 py-0.5 rounded-full text-[11px] bg-bg-tertiary text-text-secondary hover:bg-accent-light hover:text-accent transition-colors"
                                        >
                                          {m}
                                        </button>
                                      ))}
                                      {testedModels.length > 8 && (
                                        <span className="text-[11px] text-text-tertiary self-center">+{testedModels.length - 8}</span>
                                      )}
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>

                              {/* Provider (hidden field, auto-detected from URL) */}
                              <input type="hidden" value={provider} />

                              {/* Buttons */}
                              <div className="flex gap-2 pt-1">
                                <button onClick={handleTestConfig} disabled={testStatus === 'testing' || !apiKey.trim()}
                                  className="flex-1 py-2 rounded-lg border border-border text-sm text-text-secondary hover:bg-bg-secondary transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                                  {testStatus === 'testing' ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />测试中...</> : <><TestTube className="w-3.5 h-3.5" />测试连接</>}
                                </button>
                                <button onClick={handleSaveConfig} disabled={!configName.trim() || !apiKey.trim()}
                                  className="flex-1 py-2 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent-hover transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                                  <Save className="w-3.5 h-3.5" />{editingConfig ? '保存' : '添加'}
                                </button>
                              </div>

                              {/* Test result message */}
                              <AnimatePresence>
                                {testStatus !== 'idle' && testStatus !== 'testing' && (
                                  <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                                    className={`p-2.5 rounded-lg text-xs flex items-start gap-2 ${testStatus === 'success' ? 'bg-success/10 text-success' : 'bg-error/10 text-error'}`}>
                                    {testStatus === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" /> : <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />}
                                    <span className="break-all">{testMessage}</span>
                                  </motion.div>
                                )}
                              </AnimatePresence>

                              <button onClick={closeConfigForm}
                                className="w-full py-2 rounded-lg border border-border text-sm text-text-secondary hover:bg-bg-secondary transition-colors">
                                取消
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* AI Mode Settings */}
                    {configs.length > 0 && (
                      <div className="border-t border-border pt-4 space-y-3">
                        <h4 className="text-sm font-medium flex items-center gap-2">
                          <Sparkles className="w-3.5 h-3.5 text-accent" />
                          AI 模式设置
                        </h4>
                        <p className="text-xs text-text-tertiary">为不同质量模式指定 API 配置和参数</p>

                        {([
                          { key: 'high' as const, label: '高质量', desc: '深度推理，最佳效果', color: 'text-accent' },
                          { key: 'medium' as const, label: '均衡', desc: '平衡质量与速度', color: 'text-processing' },
                          { key: 'fast' as const, label: '快速', desc: '最快响应', color: 'text-success' },
                        ]).map(({ key, label, desc, color }) => {
                          const ms = modeSettings[key];
                          const linkedCfg = configs.find((c) => c.id === ms.configId);
                          return (
                            <div key={key} className="p-3 rounded-lg border border-border-light bg-bg-secondary">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <span className={`text-sm font-medium ${color}`}>{label}</span>
                                  <span className="text-xs text-text-tertiary">{desc}</span>
                                  {defaultMode === key && <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent text-white">默认</span>}
                                </div>
                                <button
                                  onClick={() => setDefaultMode(key)}
                                  disabled={defaultMode === key}
                                  className="text-xs text-accent hover:bg-accent-light px-2 py-0.5 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  设为默认
                                </button>
                              </div>

                              {/* Config selector */}
                              <div className="mb-2">
                                <label className="text-[11px] text-text-secondary mb-1 block">关联配置</label>
                                <select
                                  value={ms.configId || ''}
                                  onChange={(e) => setModeConfigId(key, e.target.value || null)}
                                  className="w-full px-2 py-1.5 rounded bg-surface border border-border text-xs outline-none focus:border-accent"
                                >
                                  <option value="">使用当前配置</option>
                                  {configs.map((c) => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                  ))}
                                </select>
                                {linkedCfg && (
                                  <p className="text-[10px] text-text-tertiary mt-0.5">{linkedCfg.provider} · {linkedCfg.model}</p>
                                )}
                              </div>

                              {/* Parameters */}
                              <div className="space-y-2">
                                <div>
                                  <label className="text-[11px] text-text-secondary mb-1 block">Temperature</label>
                                  <input
                                    type="range" min="0" max="2" step="0.1"
                                    value={ms.temperature}
                                    onChange={(e) => setModeParam(key, 'temperature', parseFloat(e.target.value))}
                                    className="w-full accent-accent"
                                  />
                                  <span className="text-[10px] text-text-tertiary">{ms.temperature}</span>
                                </div>
                                <div>
                                  <div className="flex items-center justify-between mb-1">
                                    <label className="text-[11px] text-text-secondary">Max Tokens</label>
                                    <label className="flex items-center gap-1 cursor-pointer">
                                      <input
                                        type="checkbox"
                                        checked={ms.maxTokens === null}
                                        onChange={(e) => setModeParam(key, 'maxTokens', e.target.checked ? null : 4000)}
                                        className="accent-accent"
                                      />
                                      <span className="text-[11px] text-text-secondary">无上限</span>
                                    </label>
                                  </div>
                                  <input
                                    type="range"
                                    min="1000"
                                    max="10000"
                                    step="1000"
                                    value={ms.maxTokens ?? 4000}
                                    disabled={ms.maxTokens === null}
                                    onChange={(e) => setModeParam(key, 'maxTokens', parseInt(e.target.value))}
                                    className="w-full accent-accent disabled:opacity-30"
                                  />
                                  <span className="text-[10px] text-text-tertiary">
                                    {ms.maxTokens === null ? '无上限' : `${(ms.maxTokens / 1000).toFixed(0)}k`}
                                  </span>
                                </div>
                              </div>

                              {/* Reasoning toggle */}
                              <div className="mt-2 flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  id={`reasoning-${key}`}
                                  checked={ms.enableReasoning}
                                  onChange={(e) => setModeReasoning(key, e.target.checked)}
                                  className="accent-accent"
                                />
                                <label htmlFor={`reasoning-${key}`} className="text-xs text-text-secondary">启用推理模式（如模型支持）</label>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* ========== EDITOR SETTINGS ========== */}
                {activeTab === 'editor' && (
                  <div className="space-y-6 max-w-md">
                    {/* Theme */}
                    <div className="p-4 rounded-lg border border-border bg-bg-secondary">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
                          <Sun className="w-4 h-4 text-amber-500" />
                        </div>
                        <div>
                          <h4 className="text-sm font-medium">主题模式</h4>
                          <p className="text-xs text-text-tertiary">选择界面颜色主题</p>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-2">
                        {[
                          { key: 'light' as const, label: '浅色', icon: <Sun className="w-3.5 h-3.5" /> },
                          { key: 'dark' as const, label: '深色', icon: <Moon className="w-3.5 h-3.5" /> },
                          { key: 'system' as const, label: '跟随系统', icon: <Monitor className="w-3.5 h-3.5" /> },
                        ].map((t) => (
                          <button key={t.key} onClick={() => setThemeMode(t.key)}
                            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-colors ${
                              themeMode === t.key ? 'bg-accent text-white' : 'bg-bg-tertiary text-text-secondary hover:bg-border-light'}`}>
                            {t.icon}<span>{t.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Sync height */}
                    <div className="p-4 rounded-lg border border-border bg-bg-secondary">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-accent-light flex items-center justify-center">
                            <AlignVerticalSpaceAround className="w-4 h-4 text-accent" />
                          </div>
                          <div>
                            <h4 className="text-sm font-medium">段落高度同步</h4>
                            <p className="text-xs text-text-tertiary">左右编辑区对应段落保持相同高度</p>
                          </div>
                        </div>
                        <button onClick={() => setSyncHeight(!syncHeight)}
                          className={`relative w-11 h-6 rounded-full transition-colors ${syncHeight ? 'bg-accent' : 'bg-border'}`}>
                          <motion.div className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow"
                            animate={{ x: syncHeight ? 20 : 0 }} transition={{ type: 'spring', stiffness: 500, damping: 30 }} />
                        </button>
                      </div>
                    </div>

                    {/* Shortcuts */}
                    <div className="p-4 rounded-lg border border-border bg-bg-secondary">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                          <Type className="w-4 h-4 text-blue-500" />
                        </div>
                        <h4 className="text-sm font-medium">快捷键说明</h4>
                      </div>
                      <div className="text-xs text-text-secondary space-y-1.5 mt-2 pl-11">
                        <div className="flex justify-between"><span className="text-text-tertiary">Enter</span><span>新建段落</span></div>
                        <div className="flex justify-between"><span className="text-text-tertiary">Backspace (空段)</span><span>删除段落</span></div>
                        <div className="flex justify-between"><span className="text-text-tertiary">Ctrl/Cmd + Click</span><span>多选段落</span></div>
                        <div className="flex justify-between"><span className="text-text-tertiary">Shift + Click</span><span>范围选择</span></div>
                        <div className="flex justify-between"><span className="text-text-tertiary">鼠标拖拽</span><span>框选段落</span></div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ========== STYLE ========== */}
                {activeTab === 'styles' && (
                  <div className="space-y-4 max-w-lg">
                    <div className="space-y-2">
                      {(currentNovel?.writingStyles || []).length === 0 ? (
                        <div className="text-center py-8 text-text-tertiary text-sm">
                          <Palette className="w-8 h-8 mx-auto mb-2 opacity-40" /><p>还没有保存的文风</p>
                        </div>
                      ) : (
                        (currentNovel?.writingStyles || []).map((style) => (
                          <div key={style.id} className={`p-3 rounded-lg border transition-all ${currentNovel?.defaultStyleId === style.id ? 'border-accent bg-accent-light' : 'border-border-light bg-bg-secondary hover:border-border'}`}>
                            <div className="flex items-center justify-between">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0" style={{ backgroundColor: getAvatarColor(style.name) }}>{style.name.charAt(0)}</div>
                                  <span className="text-sm font-medium">{style.name}</span>
                                  {currentNovel?.defaultStyleId === style.id && <span className="text-xs px-1.5 py-0.5 rounded bg-accent text-white">默认</span>}
                                </div>
                                <p className="text-xs text-text-secondary mt-1 truncate">{style.description}</p>
                              </div>
                              <div className="flex items-center gap-1 ml-2">
                                {currentNovel?.defaultStyleId !== style.id && currentNovelId && (
                                  <button onClick={() => setDefaultStyle(currentNovelId, style.id)} className="px-2 py-1 rounded text-xs text-accent hover:bg-accent-light">设为默认</button>
                                )}
                                <button onClick={() => currentNovelId && deleteWritingStyle(currentNovelId, style.id)} className="p-1.5 rounded hover:bg-red-50 text-text-tertiary hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                    <div className="border-t border-border pt-4">
                      <h4 className="text-sm font-medium mb-3 flex items-center gap-2"><Sparkles className="w-3.5 h-3.5 text-accent" />学习新文风</h4>
                      <div className="space-y-2">
                        <input value={styleName} onChange={(e) => setStyleName(e.target.value)} placeholder="文风名称"
                          className="w-full px-3 py-2 rounded-lg bg-bg-secondary border border-border focus:border-accent outline-none text-sm" />
                        <textarea value={styleSample} onChange={(e) => setStyleSample(e.target.value)} placeholder="粘贴参考文本样本..."
                          className="w-full px-3 py-2 rounded-lg bg-bg-secondary border border-border focus:border-accent outline-none text-sm resize-none h-24" />
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-text-tertiary">{styleSample.length} 字</span>
                          <button onClick={handleLearnStyle} disabled={!styleSample.trim() || !styleName.trim() || learningStyle || !configs.find((c) => c.id === currentConfigId)?.apiKey}
                            className="px-4 py-2 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent-hover transition-colors disabled:opacity-50">
                            {learningStyle ? '分析中...' : '开始分析'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ========== PROMPTS ========== */}
                {activeTab === 'prompts' && (
                  <div className="space-y-4 max-w-lg">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium">Prompt 模板列表</h4>
                      <div className="flex gap-1">
                        <button onClick={startNewPrompt}
                          className="p-1.5 rounded-lg hover:bg-bg-secondary text-text-secondary" title="新建模板"><Plus className="w-4 h-4" /></button>
                        <button onClick={resetPrompts} className="p-1.5 rounded-lg hover:bg-bg-secondary text-text-secondary" title="重置为默认"><RotateCcw className="w-4 h-4" /></button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {allPrompts.map((template) => (
                        <div key={template.id} className={`p-3 rounded-lg border transition-all ${editingPrompt?.id === template.id ? 'border-accent bg-accent-light' : 'border-border-light bg-bg-secondary hover:border-border'}`}>
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">{template.name}</span>
                              {template.isDefault && <span className="text-xs px-1.5 py-0.5 rounded bg-blue-50 text-blue-500">内置</span>}
                              {template.mode && (
                                <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                                  template.mode === 'high' ? 'bg-accent/10 text-accent' :
                                  template.mode === 'fast' ? 'bg-success/10 text-success' :
                                  'bg-processing/10 text-processing'
                                }`}>
                                  {template.mode === 'high' ? '高质量' : template.mode === 'fast' ? '快速' : '均衡'}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1">
                              <button onClick={() => startEditPrompt(template)} className="p-1 rounded hover:bg-bg-tertiary text-text-tertiary"><Edit3 className="w-3.5 h-3.5" /></button>
                              {!template.isDefault && <button onClick={() => handleDeletePrompt(template.id)} className="p-1 rounded hover:bg-red-50 text-text-tertiary hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>}
                            </div>
                          </div>
                          <p className="text-xs text-text-secondary line-clamp-2">{template.template}</p>
                        </div>
                      ))}
                    </div>
                    {showPromptForm && (
                    <div className="border-t border-border pt-4">
                      <h4 className="text-sm font-medium mb-3">{editingPrompt ? `编辑: ${editingPrompt.name}` : '新建模板'}</h4>
                      <div className="space-y-2">
                        <input value={promptName} onChange={(e) => setPromptName(e.target.value)} placeholder="模板名称"
                          className="w-full px-3 py-2 rounded-lg bg-bg-secondary border border-border focus:border-accent outline-none text-sm" />

                        {/* AI Mode selector */}
                        <div>
                          <label className="text-xs text-text-secondary mb-1 block">AI 模式</label>
                          <div className="flex gap-2">
                            {([
                              { key: 'high' as const, label: '高质量', color: 'bg-accent text-white' },
                              { key: 'medium' as const, label: '均衡', color: 'bg-processing text-white' },
                              { key: 'fast' as const, label: '快速', color: 'bg-success text-white' },
                            ]).map(({ key, label, color }) => (
                              <button
                                key={key}
                                onClick={() => setPromptMode(key)}
                                className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                  promptMode === key ? color : 'bg-bg-tertiary text-text-secondary hover:bg-border-light'
                                }`}
                              >
                                {label}
                              </button>
                            ))}
                          </div>
                        </div>

                        <textarea value={promptContent} onChange={(e) => setPromptContent(e.target.value)}
                          placeholder={`可用占位符: {{TEXT}}, {{STYLE}}, {{OUTLINE}}, {{SETTINGS}}, {{PREVIOUS}}, {{CUSTOM_PROMPT}}`}
                          className="w-full px-3 py-2 rounded-lg bg-bg-secondary border border-border focus:border-accent outline-none text-sm resize-none h-40 font-mono text-xs leading-relaxed" />
                        <div className="flex gap-2">
                          <button onClick={closePromptForm}
                            className="flex-1 py-2 rounded-lg border border-border text-sm text-text-secondary hover:bg-bg-secondary transition-colors">取消</button>
                          <button onClick={handleSavePrompt} disabled={!promptName.trim() || !promptContent.trim()}
                            className="flex-1 py-2 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent-hover transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5">
                            <Save className="w-3.5 h-3.5" />{editingPrompt ? '保存修改' : '创建模板'}
                          </button>
                        </div>
                      </div>
                    </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
