import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type {
  APIProfile,
  AppState,
  ChatMessage,
  ChatSessionState,
  LastRunState,
  PracticeState,
} from './types'

const LS_KEY = 'codeforge-ai:state'

/** Only these fields are written to localStorage. */
export type PersistedState = {
  profiles: APIProfile[]
  activeProfileId: string | null
  practice: PracticeState
  chat: ChatSessionState
  lastRun: LastRunState
}

/** Hard cap on stored chat messages so localStorage cannot grow without bound. */
const MAX_CHAT_MESSAGES = 24

/**
 * Merge persisted state back into the current store state. Older localStorage
 * shapes (missing `practice`, profiles without an `active` flag, or a null
  * active id pointing at a deleted profile) are normalised here so the app
  * never crashes on a stale record.
 */
export function mergePersisted(
  persisted: PersistedState,
  current: AppState,
): Partial<AppState> {
  const profiles = Array.isArray(persisted.profiles)
    ? persisted.profiles
        .filter((p): p is APIProfile => p && typeof p === 'object')
        .map((p) => ({
          id: typeof p.id === 'string' ? p.id : '',
          name: typeof p.name === 'string' ? p.name : 'Profile',
          provider: typeof p.provider === 'string' ? p.provider : 'custom',
          baseUrl: typeof p.baseUrl === 'string' ? p.baseUrl : '',
          apiKey: typeof p.apiKey === 'string' ? p.apiKey : '',
          model: typeof p.model === 'string' ? p.model : '',
          active: typeof p.active === 'boolean' ? p.active : false,
        }))
    : []
  const validIds = new Set(profiles.map((p) => p.id))
  const activeProfileId =
    persisted.activeProfileId && validIds.has(persisted.activeProfileId)
      ? persisted.activeProfileId
      : profiles.find((p) => p.active)?.id ?? profiles[0]?.id ?? null
  // Ensure the active profile is marked active=true after merge.
  if (activeProfileId) {
    profiles.forEach((p) => {
      p.active = p.id === activeProfileId
    })
  }
  const chat = mergeChat(persisted.chat, current.chat)
  return {
    profiles,
    activeProfileId,
    practice: persisted.practice ?? current.practice,
    chat,
    lastRun: persisted.lastRun ?? current.lastRun,
  }
}

/** Normalise a persisted chat session, trimming it to the size cap. */
function mergeChat(
  persisted: ChatSessionState | undefined,
  current: ChatSessionState,
): ChatSessionState {
  if (!persisted || typeof persisted !== 'object') return current
  const messages: ChatMessage[] = Array.isArray(persisted.messages)
    ? persisted.messages
        .filter(
          (m): m is ChatMessage =>
            m !== null &&
            typeof m === 'object' &&
            typeof m.id === 'string' &&
            (m.role === 'user' || m.role === 'assistant') &&
            typeof m.content === 'string',
        )
        .slice(-MAX_CHAT_MESSAGES)
        .map((m) => ({
          id: m.id,
          role: m.role,
          content: m.content,
        }))
    : []
  return {
    messages,
    includeContext:
      typeof persisted.includeContext === 'boolean' ? persisted.includeContext : true,
    lastRequestTokens:
      typeof persisted.lastRequestTokens === 'number' ? persisted.lastRequestTokens : null,
    sessionTokens:
      typeof persisted.sessionTokens === 'number' ? persisted.sessionTokens : 0,
  }
}

const defaultPractice: PracticeState = {
  lastLanguage: 'python',
  paneSizes: { left: 42, right: 58 },
  editorHeight: { editor: 55, output: 45 },
  codeByQuestion: {},
}

const defaultChat: ChatSessionState = {
  messages: [],
  includeContext: true,
  lastRequestTokens: null,
  sessionTokens: 0,
}

const initialState: Omit<
  AppState,
  | 'setProfiles'
  | 'upsertProfile'
  | 'deleteProfile'
  | 'setActiveProfile'
  | 'setBurgerMenuOpen'
  | 'setApiKeyModalOpen'
  | 'setLanguage'
  | 'setPaneSizes'
  | 'setEditorHeight'
  | 'setCode'
  | 'setChatMessages'
  | 'appendChatMessage'
  | 'clearChat'
  | 'setIncludeContext'
  | 'setChatTokenEstimate'
  | 'setLastRun'
> = {
  profiles: [],
  activeProfileId: null,
  ui: {
    burgerMenuOpen: false,
    apiKeyModalOpen: false,
  },
  practice: defaultPractice,
  chat: defaultChat,
  lastRun: { result: null },
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      ...initialState,

      setProfiles: (profiles) => set({ profiles }),
      upsertProfile: (profile) =>
        set((state) => {
          const next = state.profiles
            .filter((p) => p.id !== profile.id)
            .concat(profile)
          // The first saved profile becomes active automatically so the Ask
          // tab is usable as soon as a key exists.
          const activeId = profile.active
            ? profile.id
            : state.activeProfileId ?? next[0]?.id ?? null
          return {
            profiles: next.map((p) => ({ ...p, active: p.id === activeId })),
            activeProfileId: activeId,
          }
        }),
      deleteProfile: (id) =>
        set((state) => {
          const next = state.profiles.filter((p) => p.id !== id)
          return {
            profiles: next,
            activeProfileId:
              state.activeProfileId === id
                ? (next.find((p) => p.active)?.id ?? null)
                : state.activeProfileId,
          }
        }),
      setActiveProfile: (id) =>
        set((state) => ({
          profiles: state.profiles.map((p) => ({ ...p, active: p.id === id })),
          activeProfileId: id,
        })),
      setBurgerMenuOpen: (open) =>
        set((state) => ({ ui: { ...state.ui, burgerMenuOpen: open } })),
      setApiKeyModalOpen: (open) =>
        set((state) => ({ ui: { ...state.ui, apiKeyModalOpen: open } })),

      setLanguage: (language) =>
        set((state) => ({
          practice: { ...state.practice, lastLanguage: language },
        })),
      setPaneSizes: (sizes) =>
        set((state) => ({
          practice: { ...state.practice, paneSizes: sizes },
        })),
      setEditorHeight: (height) =>
        set((state) => ({
          practice: { ...state.practice, editorHeight: height },
        })),
      setCode: (questionId, language, code) =>
        set((state) => {
          const byLang = state.practice.codeByQuestion[questionId] ?? {}
          return {
            practice: {
              ...state.practice,
              codeByQuestion: {
                ...state.practice.codeByQuestion,
                [questionId]: { ...byLang, [language]: code },
              },
            },
          }
        }),

      // --- Ask tab conversation ---

      setChatMessages: (messages) =>
        set((state) => ({
          chat: { ...state.chat, messages: messages.slice(-MAX_CHAT_MESSAGES) },
        })),
      appendChatMessage: (message) =>
        set((state) => {
          const next = [...state.chat.messages, message].slice(-MAX_CHAT_MESSAGES)
          return { chat: { ...state.chat, messages: next } }
        }),
      clearChat: () =>
        set((state) => ({
          chat: { ...state.chat, messages: [], lastRequestTokens: null, sessionTokens: 0 },
        })),
      setIncludeContext: (include) =>
        set((state) => ({ chat: { ...state.chat, includeContext: include } })),
      setChatTokenEstimate: (lastRequestTokens) =>
        set((state) => {
          const sessionTokens =
            lastRequestTokens !== null ? state.chat.sessionTokens + lastRequestTokens : 0
          return { chat: { ...state.chat, lastRequestTokens, sessionTokens } }
        }),
      setLastRun: (result) => set({ lastRun: { result } }),
    }),
    {
      name: LS_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: (state): PersistedState => ({
        profiles: state.profiles,
        activeProfileId: state.activeProfileId,
        practice: state.practice,
        chat: state.chat,
        lastRun: state.lastRun,
      }),
      merge: (persisted, current) => ({
        ...(current as AppState),
        ...mergePersisted(persisted as PersistedState, current as AppState),
      }),
    },
  ),
)