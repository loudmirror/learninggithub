/**
 * useLearningProgress Hook Tests
 */

import { renderHook, act } from '@testing-library/react';
import { useLearningProgress } from '../useLearningProgress';
import type { Module, Step } from '@/types/tutorial';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('useLearningProgress', () => {
  const mockModules: Module[] = [
    {
      id: 'module-1',
      name: 'Module 1',
      description: 'First module',
      dependencies: [],
      learningObjectives: ['Objective 1'],
      estimatedMinutes: 60,
      stepIds: ['step-1', 'step-2'],
    },
    {
      id: 'module-2',
      name: 'Module 2',
      description: 'Second module',
      dependencies: ['module-1'],
      learningObjectives: ['Objective 2'],
      estimatedMinutes: 90,
      stepIds: ['step-3', 'step-4', 'step-5'],
    },
  ];

  const mockSteps: Step[] = [
    {
      id: 'step-1',
      title: 'Step 1',
      description: 'First step',
      filePath: 'index.ts',
      lineStart: 1,
      lineEnd: 10,
      codeSnippet: 'code',
      explanation: 'explanation',
      tips: [],
      relatedFiles: [],
      moduleId: 'module-1',
    },
    {
      id: 'step-2',
      title: 'Step 2',
      description: 'Second step',
      filePath: 'index.ts',
      lineStart: 11,
      lineEnd: 20,
      codeSnippet: 'code',
      explanation: 'explanation',
      tips: [],
      relatedFiles: [],
      moduleId: 'module-1',
    },
    {
      id: 'step-3',
      title: 'Step 3',
      description: 'Third step',
      filePath: 'app.ts',
      lineStart: 1,
      lineEnd: 15,
      codeSnippet: 'code',
      explanation: 'explanation',
      tips: [],
      relatedFiles: [],
      moduleId: 'module-2',
    },
    {
      id: 'step-4',
      title: 'Step 4',
      description: 'Fourth step',
      filePath: 'app.ts',
      lineStart: 16,
      lineEnd: 30,
      codeSnippet: 'code',
      explanation: 'explanation',
      tips: [],
      relatedFiles: [],
      moduleId: 'module-2',
    },
    {
      id: 'step-5',
      title: 'Step 5',
      description: 'Fifth step',
      filePath: 'app.ts',
      lineStart: 31,
      lineEnd: 45,
      codeSnippet: 'code',
      explanation: 'explanation',
      tips: [],
      relatedFiles: [],
      moduleId: 'module-2',
    },
  ];

  beforeEach(() => {
    localStorageMock.clear();
  });

  it('should initialize with first module as current', () => {
    const { result } = renderHook(() =>
      useLearningProgress({
        repoUrl: 'https://github.com/test/repo',
        modules: mockModules,
        steps: mockSteps,
      })
    );

    expect(result.current.currentModuleId).toBe('module-1');
    expect(result.current.completedSteps.size).toBe(0);
  });

  it('should toggle step completion', () => {
    const { result } = renderHook(() =>
      useLearningProgress({
        repoUrl: 'https://github.com/test/repo',
        modules: mockModules,
        steps: mockSteps,
      })
    );

    // Toggle step-1 to completed
    act(() => {
      result.current.toggleStep('step-1');
    });

    expect(result.current.completedSteps.has('step-1')).toBe(true);

    // Toggle step-1 back to not completed
    act(() => {
      result.current.toggleStep('step-1');
    });

    expect(result.current.completedSteps.has('step-1')).toBe(false);
  });

  it('should calculate module status correctly', () => {
    const { result } = renderHook(() =>
      useLearningProgress({
        repoUrl: 'https://github.com/test/repo',
        modules: mockModules,
        steps: mockSteps,
      })
    );

    // Initially, module should be not-started
    expect(result.current.getModuleStatus(mockModules[0])).toBe('not-started');

    // Complete one step - should be in-progress
    act(() => {
      result.current.toggleStep('step-1');
    });

    expect(result.current.getModuleStatus(mockModules[0])).toBe('in-progress');

    // Complete all steps - should be completed
    act(() => {
      result.current.toggleStep('step-2');
    });

    expect(result.current.getModuleStatus(mockModules[0])).toBe('completed');
  });

  it('should save and restore progress from localStorage', () => {
    const { result, rerender } = renderHook(() =>
      useLearningProgress({
        repoUrl: 'https://github.com/test/repo',
        modules: mockModules,
        steps: mockSteps,
      })
    );

    // Complete some steps
    act(() => {
      result.current.toggleStep('step-1');
      result.current.toggleStep('step-3');
      result.current.setCurrentModule('module-2');
    });

    // Verify localStorage was updated
    const storageKey = 'learning-progress-https%3A%2F%2Fgithub.com%2Ftest%2Frepo';
    const saved = localStorage.getItem(storageKey);
    expect(saved).toBeTruthy();

    const parsed = JSON.parse(saved!);
    expect(parsed.completedSteps).toContain('step-1');
    expect(parsed.completedSteps).toContain('step-3');
    expect(parsed.currentModuleId).toBe('module-2');

    // Re-render hook (simulate page reload)
    rerender();

    // Progress should be restored
    expect(result.current.completedSteps.has('step-1')).toBe(true);
    expect(result.current.completedSteps.has('step-3')).toBe(true);
    expect(result.current.currentModuleId).toBe('module-2');
  });

  it('should calculate overall progress correctly', () => {
    const { result } = renderHook(() =>
      useLearningProgress({
        repoUrl: 'https://github.com/test/repo',
        modules: mockModules,
        steps: mockSteps,
      })
    );

    // Initially 0%
    expect(result.current.overallProgress).toBe(0);
    expect(result.current.completedModulesCount).toBe(0);

    // Complete module-1
    act(() => {
      result.current.toggleStep('step-1');
      result.current.toggleStep('step-2');
    });

    expect(result.current.completedModulesCount).toBe(1);
    expect(result.current.overallProgress).toBe(50); // 1/2 modules = 50%

    // Complete module-2
    act(() => {
      result.current.toggleStep('step-3');
      result.current.toggleStep('step-4');
      result.current.toggleStep('step-5');
    });

    expect(result.current.completedModulesCount).toBe(2);
    expect(result.current.overallProgress).toBe(100); // 2/2 modules = 100%
  });

  it('should get current module steps correctly', () => {
    const { result } = renderHook(() =>
      useLearningProgress({
        repoUrl: 'https://github.com/test/repo',
        modules: mockModules,
        steps: mockSteps,
      })
    );

    // Initially module-1
    const module1Steps = result.current.getCurrentModuleSteps();
    expect(module1Steps).toHaveLength(2);
    expect(module1Steps.map((s) => s.id)).toEqual(['step-1', 'step-2']);

    // Switch to module-2
    act(() => {
      result.current.setCurrentModule('module-2');
    });

    const module2Steps = result.current.getCurrentModuleSteps();
    expect(module2Steps).toHaveLength(3);
    expect(module2Steps.map((s) => s.id)).toEqual(['step-3', 'step-4', 'step-5']);
  });

  it('should reset progress correctly', () => {
    const { result } = renderHook(() =>
      useLearningProgress({
        repoUrl: 'https://github.com/test/repo',
        modules: mockModules,
        steps: mockSteps,
      })
    );

    // Complete some steps and change module
    act(() => {
      result.current.toggleStep('step-1');
      result.current.toggleStep('step-3');
      result.current.setCurrentModule('module-2');
    });

    expect(result.current.completedSteps.size).toBe(2);
    expect(result.current.currentModuleId).toBe('module-2');

    // Reset progress
    act(() => {
      result.current.resetProgress();
    });

    expect(result.current.completedSteps.size).toBe(0);
    expect(result.current.currentModuleId).toBe('module-1');
  });
});
