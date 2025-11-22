/**
 * API Response Type Definitions
 * 定义与后端 API 交互的通用类型
 */

/**
 * 通用 API 响应接口
 */
export interface ApiResponse<T = unknown> {
  ok: boolean;
  data?: T;
  errorCode?: string;
  message?: string;
  details?: Record<string, unknown>;
}

/**
 * API 错误信息
 */
export interface ApiError {
  errorCode: string;
  message: string;
  details?: Record<string, unknown>;
  statusCode?: number;
}

/**
 * 分页参数
 */
export interface PaginationParams {
  page: number;
  pageSize: number;
}

/**
 * 分页响应
 */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * API 请求状态
 */
export type ApiStatus = 'idle' | 'loading' | 'success' | 'error';

/**
 * API 请求配置
 */
export interface ApiConfig {
  baseURL: string;
  timeout?: number;
  headers?: Record<string, string>;
}

/**
 * Tutorial API 请求参数
 */
export interface TutorialRequestParams {
  repoUrl: string;
  language?: 'zh-CN' | 'en-US';
}

/**
 * 健康检查响应
 */
export interface HealthCheckResponse {
  status: string;
  version: string;
  timestamp: string;
}
