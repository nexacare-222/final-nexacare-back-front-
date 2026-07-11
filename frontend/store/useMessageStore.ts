import { create } from 'zustand';
import { ChatMessage } from '../types';
import { useAuthStore } from './useAuthStore';
import { apiGet, apiPost, ApiError } from '../services/apiClient';

interface MessageState {
  messages: Record<string, ChatMessage[]>;
  isInitialized: boolean;
  init: () => Promise<void>;
  sendMessage: (patientId: string, text: string, isAttachment?: boolean, channel?: 'FAMILY' | 'TEAM') => void;
}

export const useMessageStore = create<MessageState>((set, get) => ({
  messages: {},
  isInitialized: false,

  init: async () => {
    try {
      const { messages } = await apiGet<{ messages: Record<string, ChatMessage[]> }>('/api/messages');
      set({ messages, isInitialized: true });
    } catch (err) {
      console.error('Failed to load messages:', err instanceof ApiError ? err.message : err);
      set({ isInitialized: true });
    }
  },

  sendMessage: (patientId, text, isAttachment = false, channel = 'TEAM') => {
    const currentUser = useAuthStore.getState().user;
    if (!currentUser) return;

    const tempId = `msg-${Date.now()}`;
    const newMessage: ChatMessage = {
      id: tempId,
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderRole: currentUser.role,
      content: text,
      timestamp: Date.now(),
      isAttachment,
      channel
    };

    set((state) => ({
      messages: {
        ...state.messages,
        [patientId]: [...(state.messages[patientId] || []), newMessage]
      }
    }));

    apiPost<{ message: ChatMessage }>('/api/messages', { patientId, content: text, isAttachment, channel })
      .then(({ message: serverMessage }) => {
        set((state) => ({
          messages: {
            ...state.messages,
            [patientId]: (state.messages[patientId] || []).map(m => m.id === tempId ? serverMessage : m)
          }
        }));
      })
      .catch((err) => {
        console.error('Failed to send message:', err instanceof ApiError ? err.message : err);
        set((state) => ({
          messages: {
            ...state.messages,
            [patientId]: (state.messages[patientId] || []).filter(m => m.id !== tempId)
          }
        }));
      });
  }
}));
