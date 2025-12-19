import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Model =
  | 'google/gemini-2.5-flash'
  | 'google/gemini-2.5-flash-lite'
  | 'google/gemini-2.0-flash'
  | 'google/gemini-2.5-pro'
  | 'google/gemini-3-pro-preview'
  | 'x-ai/grok-beta'
  | 'anthropic/claude-3.5-sonnet'
  | 'openai/gpt-4o';

export type Language = 'uz' | 'en' | 'ru' | 'tr';

interface PromptState {
  input: string;
  output: string;
  language: Language;
  model: Model;
  temperature: number;
  maxTokens: number;
  isLoading: boolean;
  history: Array<{
    id: string;
    input: string;
    output: string;
    model: Model;
    language: Language;
    createdAt: string;
  }>;
  templates: Array<{
    id: string;
    title: string;
    prompt: string;
  }>;
  setInput: (input: string) => void;
  clearInput: () => void;
  setOutput: (output: string) => void;
  setLanguage: (language: Language) => void;
  setModel: (model: Model) => void;
  setTemperature: (temperature: number) => void;
  setMaxTokens: (maxTokens: number) => void;
  setIsLoading: (isLoading: boolean) => void;
  addToHistory: (item: Omit<PromptState['history'][0], 'id' | 'createdAt'>) => void;
  clearHistory: () => void;
  deleteHistoryItem: (id: string) => void;
  addTemplate: (template: Omit<PromptState['templates'][0], 'id'>) => void;
  updateTemplate: (id: string, template: Omit<PromptState['templates'][0], 'id'>) => void;
  deleteTemplate: (id: string) => void;
}

export const usePromptStore = create<PromptState>()(
  persist(
    (set) => ({
      input: '',
      output: '',
      language: 'uz',
      model: 'google/gemini-2.5-flash', // Using 2.5-flash as default (free tier, best price-performance)
      temperature: 0.7,
      maxTokens: 2000,
      isLoading: false,
      history: [],
      templates: [],
      setInput: (input) => set({ input }),
      clearInput: () => set({ input: '' }),
      setOutput: (output) => set({ output }),
      setLanguage: (language) => set({ language }),
      setModel: (model) => set({ model }),
      setTemperature: (temperature) => set({ temperature }),
      setMaxTokens: (maxTokens) => set({ maxTokens }),
      setIsLoading: (isLoading) => set({ isLoading }),
      addToHistory: (item) =>
        set((state) => ({
          history: [
            {
              ...item,
              id: Date.now().toString(),
              createdAt: new Date().toISOString(),
            },
            ...state.history,
          ],
        })),
      clearHistory: () => set({ history: [] }),
      deleteHistoryItem: (id) =>
        set((state) => ({
          history: state.history.filter((item) => item.id !== id),
        })),
      addTemplate: (template) =>
        set((state) => ({
          templates: [
            { ...template, id: Date.now().toString() },
            ...state.templates,
          ],
        })),
      updateTemplate: (id, template) =>
        set((state) => ({
          templates: state.templates.map((t) =>
            t.id === id ? { ...template, id } : t
          ),
        })),
      deleteTemplate: (id) =>
        set((state) => ({
          templates: state.templates.filter((t) => t.id !== id),
        })),
    }),
    {
      name: 'prompt-store',
    }
  )
);


