import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Novel, Chapter, Paragraph, Character, SettingItem, WritingStyle, PromptTemplate } from '../lib/types';

interface NovelState {
  novels: Novel[];
  currentNovelId: string | null;
  currentChapterId: string | null;
  // Actions
  setNovels: (novels: Novel[]) => void;
  addNovel: (novel: Novel) => void;
  updateNovel: (novelId: string, updates: Partial<Novel>) => void;
  deleteNovel: (novelId: string) => void;
  setCurrentNovel: (novelId: string) => void;
  setCurrentChapter: (chapterId: string) => void;
  // Paragraph actions
  addParagraph: (chapterId: string, paragraph: Paragraph) => void;
  updateParagraph: (chapterId: string, paragraphId: string, updates: Partial<Paragraph>) => void;
  deleteParagraph: (chapterId: string, paragraphId: string) => void;
  // Chapter actions
  addChapter: (novelId: string, chapter: Chapter) => void;
  updateChapter: (novelId: string, chapterId: string, updates: Partial<Chapter>) => void;
  deleteChapter: (novelId: string, chapterId: string) => void;
  reorderChapters: (novelId: string, chapterIds: string[]) => void;
  // Character actions
  addCharacter: (novelId: string, character: Character) => void;
  updateCharacter: (novelId: string, characterId: string, updates: Partial<Character>) => void;
  deleteCharacter: (novelId: string, characterId: string) => void;
  // Setting actions
  addSetting: (novelId: string, setting: SettingItem) => void;
  updateSetting: (novelId: string, settingId: string, updates: Partial<SettingItem>) => void;
  deleteSetting: (novelId: string, settingId: string) => void;
  // Writing style actions
  addWritingStyle: (novelId: string, style: WritingStyle) => void;
  updateWritingStyle: (novelId: string, styleId: string, updates: Partial<WritingStyle>) => void;
  deleteWritingStyle: (novelId: string, styleId: string) => void;
  setDefaultStyle: (novelId: string, styleId: string) => void;
  // Prompt template actions
  addPromptTemplate: (novelId: string, template: PromptTemplate) => void;
  updatePromptTemplate: (novelId: string, templateId: string, updates: Partial<PromptTemplate>) => void;
  deletePromptTemplate: (novelId: string, templateId: string) => void;
}

export const useNovelStore = create<NovelState>()(
  persist(
    (set, _get) => ({
      novels: [],
      currentNovelId: null,
      currentChapterId: null,

      setNovels: (novels) => set({ novels }),

      addNovel: (novel) => {
        set((state) => ({
          novels: [...state.novels, novel],
          currentNovelId: state.currentNovelId || novel.id,
        }));
      },

      updateNovel: (novelId, updates) => {
        set((state) => ({
          novels: state.novels.map((n) =>
            n.id === novelId ? { ...n, ...updates, updatedAt: Date.now() } : n
          ),
        }));
      },

      deleteNovel: (novelId) => {
        set((state) => {
          const newNovels = state.novels.filter((n) => n.id !== novelId);
          return {
            novels: newNovels,
            currentNovelId: state.currentNovelId === novelId
              ? newNovels[0]?.id || null
              : state.currentNovelId,
            currentChapterId: state.currentNovelId === novelId ? null : state.currentChapterId,
          };
        });
      },

      setCurrentNovel: (novelId) => set({ currentNovelId: novelId, currentChapterId: null }),

      setCurrentChapter: (chapterId) => set({ currentChapterId: chapterId }),

      addParagraph: (chapterId, paragraph) => {
        set((state) => ({
          novels: state.novels.map((novel) => {
            if (novel.id !== state.currentNovelId) return novel;
            return {
              ...novel,
              chapters: novel.chapters.map((ch) =>
                ch.id === chapterId
                  ? { ...ch, paragraphs: [...ch.paragraphs, paragraph], updatedAt: Date.now() }
                  : ch
              ),
              updatedAt: Date.now(),
            };
          }),
        }));
      },

      updateParagraph: (chapterId, paragraphId, updates) => {
        set((state) => ({
          novels: state.novels.map((novel) => {
            if (novel.id !== state.currentNovelId) return novel;
            return {
              ...novel,
              chapters: novel.chapters.map((ch) =>
                ch.id === chapterId
                  ? {
                      ...ch,
                      paragraphs: ch.paragraphs.map((p) =>
                        p.id === paragraphId ? { ...p, ...updates, updatedAt: Date.now() } : p
                      ),
                      updatedAt: Date.now(),
                    }
                  : ch
              ),
              updatedAt: Date.now(),
            };
          }),
        }));
      },

      deleteParagraph: (chapterId, paragraphId) => {
        set((state) => ({
          novels: state.novels.map((novel) => {
            if (novel.id !== state.currentNovelId) return novel;
            return {
              ...novel,
              chapters: novel.chapters.map((ch) =>
                ch.id === chapterId
                  ? {
                      ...ch,
                      paragraphs: ch.paragraphs.filter((p) => p.id !== paragraphId),
                      updatedAt: Date.now(),
                    }
                  : ch
              ),
              updatedAt: Date.now(),
            };
          }),
        }));
      },

      addChapter: (novelId, chapter) => {
        set((state) => ({
          novels: state.novels.map((n) =>
            n.id === novelId
              ? { ...n, chapters: [...n.chapters, chapter], updatedAt: Date.now() }
              : n
          ),
        }));
      },

      updateChapter: (novelId, chapterId, updates) => {
        set((state) => ({
          novels: state.novels.map((n) =>
            n.id === novelId
              ? {
                  ...n,
                  chapters: n.chapters.map((ch) =>
                    ch.id === chapterId ? { ...ch, ...updates, updatedAt: Date.now() } : ch
                  ),
                  updatedAt: Date.now(),
                }
              : n
          ),
        }));
      },

      deleteChapter: (novelId, chapterId) => {
        set((state) => ({
          novels: state.novels.map((n) =>
            n.id === novelId
              ? {
                  ...n,
                  chapters: n.chapters.filter((ch) => ch.id !== chapterId),
                  updatedAt: Date.now(),
                }
              : n
          ),
          currentChapterId: state.currentChapterId === chapterId ? null : state.currentChapterId,
        }));
      },

      reorderChapters: (novelId, chapterIds) => {
        set((state) => ({
          novels: state.novels.map((n) => {
            if (n.id !== novelId) return n;
            const chapterMap = new Map(n.chapters.map((ch) => [ch.id, ch]));
            return {
              ...n,
              chapters: chapterIds
                .map((id) => chapterMap.get(id))
                .filter(Boolean)
                .map((ch, idx) => ({ ...ch!, order: idx })),
              updatedAt: Date.now(),
            };
          }),
        }));
      },

      addCharacter: (novelId, character) => {
        set((state) => ({
          novels: state.novels.map((n) =>
            n.id === novelId
              ? { ...n, characters: [...n.characters, character], updatedAt: Date.now() }
              : n
          ),
        }));
      },

      updateCharacter: (novelId, characterId, updates) => {
        set((state) => ({
          novels: state.novels.map((n) =>
            n.id === novelId
              ? {
                  ...n,
                  characters: n.characters.map((c) =>
                    c.id === characterId ? { ...c, ...updates } : c
                  ),
                  updatedAt: Date.now(),
                }
              : n
          ),
        }));
      },

      deleteCharacter: (novelId, characterId) => {
        set((state) => ({
          novels: state.novels.map((n) =>
            n.id === novelId
              ? {
                  ...n,
                  characters: n.characters.filter((c) => c.id !== characterId),
                  updatedAt: Date.now(),
                }
              : n
          ),
        }));
      },

      addSetting: (novelId, setting) => {
        set((state) => ({
          novels: state.novels.map((n) =>
            n.id === novelId
              ? { ...n, settings: [...n.settings, setting], updatedAt: Date.now() }
              : n
          ),
        }));
      },

      updateSetting: (novelId, settingId, updates) => {
        set((state) => ({
          novels: state.novels.map((n) =>
            n.id === novelId
              ? {
                  ...n,
                  settings: n.settings.map((s) =>
                    s.id === settingId ? { ...s, ...updates } : s
                  ),
                  updatedAt: Date.now(),
                }
              : n
          ),
        }));
      },

      deleteSetting: (novelId, settingId) => {
        set((state) => ({
          novels: state.novels.map((n) =>
            n.id === novelId
              ? {
                  ...n,
                  settings: n.settings.filter((s) => s.id !== settingId),
                  updatedAt: Date.now(),
                }
              : n
          ),
        }));
      },

      addWritingStyle: (novelId, style) => {
        set((state) => ({
          novels: state.novels.map((n) =>
            n.id === novelId
              ? { ...n, writingStyles: [...n.writingStyles, style], updatedAt: Date.now() }
              : n
          ),
        }));
      },

      updateWritingStyle: (novelId, styleId, updates) => {
        set((state) => ({
          novels: state.novels.map((n) =>
            n.id === novelId
              ? {
                  ...n,
                  writingStyles: n.writingStyles.map((s) =>
                    s.id === styleId ? { ...s, ...updates } : s
                  ),
                  updatedAt: Date.now(),
                }
              : n
          ),
        }));
      },

      deleteWritingStyle: (novelId, styleId) => {
        set((state) => ({
          novels: state.novels.map((n) =>
            n.id === novelId
              ? {
                  ...n,
                  writingStyles: n.writingStyles.filter((s) => s.id !== styleId),
                  defaultStyleId: n.defaultStyleId === styleId ? undefined : n.defaultStyleId,
                  updatedAt: Date.now(),
                }
              : n
          ),
        }));
      },

      setDefaultStyle: (novelId, styleId) => {
        set((state) => ({
          novels: state.novels.map((n) =>
            n.id === novelId ? { ...n, defaultStyleId: styleId, updatedAt: Date.now() } : n
          ),
        }));
      },

      addPromptTemplate: (novelId, template) => {
        set((state) => ({
          novels: state.novels.map((n) =>
            n.id === novelId
              ? { ...n, promptTemplates: [...n.promptTemplates, template], updatedAt: Date.now() }
              : n
          ),
        }));
      },

      updatePromptTemplate: (novelId, templateId, updates) => {
        set((state) => ({
          novels: state.novels.map((n) =>
            n.id === novelId
              ? {
                  ...n,
                  promptTemplates: n.promptTemplates.map((t) =>
                    t.id === templateId ? { ...t, ...updates } : t
                  ),
                  updatedAt: Date.now(),
                }
              : n
          ),
        }));
      },

      deletePromptTemplate: (novelId, templateId) => {
        set((state) => ({
          novels: state.novels.map((n) =>
            n.id === novelId
              ? {
                  ...n,
                  promptTemplates: n.promptTemplates.filter((t) => t.id !== templateId),
                  updatedAt: Date.now(),
                }
              : n
          ),
        }));
      },
    }),
    {
      name: 'banzuo-novels',
      partialize: (state) => ({
        novels: state.novels,
        currentNovelId: state.currentNovelId,
        currentChapterId: state.currentChapterId,
      }),
    }
  )
);
