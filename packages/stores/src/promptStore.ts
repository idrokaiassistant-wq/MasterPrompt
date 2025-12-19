import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'

export interface PromptState {
  // State
  currentPrompt: string
  generatedResponse: string
  isGenerating: boolean
  selectedModel: string
  temperature: number
  maxTokens: number
  language: string
  
  // History
  history: Array<{
    id: string
    prompt: string
    response: string
    model: string
    timestamp: string
  }>
  
  // Templates
  templates: Array<{
    id: string
    title: string
    content: string
    category: string
    isFavorite: boolean
  }>
  
  // Actions
  setCurrentPrompt: (prompt: string) => void
  setGeneratedResponse: (response: string) => void
  setIsGenerating: (isGenerating: boolean) => void
  setSelectedModel: (model: string) => void
  setTemperature: (temperature: number) => void
  setMaxTokens: (maxTokens: number) => void
  setLanguage: (language: string) => void
  
  addToHistory: (item: {
    prompt: string
    response: string
    model: string
  }) => void
  
  clearHistory: () => void
  removeFromHistory: (id: string) => void
  
  addTemplate: (template: {
    title: string
    content: string
    category: string
  }) => void
  
  removeTemplate: (id: string) => void
  toggleFavorite: (id: string) => void
}

export const usePromptStore = create<PromptState>()(
  immer((set) => ({
    // Initial state
    currentPrompt: '',
    generatedResponse: '',
    isGenerating: false,
    selectedModel: 'google/gemini-2.5-flash',
    temperature: 0.7,
    maxTokens: 2000,
    language: 'uz',
    history: [],
    templates: [],
    
    // Actions
    setCurrentPrompt: (prompt) => 
      set((state) => { state.currentPrompt = prompt }),
    
    setGeneratedResponse: (response) => 
      set((state) => { state.generatedResponse = response }),
    
    setIsGenerating: (isGenerating) => 
      set((state) => { state.isGenerating = isGenerating }),
    
    setSelectedModel: (model) => 
      set((state) => { state.selectedModel = model }),
    
    setTemperature: (temperature) => 
      set((state) => { state.temperature = temperature }),
    
    setMaxTokens: (maxTokens) => 
      set((state) => { state.maxTokens = maxTokens }),
    
    setLanguage: (language) => 
      set((state) => { state.language = language }),
    
    addToHistory: (item) => 
      set((state) => {
        state.history.unshift({
          id: Date.now().toString(),
          ...item,
          timestamp: new Date().toISOString()
        })
        // Keep only last 100 items
        if (state.history.length > 100) {
          state.history = state.history.slice(0, 100)
        }
      }),
    
    clearHistory: () => 
      set((state) => { state.history = [] }),
    
    removeFromHistory: (id) => 
      set((state) => {
        state.history = state.history.filter(item => item.id !== id)
      }),
    
    addTemplate: (template) => 
      set((state) => {
        state.templates.push({
          id: Date.now().toString(),
          ...template,
          isFavorite: false
        })
      }),
    
    removeTemplate: (id) => 
      set((state) => {
        state.templates = state.templates.filter(template => template.id !== id)
      }),
    
    toggleFavorite: (id) => 
      set((state) => {
        const template = state.templates.find(t => t.id === id)
        if (template) {
          template.isFavorite = !template.isFavorite
        }
      })
  }))
)