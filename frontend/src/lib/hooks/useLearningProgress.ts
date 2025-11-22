/**
 * useLearningProgress Hook
 * 用于管理学习进度的自定义 Hook
 */

import { useState, useEffect, useCallback } from 'react';
import type {
  Module,
  Step,
  ModuleStatus,
  LearningProgress,
  LearningProgressStorage,
} from '@/types/tutorial';

const STORAGE_KEY_PREFIX = 'learning-progress-';

interface UseLearningProgressOptions {
  repoUrl: string;
  modules: Module[];
  steps: Step[];
}

/**
 * 从 localStorage 加载进度
 */
function loadProgressFromStorage(repoUrl: string, modules: Module[]): LearningProgress {
  if (typeof window === 'undefined') {
    return {
      completedSteps: new Set(),
      currentModuleId: modules[0]?.id || '',
    };
  }

  try {
    const storageKey = STORAGE_KEY_PREFIX + encodeURIComponent(repoUrl);
    const saved = localStorage.getItem(storageKey);

    if (saved) {
      const parsed: LearningProgressStorage = JSON.parse(saved);
      return {
        completedSteps: new Set(parsed.completedSteps || []),
        currentModuleId: parsed.currentModuleId || modules[0]?.id || '',
      };
    }
  } catch (error) {
    console.error('Failed to load learning progress:', error);
  }

  return {
    completedSteps: new Set(),
    currentModuleId: modules[0]?.id || '',
  };
}

/**
 * 保存进度到 localStorage
 */
function saveProgressToStorage(repoUrl: string, progress: LearningProgress): void {
  if (typeof window === 'undefined') return;

  try {
    const storageKey = STORAGE_KEY_PREFIX + encodeURIComponent(repoUrl);
    const toSave: LearningProgressStorage = {
      completedSteps: Array.from(progress.completedSteps),
      currentModuleId: progress.currentModuleId,
    };
    localStorage.setItem(storageKey, JSON.stringify(toSave));
  } catch (error) {
    console.error('Failed to save learning progress:', error);
  }
}

/**
 * 获取模块包含的步骤 ID 列表
 */
function getModuleStepIds(module: Module, allSteps: Step[]): string[] {
  // 如果模块有 stepIds 字段，直接使用
  if (module.stepIds && module.stepIds.length > 0) {
    return module.stepIds;
  }

  // 否则通过 step.moduleId 过滤
  return allSteps.filter((step) => step.moduleId === module.id).map((step) => step.id);
}

/**
 * 学习进度管理 Hook
 */
export function useLearningProgress({ repoUrl, modules, steps }: UseLearningProgressOptions) {
  const [progress, setProgress] = useState<LearningProgress>(() =>
    loadProgressFromStorage(repoUrl, modules)
  );

  // 当 repoUrl 变化时重新加载进度
  useEffect(() => {
    const newProgress = loadProgressFromStorage(repoUrl, modules);
    setProgress(newProgress);
  }, [repoUrl, modules]);

  // 保存进度
  const saveProgress = useCallback(
    (newProgress: LearningProgress) => {
      saveProgressToStorage(repoUrl, newProgress);
    },
    [repoUrl]
  );

  // 切换步骤完成状态
  const toggleStep = useCallback(
    (stepId: string) => {
      setProgress((prev) => {
        const newSet = new Set(prev.completedSteps);
        if (newSet.has(stepId)) {
          newSet.delete(stepId);
        } else {
          newSet.add(stepId);
        }
        const newProgress = {
          ...prev,
          completedSteps: newSet,
        };
        saveProgress(newProgress);
        return newProgress;
      });
    },
    [saveProgress]
  );

  // 设置当前模块
  const setCurrentModule = useCallback(
    (moduleId: string) => {
      setProgress((prev) => {
        const newProgress = { ...prev, currentModuleId: moduleId };
        saveProgress(newProgress);
        return newProgress;
      });
    },
    [saveProgress]
  );

  // 计算模块完成状态
  const getModuleStatus = useCallback(
    (module: Module): ModuleStatus => {
      const moduleStepIds = getModuleStepIds(module, steps);

      if (moduleStepIds.length === 0) {
        return 'not-started';
      }

      const completedCount = moduleStepIds.filter((id) =>
        progress.completedSteps.has(id)
      ).length;

      if (completedCount === 0) return 'not-started';
      if (completedCount === moduleStepIds.length) return 'completed';
      return 'in-progress';
    },
    [progress.completedSteps, steps]
  );

  // 计算已完成模块数量
  const completedModulesCount = useCallback(() => {
    return modules.filter((module) => getModuleStatus(module) === 'completed').length;
  }, [modules, getModuleStatus]);

  // 计算整体进度百分比
  const getOverallProgress = useCallback(() => {
    if (modules.length === 0) return 0;
    const completed = completedModulesCount();
    return Math.round((completed / modules.length) * 100);
  }, [modules.length, completedModulesCount]);

  // 获取当前模块的步骤列表
  const getCurrentModuleSteps = useCallback(() => {
    const currentModule = modules.find((m) => m.id === progress.currentModuleId);
    if (!currentModule) return [];

    const moduleStepIds = getModuleStepIds(currentModule, steps);
    return steps.filter((step) => moduleStepIds.includes(step.id));
  }, [modules, steps, progress.currentModuleId]);

  // 重置进度
  const resetProgress = useCallback(() => {
    const newProgress: LearningProgress = {
      completedSteps: new Set(),
      currentModuleId: modules[0]?.id || '',
    };
    setProgress(newProgress);
    saveProgress(newProgress);
  }, [modules, saveProgress]);

  return {
    // 状态
    completedSteps: progress.completedSteps,
    currentModuleId: progress.currentModuleId,

    // 操作方法
    toggleStep,
    setCurrentModule,
    getModuleStatus,
    resetProgress,

    // 统计信息
    completedModulesCount: completedModulesCount(),
    totalModulesCount: modules.length,
    overallProgress: getOverallProgress(),

    // 辅助方法
    getCurrentModuleSteps,
  };
}
