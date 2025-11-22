/**
 * Q&A API Service
 * 处理与后端 Q&A 接口的通信
 */

import axios, { AxiosInstance } from 'axios';
import type {
  AskQuestionRequest,
  QAResponse,
  ConversationHistory,
  SessionStats,
  APIResponse,
} from '@/types/qa';

class QAApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
      timeout: 60000, // Q&A 可能需要较长时间
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // 响应拦截器 - 统一处理错误
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('Q&A API Error:', error);
        throw error;
      }
    );
  }

  /**
   * 提问
   */
  async askQuestion(request: AskQuestionRequest): Promise<QAResponse> {
    try {
      const response = await this.client.post<APIResponse<QAResponse>>(
        '/api/qa/ask',
        request
      );

      if (response.data.ok && response.data.data) {
        return response.data.data;
      }

      throw new Error(response.data.error || 'Failed to get answer');
    } catch (error: any) {
      if (error.response?.data?.detail) {
        throw new Error(error.response.data.detail);
      }
      throw error;
    }
  }

  /**
   * 获取会话历史
   */
  async getConversationHistory(
    sessionId: string
  ): Promise<ConversationHistory> {
    try {
      const response = await this.client.get<
        APIResponse<ConversationHistory>
      >(`/api/qa/history/${sessionId}`);

      if (response.data.ok && response.data.data) {
        return response.data.data;
      }

      throw new Error(response.data.error || 'Failed to get conversation history');
    } catch (error: any) {
      if (error.response?.data?.detail) {
        throw new Error(error.response.data.detail);
      }
      throw error;
    }
  }

  /**
   * 删除会话
   */
  async deleteSession(sessionId: string): Promise<void> {
    try {
      await this.client.delete(`/api/qa/session/${sessionId}`);
    } catch (error: any) {
      if (error.response?.data?.detail) {
        throw new Error(error.response.data.detail);
      }
      throw error;
    }
  }

  /**
   * 获取会话统计
   */
  async getSessionStats(): Promise<SessionStats> {
    try {
      const response = await this.client.get<APIResponse<SessionStats>>(
        '/api/qa/sessions/stats'
      );

      if (response.data.ok && response.data.data) {
        return response.data.data;
      }

      throw new Error(response.data.error || 'Failed to get session stats');
    } catch (error: any) {
      if (error.response?.data?.detail) {
        throw new Error(error.response.data.detail);
      }
      throw error;
    }
  }
}

// 导出单例
export const qaApi = new QAApiService();
