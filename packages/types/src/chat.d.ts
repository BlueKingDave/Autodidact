export type ChatRole = 'user' | 'assistant' | 'system';
export interface ChatMessage {
    id: string;
    role: ChatRole;
    content: string;
    createdAt: string;
}
export interface StreamChunk {
    type: 'token' | 'complete' | 'error' | 'module_complete';
    content?: string;
    score?: number;
    feedback?: string;
    error?: string;
}
export interface ChatSession {
    id: string;
    userId: string;
    moduleId: string;
    messages: ChatMessage[];
    threadId: string | null;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}
//# sourceMappingURL=chat.d.ts.map