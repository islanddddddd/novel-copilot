import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Key, Server, Check } from 'lucide-react';
import { useAIStore } from '../../store/useAIStore';
import type { AIConfig } from '../../lib/types';

interface AIConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PROVIDERS = [
  { key: 'openai', label: 'OpenAI', defaultUrl: 'https://api.openai.com/v1', models: 'gpt-4o, gpt-4o-mini' },
  { key: 'deepseek', label: 'DeepSeek', defaultUrl: 'https://api.deepseek.com/v1', models: 'deepseek-chat, deepseek-reasoner' },
  { key: 'siliconflow', label: '硅基流动', defaultUrl: 'https://api.siliconflow.cn/v1', models: 'deepseek-ai/DeepSeek-V3' },
  { key: 'custom', label: '自定义', defaultUrl: '', models: '自定义模型' },
];

export default function AIConfigModal({ isOpen, onClose }: AIConfigModalProps) {
  const addConfig = useAIStore((s) => s.addConfig);
  const [provider, setProvider] = useState<AIConfig['provider']>('deepseek');
  const [apiKey, setApiKey] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [model, setModel] = useState('');
  const [saved, setSaved] = useState(false);

  const selectedProvider = PROVIDERS.find((p) => p.key === provider);

  const handleSave = () => {
    if (!apiKey.trim()) return;
    addConfig({
      id: `cfg-${Date.now()}`,
      name: selectedProvider?.label || provider,
      provider,
      apiKey: apiKey.trim(),
      baseUrl: baseUrl.trim() || undefined,
      model: model.trim() || 'gpt-4o-mini',
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleProviderChange = (p: AIConfig['provider']) => {
    setProvider(p);
    const prov = PROVIDERS.find((pr) => pr.key === p);
    if (prov && !baseUrl) {
      setBaseUrl(prov.defaultUrl);
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
            transition={{ duration: 0.2 }}
            className="fixed inset-x-4 top-[10%] max-w-lg mx-auto bg-surface rounded-xl shadow-xl border border-border p-5 z-50 max-h-[80vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-base font-medium">AI 配置</h2>
                <p className="text-xs text-text-tertiary mt-0.5">配置你的 AI 服务提供商</p>
              </div>
              <button onClick={onClose} className="p-1.5 hover:bg-bg-secondary rounded-lg transition-colors">
                <X className="w-4 h-4 text-text-tertiary" />
              </button>
            </div>

            {/* Provider Selection */}
            <div className="mb-4">
              <label className="text-xs text-text-secondary mb-2 block">服务提供商</label>
              <div className="grid grid-cols-2 gap-2">
                {PROVIDERS.map((p) => (
                  <button
                    key={p.key}
                    onClick={() => handleProviderChange(p.key as AIConfig['provider'])}
                    className={`p-2.5 rounded-lg border text-sm font-medium transition-all ${
                      provider === p.key
                        ? 'border-accent bg-accent-light text-accent'
                        : 'border-border bg-bg-secondary text-text-secondary hover:border-border-light'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* API Key */}
            <div className="mb-4">
              <label className="text-xs text-text-secondary mb-1.5 block flex items-center gap-1">
                <Key className="w-3 h-3" />
                API Key *
              </label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={`请输入 ${selectedProvider?.label} API Key`}
                className="w-full px-3 py-2.5 rounded-lg bg-bg-secondary border border-border focus:border-accent outline-none text-sm"
              />
            </div>

            {/* Base URL (for custom) */}
            <div className="mb-4">
              <label className="text-xs text-text-secondary mb-1.5 block flex items-center gap-1">
                <Server className="w-3 h-3" />
                API 地址
              </label>
              <input
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                placeholder={selectedProvider?.defaultUrl || 'https://...'}
                className="w-full px-3 py-2.5 rounded-lg bg-bg-secondary border border-border focus:border-accent outline-none text-sm"
              />
              <p className="text-xs text-text-tertiary mt-1">
                默认: {selectedProvider?.defaultUrl || '必填'}
              </p>
            </div>

            {/* Model */}
            <div className="mb-5">
              <label className="text-xs text-text-secondary mb-1.5 block">模型</label>
              <input
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder={selectedProvider?.models || 'gpt-4o-mini'}
                className="w-full px-3 py-2.5 rounded-lg bg-bg-secondary border border-border focus:border-accent outline-none text-sm"
              />
              <p className="text-xs text-text-tertiary mt-1">
                推荐: {selectedProvider?.models}
              </p>
            </div>

            {/* Save Button */}
            <button
              onClick={handleSave}
              disabled={!apiKey.trim() || saved}
              className={`w-full py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                saved
                  ? 'bg-success text-white'
                  : 'bg-accent text-white hover:bg-accent-hover disabled:opacity-50'
              }`}
            >
              {saved ? (
                <>
                  <Check className="w-4 h-4" />
                  已保存
                </>
              ) : (
                '保存配置'
              )}
            </button>

            <p className="text-xs text-text-tertiary text-center mt-3">
              API Key 仅保存在本地浏览器中，不会上传到任何服务器
            </p>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
