/**
 * API 工具函数
 */

/**
 * 验证是否为有效的 GitHub 仓库 URL
 * @param url - 待验证的 URL
 * @returns 是否为有效的 GitHub 仓库 URL
 */
export function isValidGitHubUrl(url: string): boolean {
  if (!url) return false;

  // 支持的 GitHub URL 格式:
  // https://github.com/username/repo
  // https://github.com/username/repo.git
  // http://github.com/username/repo
  // github.com/username/repo
  const githubUrlPattern = /^(https?:\/\/)?(www\.)?github\.com\/[\w.-]+\/[\w.-]+(\.git)?$/i;

  return githubUrlPattern.test(url.trim());
}

/**
 * 从 GitHub URL 中提取用户名和仓库名
 * @param url - GitHub 仓库 URL
 * @returns 包含 owner 和 repo 的对象，如果解析失败返回 null
 */
export function parseGitHubUrl(url: string): { owner: string; repo: string } | null {
  if (!isValidGitHubUrl(url)) return null;

  // 移除协议和 www 前缀
  const cleanUrl = url.trim()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/^github\.com\//, '')
    .replace(/\.git$/, '');

  const parts = cleanUrl.split('/');
  if (parts.length >= 2) {
    return {
      owner: parts[0],
      repo: parts[1]
    };
  }

  return null;
}

/**
 * API 基础 URL
 */
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

/**
 * 发起 API 请求的通用函数
 * @param endpoint - API 端点
 * @param options - fetch 选项
 * @returns Promise 响应数据
 */
export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  const defaultOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };

  const response = await fetch(url, { ...defaultOptions, ...options });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}

// 导入类型
import type { TutorialData } from '@/types/tutorial';
import type { ApiResponse, TutorialRequestParams } from '@/types/api';

/**
 * 获取教程数据
 * @param params - 请求参数
 * @returns Promise 教程数据响应
 */
export async function getTutorial(
  params: TutorialRequestParams
): Promise<ApiResponse<TutorialData>> {
  const { repoUrl, language = 'zh-CN' } = params;

  try {
    // 构建 URL query parameters
    const queryParams = new URLSearchParams({
      repoUrl: repoUrl,
      language: language,
    });

    const response = await fetch(`${API_BASE_URL}/api/tutorial?${queryParams}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        ok: false,
        errorCode: data.errorCode || `HTTP_${response.status}`,
        message: data.message || '获取教程失败',
        details: data.details,
      };
    }

    return {
      ok: true,
      data: data.data || data,
    };
  } catch (error) {
    return {
      ok: false,
      errorCode: 'NETWORK_ERROR',
      message: error instanceof Error ? error.message : '网络连接失败',
    };
  }
}
