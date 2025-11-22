/**
 * API Client Configuration
 * 配置 Axios 客户端,处理请求和响应拦截
 */

import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import type { ApiResponse, ApiError } from '@/types/api';

/**
 * API 基础 URL
 */
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

/**
 * 创建 Axios 实例
 */
const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 30000, // 30秒超时
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * 请求拦截器
 */
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // 可以在这里添加认证 token 等
    // const token = localStorage.getItem('token');
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }

    // 记录请求日志 (仅开发环境)
    if (process.env.NODE_ENV === 'development') {
      console.log('API Request:', {
        method: config.method?.toUpperCase(),
        url: config.url,
        params: config.params,
        data: config.data,
      });
    }

    return config;
  },
  (error: AxiosError) => {
    console.error('Request Error:', error);
    return Promise.reject(error);
  }
);

/**
 * 响应拦截器
 */
apiClient.interceptors.response.use(
  (response) => {
    // 记录响应日志 (仅开发环境)
    if (process.env.NODE_ENV === 'development') {
      console.log('API Response:', {
        status: response.status,
        url: response.config.url,
        data: response.data,
      });
    }

    return response;
  },
  (error: AxiosError<ApiResponse>) => {
    // 统一错误处理
    const apiError: ApiError = {
      errorCode: 'UNKNOWN_ERROR',
      message: '发生未知错误',
      statusCode: error.response?.status,
    };

    if (error.response) {
      // 服务器返回错误响应
      const { data, status } = error.response;
      apiError.errorCode = data.errorCode || `HTTP_${status}`;
      apiError.message = data.message || error.message;
      apiError.details = data.details;
      apiError.statusCode = status;
    } else if (error.request) {
      // 请求已发送但未收到响应
      apiError.errorCode = 'NETWORK_ERROR';
      apiError.message = '网络连接失败,请检查网络设置';
    } else {
      // 请求配置错误
      apiError.errorCode = 'REQUEST_ERROR';
      apiError.message = error.message;
    }

    console.error('API Error:', apiError);
    return Promise.reject(apiError);
  }
);

/**
 * 通用 GET 请求
 */
export async function get<T>(
  url: string,
  params?: Record<string, unknown>
): Promise<ApiResponse<T>> {
  const response = await apiClient.get<ApiResponse<T>>(url, { params });
  return response.data;
}

/**
 * 通用 POST 请求
 */
export async function post<T>(
  url: string,
  data?: Record<string, unknown>
): Promise<ApiResponse<T>> {
  const response = await apiClient.post<ApiResponse<T>>(url, data);
  return response.data;
}

/**
 * 通用 PUT 请求
 */
export async function put<T>(
  url: string,
  data?: Record<string, unknown>
): Promise<ApiResponse<T>> {
  const response = await apiClient.put<ApiResponse<T>>(url, data);
  return response.data;
}

/**
 * 通用 DELETE 请求
 */
export async function del<T>(
  url: string,
  params?: Record<string, unknown>
): Promise<ApiResponse<T>> {
  const response = await apiClient.delete<ApiResponse<T>>(url, { params });
  return response.data;
}

export default apiClient;
