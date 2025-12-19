import { Sparkles, Zap, Brain, Crown, Rocket, Star, Flame } from 'lucide-react';
import type { Model } from '@/store/promptStore';

export type ModelDescriptionKey =
  | 'gemini25Flash'
  | 'gemini25FlashLite'
  | 'gemini20Flash'
  | 'gemini25Pro'
  | 'gemini3ProPreview'
  | 'grokBeta'
  | 'claude35Sonnet'
  | 'gpt4o';

export type ModelConfig = {
  value: Model;
  label: string;
  badge?: string;
  badgeColor: string;
  icon: any;
  descriptionKey: ModelDescriptionKey;
  isFree?: boolean;
};

export const MODELS: ModelConfig[] = [
  {
    value: 'anthropic/claude-3.5-sonnet',
    label: 'Claude 3.5 Sonnet',
    badge: 'PRO',
    badgeColor: 'bg-gradient-to-r from-amber-500 to-orange-500',
    icon: Brain,
    descriptionKey: 'claude35Sonnet',
    isFree: false,
  },
  {
    value: 'google/gemini-2.0-flash',
    label: 'Gemini 2.0 Flash',
    badge: 'PRO',
    badgeColor: 'bg-gradient-to-r from-blue-500 to-cyan-500',
    icon: Brain,
    descriptionKey: 'gemini20Flash',
    isFree: false,
  },
  {
    value: 'google/gemini-2.5-flash',
    label: 'Gemini 2.5 Flash',
    badge: 'FREE',
    badgeColor: 'bg-gradient-to-r from-green-500 to-emerald-500',
    icon: Sparkles,
    descriptionKey: 'gemini25Flash',
    isFree: true,
  },
  {
    value: 'google/gemini-2.5-flash-lite',
    label: 'Gemini 2.5 Flash Lite',
    badge: 'FREE',
    badgeColor: 'bg-gradient-to-r from-green-500 to-emerald-500',
    icon: Zap,
    descriptionKey: 'gemini25FlashLite',
    isFree: true,
  },
  {
    value: 'google/gemini-2.5-pro',
    label: 'Gemini 2.5 Pro',
    badge: 'PRO',
    badgeColor: 'bg-gradient-to-r from-purple-500 to-pink-500',
    icon: Crown,
    descriptionKey: 'gemini25Pro',
    isFree: false,
  },
  {
    value: 'google/gemini-3-pro-preview',
    label: 'Gemini 3 Pro Preview',
    badge: 'PREVIEW',
    badgeColor: 'bg-gradient-to-r from-orange-500 to-red-500',
    icon: Rocket,
    descriptionKey: 'gemini3ProPreview',
    isFree: false,
  },
  {
    value: 'openai/gpt-4o',
    label: 'GPT-4o',
    badge: 'PRO',
    badgeColor: 'bg-gradient-to-r from-teal-500 to-cyan-500',
    icon: Flame,
    descriptionKey: 'gpt4o',
    isFree: false,
  },
  {
    value: 'x-ai/grok-beta',
    label: 'Grok Beta',
    badge: 'BETA',
    badgeColor: 'bg-gradient-to-r from-gray-500 to-gray-600',
    icon: Star,
    descriptionKey: 'grokBeta',
    isFree: false,
  },
];

export function getModelConfig(model: Model | string) {
  return MODELS.find((m) => m.value === model);
}

