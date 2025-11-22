/**
 * Q&A Type Definitions
 * 与后端 API 保持一致
 */

/**
 * 代码引用
 */
export interface CodeReference {
  filePath: string;
  startLine: number;
  endLine: number;
  snippet: string;
  language: string;
}

/**
 * 问题上下文
 */
export interface QuestionContext {
  currentModuleId?: string;
  currentStepId?: string;
}

/**
 * 提问请求
 */
export interface AskQuestionRequest {
  repoUrl: string;
  question: string;
  sessionId?: string;
  context?: QuestionContext;
}

/**
 * 问答响应
 */
export interface QAResponse {
  answer: string;
  references: CodeReference[];
  relatedSteps: string[];
  sessionId: string;
}

/**
 * 聊天消息
 */
export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
}

/**
 * 会话历史
 */
export interface ConversationHistory {
  sessionId: string;
  messages: ChatMessage[];
  repo: string;
  createdAt: string;
  lastActivity: string;
}

/**
 * API 响应包装
 */
export interface APIResponse<T> {
  ok: boolean;
  data?: T;
  error?: string;
}

/**
 * 会话统计
 */
export interface SessionStats {
  active_sessions: number;
}
