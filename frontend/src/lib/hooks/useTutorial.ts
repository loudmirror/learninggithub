/**
 * useTutorial Hook
 * 用于获取和管理教程数据的自定义 Hook
 */

import { useState, useCallback } from 'react';
import { getTutorial } from '@/lib/api';
import type { TutorialData, RecentProject } from '@/types/tutorial';
import type { ApiStatus, ApiError, TutorialRequestParams } from '@/types/api';
import { useLocalStorage } from './useLocalStorage';

const MAX_RECENT_PROJECTS = 10;

/**
 * useTutorial Hook
 * @returns Tutorial 状态和操作方法
 */
export function useTutorial() {
  const [data, setData] = useState<TutorialData | null>(null);
  const [status, setStatus] = useState<ApiStatus>('idle');
  const [error, setError] = useState<ApiError | null>(null);

  // 最近访问的项目 (持久化到 localStorage)
  const [recentProjects, setRecentProjects, clearRecentProjects] = useLocalStorage<
    RecentProject[]
  >('recentProjects', []);

  /**
   * 获取教程数据
   */
  const fetchTutorial = useCallback(async (params: TutorialRequestParams) => {
    try {
      setStatus('loading');
      setError(null);

      const response = await getTutorial(params);

      if (response.ok && response.data) {
        setData(response.data);
        setStatus('success');

        // 添加到最近访问列表
        addToRecentProjects({
          repoUrl: params.repoUrl,
          repoName: response.data.repo.name,
          language: params.language || 'zh-CN',
          visitedAt: new Date().toISOString(),
        });

        return response.data;
      } else {
        throw new Error(response.message || '获取教程失败');
      }
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError);
      setStatus('error');
      console.error('fetchTutorial error:', apiError);
      throw apiError;
    }
  }, []);

  /**
   * 添加项目到最近访问列表
   */
  const addToRecentProjects = useCallback(
    (project: RecentProject) => {
      setRecentProjects((prev) => {
        // 移除重复项
        const filtered = prev.filter((p) => p.repoUrl !== project.repoUrl);

        // 添加到开头
        const updated = [project, ...filtered];

        // 保持最大数量限制
        return updated.slice(0, MAX_RECENT_PROJECTS);
      });
    },
    [setRecentProjects]
  );

  /**
   * 从最近访问列表中移除项目
   */
  const removeFromRecentProjects = useCallback(
    (repoUrl: string) => {
      setRecentProjects((prev) => prev.filter((p) => p.repoUrl !== repoUrl));
    },
    [setRecentProjects]
  );

  /**
   * 重置状态
   */
  const reset = useCallback(() => {
    setData(null);
    setStatus('idle');
    setError(null);
  }, []);

  /**
   * 重试上次请求
   */
  const retry = useCallback(
    async (params: TutorialRequestParams) => {
      return fetchTutorial(params);
    },
    [fetchTutorial]
  );

  return {
    // 数据状态
    data,
    status,
    error,
    isLoading: status === 'loading',
    isSuccess: status === 'success',
    isError: status === 'error',
    isIdle: status === 'idle',

    // 操作方法
    fetchTutorial,
    reset,
    retry,

    // 最近访问的项目
    recentProjects,
    addToRecentProjects,
    removeFromRecentProjects,
    clearRecentProjects,
  };
}
