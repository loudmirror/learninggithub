/**
 * Tutorial API Functions
 * 教程相关的 API 请求函数
 */

import { get } from './client';
import type { ApiResponse, TutorialRequestParams, HealthCheckResponse } from '@/types/api';
import type { TutorialData } from '@/types/tutorial';

/**
 * 获取教程数据
 * @param params 请求参数
 * @returns 教程数据
 */
export async function getTutorial(
  params: TutorialRequestParams
): Promise<ApiResponse<TutorialData>> {
  try {
    const response = await get<TutorialData>('/api/tutorial', {
      repoUrl: params.repoUrl,
      language: params.language || 'zh-CN',
    });

    if (!response.ok || !response.data) {
      throw new Error(response.message || '获取教程失败');
    }

    return response;
  } catch (error) {
    console.error('getTutorial error:', error);
    throw error;
  }
}

/**
 * 健康检查
 * @returns 健康状态
 */
export async function healthCheck(): Promise<ApiResponse<HealthCheckResponse>> {
  try {
    const response = await get<HealthCheckResponse>('/api/health');
    return response;
  } catch (error) {
    console.error('healthCheck error:', error);
    throw error;
  }
}

/**
 * 验证 GitHub 仓库 URL
 * @param url 仓库 URL
 * @returns 是否有效
 */
export function isValidGitHubUrl(url: string): boolean {
  const githubUrlPattern = /^https?:\/\/(www\.)?github\.com\/[\w-]+\/[\w.-]+\/?$/i;
  return githubUrlPattern.test(url.trim());
}

/**
 * 从 GitHub URL 提取仓库信息
 * @param url GitHub URL
 * @returns 仓库所有者和名称
 */
export function parseGitHubUrl(url: string): { owner: string; repo: string } | null {
  const match = url.match(/github\.com\/([\w-]+)\/([\w.-]+)/i);
  if (!match) return null;

  return {
    owner: match[1],
    repo: match[2].replace(/\.git$/, ''),
  };
}
