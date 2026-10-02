import type { ProviderPreset } from './types'

export interface ProviderPresetDef {
  id: ProviderPreset
  label: string
  baseUrl: string
  defaultModel: string
  hint: string
}

export const PROVIDER_PRESETS: ProviderPresetDef[] = [
  {
    id: 'groq',
    label: 'Groq',
    baseUrl: 'https://api.groq.com/openai/v1',
    defaultModel: 'llama-3.3-70b-versatile',
    hint: 'Free tier at groq.com. Create an API key in the Groq console.',
  },
  {
    id: 'openrouter',
    label: 'OpenRouter',
    baseUrl: 'https://openrouter.ai/api/v1',
    defaultModel: 'meta-llama/llama-3.3-70b-instruct:free',
    hint: 'Free models at openrouter.ai. Generate a key in your account.',
  },
  {
    id: 'gemini',
    label: 'Google Gemini',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai',
    defaultModel: 'gemini-2.5-flash',
    hint: 'Gemini via its OpenAI-compatible endpoint. Key from Google AI Studio.',
  },
  {
    id: 'cerebras',
    label: 'Cerebras',
    baseUrl: 'https://api.cerebras.ai/v1',
    defaultModel: 'llama3.1-8b',
    hint: 'Free tier at cerebras.ai. Key from the Cerebras dashboard.',
  },
  {
    id: 'mistral',
    label: 'Mistral',
    baseUrl: 'https://api.mistral.ai/v1',
    defaultModel: 'mistral-small-latest',
    hint: 'Free credits at mistral.ai. Key from the Mistral console.',
  },
  {
    id: 'custom',
    label: 'Custom (OpenAI-compatible)',
    baseUrl: '',
    defaultModel: '',
    hint: 'Any OpenAI-compatible Chat Completions endpoint.',
  },
]

export function getPreset(id: ProviderPreset): ProviderPresetDef {
  return PROVIDER_PRESETS.find((p) => p.id === id) ?? PROVIDER_PRESETS[PROVIDER_PRESETS.length - 1]
}