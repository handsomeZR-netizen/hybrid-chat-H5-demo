// Message types based on the design document
export type MessageType = 'TEXT' | 'IMAGE' | 'VIDEO' | 'AUDIO' | 'SYSTEM' | 'LOGIN' | 'GET_HISTORY' | 'HISTORY_RESPONSE';

export type MessageStatus = 'sending' | 'sent' | 'failed';

export interface Message {
  id: string;
  type: MessageType;
  senderId: string;
  senderName?: string;
  content: string;
  timestamp: number;
  avatarColor?: string;
  status?: MessageStatus; // For tracking message sending status
}

export interface LoginMessage {
  type: 'LOGIN';
  userId: string;
}

export interface TextMessage extends Message {
  type: 'TEXT';
}

export interface SystemMessage extends Message {
  type: 'SYSTEM';
}

export interface GetHistoryMessage {
  type: 'GET_HISTORY';
  lastMessageId: string;
  limit: number;
}

export interface HistoryResponseMessage {
  type: 'HISTORY_RESPONSE';
  messages: Message[];
  hasMore: boolean;
}

export type WebSocketMessage = LoginMessage | Message | GetHistoryMessage | HistoryResponseMessage;

export type ViewType = 'login' | 'chat';

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected';
