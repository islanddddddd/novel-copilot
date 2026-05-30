import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PanelTab, Theme, SettingsTab } from '../lib/types';

type ThemeMode = 'light' | 'dark' | 'system';

interface UIState {
  activePanel: PanelTab;
  panelCollapsed: boolean;
  outlinePinned: boolean;
  theme: Theme;
  themeMode: ThemeMode;
  showSettings: boolean;
  settingsTab: SettingsTab;
  hoveredParagraphId: string | null;
  syncHeight: boolean;
  // Actions
  setActivePanel: (panel: PanelTab) => void;
  togglePanel: () => void;
  toggleOutlinePinned: () => void;
  toggleTheme: () => void;
  setThemeMode: (mode: ThemeMode) => void;
  setShowSettings: (show: boolean) => void;
  setSettingsTab: (tab: SettingsTab) => void;
  openSettings: (tab: SettingsTab) => void;
  setHoveredParagraphId: (id: string | null) => void;
  setSyncHeight: (v: boolean) => void;
}

function getSystemTheme(): Theme {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function resolveTheme(mode: ThemeMode): Theme {
  if (mode === 'system') return getSystemTheme();
  return mode;
}

export const useUIStore = create<UIState>()(
  persist(
    (set, _get) => ({
      activePanel: 'chapters',
      panelCollapsed: false,
      outlinePinned: false,
      theme: 'light',
      themeMode: 'light',
      showSettings: false,
      settingsTab: 'ai',
      hoveredParagraphId: null,
      syncHeight: true,

      setActivePanel: (panel) => set({ activePanel: panel }),
      togglePanel: () => set((state) => ({ panelCollapsed: !state.panelCollapsed })),
      toggleOutlinePinned: () => set((state) => ({ outlinePinned: !state.outlinePinned })),
      toggleTheme: () => set((state) => {
        const newTheme = state.theme === 'light' ? 'dark' : 'light';
        return { theme: newTheme, themeMode: newTheme };
      }),
      setThemeMode: (mode) => {
        const resolved = resolveTheme(mode);
        set({ themeMode: mode, theme: resolved });
        if (mode === 'system') {
          const handler = (e: MediaQueryListEvent) => {
            set({ theme: e.matches ? 'dark' : 'light' });
          };
          window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', handler);
        }
      },
      setShowSettings: (show) => set({ showSettings: show }),
      setSettingsTab: (tab) => set({ settingsTab: tab }),
      openSettings: (tab) => set({ showSettings: true, settingsTab: tab }),
      setHoveredParagraphId: (id) => set({ hoveredParagraphId: id }),
      setSyncHeight: (v) => set({ syncHeight: v }),
    }),
    {
      name: 'banzuo-ui',
      partialize: (state) => ({
        panelCollapsed: state.panelCollapsed,
        outlinePinned: state.outlinePinned,
        theme: state.theme,
        themeMode: state.themeMode,
        syncHeight: state.syncHeight,
      }),
    }
  )
);
