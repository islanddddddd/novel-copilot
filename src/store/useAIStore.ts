import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AIConfig, AIQueueItem, AIOperation, AIMode, AIProcessRecord } from '../lib/types';

export interface SavedAIConfig extends AIConfig {
  id: string;
  name: string;
}

export interface AIModeSetting {
  mode: AIMode;
  configId: string | null;
  temperature: number;
  maxTokens: number | null;  // null = unlimited
  enableReasoning: boolean;
}

interface AIState {
  configs: SavedAIConfig[];
  currentConfigId: string | null;
  modeSettings: Record<AIMode, AIModeSetting>;
  defaultMode: AIMode;
  queue: AIQueueItem[];
  isProcessing: boolean;
  currentOperation: AIOperation | null;
  errorMessages: string[];
  history: AIProcessRecord[];
  // Actions
  addConfig: (config: SavedAIConfig) => void;
  updateConfig: (id: string, updates: Partial<SavedAIConfig>) => void;
  deleteConfig: (id: string) => void;
  setCurrentConfig: (id: string | null) => void;
  getCurrentConfig: () => SavedAIConfig | null;
  getModeConfig: (mode: AIMode) => SavedAIConfig | null;
  setModeConfigId: (mode: AIMode, configId: string | null) => void;
  setModeParam: (mode: AIMode, key: 'temperature' | 'maxTokens', value: number | null) => void;
  setModeReasoning: (mode: AIMode, enable: boolean) => void;
  setDefaultMode: (mode: AIMode) => void;
  addError: (msg: string) => void;
  clearErrors: () => void;
  addHistory: (record: AIProcessRecord) => void;
  clearHistory: () => void;
  addToQueue: (item: AIQueueItem) => void;
  removeFromQueue: (paragraphId: string) => void;
  setIsProcessing: (processing: boolean) => void;
  setCurrentOperation: (op: AIOperation | null) => void;
  clearQueue: () => void;
}

export const useAIStore = create<AIState>()(
  persist(
    (set, get) => ({
      configs: [],
      currentConfigId: null,
      modeSettings: {
        high: { mode: 'high', configId: null, temperature: 0.3, maxTokens: 4000, enableReasoning: true },
        medium: { mode: 'medium', configId: null, temperature: 0.7, maxTokens: 2000, enableReasoning: false },
        fast: { mode: 'fast', configId: null, temperature: 0.9, maxTokens: 1000, enableReasoning: false },
      },
      defaultMode: 'medium',
      queue: [],
      isProcessing: false,
      currentOperation: null,
      errorMessages: [],
      history: [],

      addConfig: (config) => {
        set((state) => {
          const newConfigs = [...state.configs, config];
          return { configs: newConfigs, currentConfigId: state.currentConfigId || config.id };
        });
      },
      updateConfig: (id, updates) =>
        set((state) => ({
          configs: state.configs.map((c) => (c.id === id ? { ...c, ...updates } : c)),
        })),
      deleteConfig: (id) =>
        set((state) => {
          const newConfigs = state.configs.filter((c) => c.id !== id);
          const nextId = newConfigs[0]?.id || null;
          const newModeSettings = { ...state.modeSettings };
          (Object.keys(newModeSettings) as AIMode[]).forEach((m) => {
            if (newModeSettings[m].configId === id) newModeSettings[m] = { ...newModeSettings[m], configId: nextId };
          });
          return {
            configs: newConfigs,
            currentConfigId: state.currentConfigId === id ? nextId : state.currentConfigId,
            modeSettings: newModeSettings,
          };
        }),
      setCurrentConfig: (id) => set({ currentConfigId: id }),
      getCurrentConfig: () => {
        const state = get();
        return state.configs.find((c) => c.id === state.currentConfigId) || null;
      },
      getModeConfig: (mode) => {
        const state = get();
        const ms = state.modeSettings[mode];
        if (ms?.configId) return state.configs.find((c) => c.id === ms.configId) || null;
        return state.configs.find((c) => c.id === state.currentConfigId) || null;
      },
      setModeConfigId: (mode, configId) =>
        set((state) => ({
          modeSettings: { ...state.modeSettings, [mode]: { ...state.modeSettings[mode], configId } },
        })),
      setModeParam: (mode, key, value) =>
        set((state) => ({
          modeSettings: { ...state.modeSettings, [mode]: { ...state.modeSettings[mode], [key]: value } },
        })),
      setModeReasoning: (mode, enable) =>
        set((state) => ({
          modeSettings: { ...state.modeSettings, [mode]: { ...state.modeSettings[mode], enableReasoning: enable } },
        })),
      setDefaultMode: (mode) => set({ defaultMode: mode }),
      addError: (msg) =>
        set((state) => ({ errorMessages: [...state.errorMessages.slice(-4), msg] })),
      clearErrors: () => set({ errorMessages: [] }),
      addHistory: (record) =>
        set((state) => ({ history: [...state.history.slice(-9), record] })),
      clearHistory: () => set({ history: [] }),
      addToQueue: (item) => set((state) => ({ queue: [...state.queue, item] })),
      removeFromQueue: (paragraphId) =>
        set((state) => ({ queue: state.queue.filter((q) => q.paragraphId !== paragraphId) })),
      setIsProcessing: (processing) => set({ isProcessing: processing }),
      setCurrentOperation: (op) => set({ currentOperation: op }),
      clearQueue: () => set({ queue: [] }),
    }),
    {
      name: 'banzuo-ai',
      partialize: (state) => ({
        configs: state.configs,
        currentConfigId: state.currentConfigId,
        modeSettings: state.modeSettings,
        defaultMode: state.defaultMode,
      }),
    }
  )
);
