export interface Novel {
  id: string;
  title: string;
  summary?: string;
  createdAt: number;
  updatedAt: number;
  chapters: Chapter[];
  characters: Character[];
  settings: SettingItem[];
  writingStyles: WritingStyle[];
  promptTemplates: PromptTemplate[];
  defaultStyleId?: string;
  outline?: string;
  aiMode: 'auto' | 'manual';
}

export interface Chapter {
  id: string;
  title: string;
  order: number;
  paragraphs: Paragraph[];
  createdAt: number;
  updatedAt: number;
}

export interface AIProcessRecord {
  id: string;
  paragraphId: string;
  operation: string;
  mode: AIMode;
  configName: string;
  success: boolean;
  timestamp: number;
}

export interface Paragraph {
  id: string;
  userText: string;
  aiText?: string;
  aiStatus: 'idle' | 'processing' | 'completed' | 'error';
  aiOperation?: AIOperation;
  aiMode?: AIMode;
  aiConfigName?: string;
  styleId?: string;
  createdAt: number;
  updatedAt: number;
}

export type AIOperation = 'polish' | 'expand' | 'review' | 'custom';

export interface Character {
  id: string;
  name: string;
  role: 'protagonist' | 'supporting' | 'antagonist' | 'minor';
  avatar?: string;
  description?: string;
  appearance?: string;
  personality?: string;
  background?: string;
  relationships: Relationship[];
}

export interface Relationship {
  targetId: string;
  type: 'friend' | 'enemy' | 'family' | 'love' | 'neutral' | 'custom';
  description?: string;
}

export interface SettingItem {
  id: string;
  category: 'world' | 'faction' | 'item' | 'other';
  name: string;
  content: string;
  createdAt: number;
}

export interface WritingStyle {
  id: string;
  name: string;
  sourceText?: string;
  description: string;
  promptFragment: string;
  createdAt: number;
}

export interface AIConfig {
  provider: 'openai' | 'deepseek' | 'siliconflow' | 'custom';
  apiKey: string;
  baseUrl?: string;
  model: string;
}

export interface AIRequest {
  operation: AIOperation;
  text: string;
  context?: {
    outline?: string;
    settings?: string[];
    previousParagraphs?: string[];
    style?: string;
  };
  customPrompt?: string;
}

export interface AIResponse {
  result: string;
  success: boolean;
  error?: string;
}

export interface AIQueueItem {
  paragraphId: string;
  request: AIRequest;
}

export interface ReviewReport {
  outlineConsistency: ReviewItem[];
  settingConflicts: ReviewItem[];
  foreshadowing: ReviewItem[];
  suggestions: ReviewItem[];
}

export interface ReviewItem {
  id: string;
  type: 'info' | 'warning' | 'error';
  message: string;
  paragraphId?: string;
  suggestion?: string;
}

export type PanelTab = 'chapters' | 'outline' | 'characters' | 'settings';

export type Theme = 'light' | 'dark';

export type AIMode = 'high' | 'medium' | 'fast';

export interface PromptTemplate {
  id: string;
  name: string;
  template: string;
  isDefault?: boolean;
  mode?: AIMode;
}

export type SettingsTab = 'ai' | 'editor' | 'styles' | 'prompts';

export interface AIOperationItem {
  id: string;
  name: string;
  template: string;
  isDefault?: boolean;
  mode?: AIMode;
}
