# Story 1.3: 实现学习路径 UI 交互

> **Story ID:** STORY-1.3
> **Epic:** EPIC-MVP-001 - LearningGitHub MVP v0.1
> **Iteration:** 迭代 1 - 基础架构 + Mock 数据
> **Status:** Draft
> **Priority:** P0 - Critical
> **Estimate:** 1-2 天
> **Created:** 2025-11-20
> **Depends On:** STORY-1.2 (前端基础组件)

---

## User Story

**作为** 用户，
**我想要** 看到清晰的模块化学习路径，并能够标记学习进度，
**以便** 我可以按模块顺序学习项目，并清楚地知道自己当前的学习位置和完成情况。

---

## Story 背景与上下文

### 项目上下文

本 Story 在 Story 1.2 的基础上，增强学习路径的交互功能。学习路径是 LearningGitHub 的核心 UX 创新点，将复杂的 GitHub 项目分解为易于理解的模块，帮助用户建立清晰的学习脉络。

### 技术上下文

- **基于**: Story 1.2 的基础组件（`LearningPathPanel`, `StepList`）
- **状态管理**: React Hooks (useState, useEffect)
- **本地存储**: localStorage（持久化学习进度）
- **交互设计**: 遵循 `docs/ux/ux-spec.md` 规范

### 迭代 1 目标

实现模块和步骤的完整交互逻辑，包括：
- 模块选择与高亮
- 步骤完成标记
- 进度持久化
- 当前模块步骤过滤

---

## 验收标准 (Acceptance Criteria)

### 功能性需求

**AC1: 模块列表交互**
- ✅ 显示所有学习模块（从 `tutorial.modules` 数据）
- ✅ 每个模块显示:
  - 模块标题
  - 模块描述
  - 模块顺序编号（如 "1/3"）
  - 完成状态图标（未开始/进行中/已完成）
- ✅ 点击模块项可切换为当前模块
- ✅ 当前模块有明显的视觉高亮（如边框加粗、背景色变化）

**AC2: 当前模块步骤过滤**
- ✅ "当前模块步骤列表"仅显示当前模块的步骤
- ✅ 基于 `modules[currentModuleIndex].stepIds` 过滤 `tutorial.steps`
- ✅ 切换模块后，步骤列表自动更新
- ✅ 页面滚动到步骤列表区域（可选，提升体验）

**AC3: 步骤完成标记**
- ✅ 每个步骤有"完成"复选框或按钮
- ✅ 点击后步骤状态变为"已完成"
- ✅ 已完成的步骤有视觉反馈（如文字变灰、加删除线、勾选图标）
- ✅ 可以取消完成（再次点击）

**AC4: 模块完成状态自动计算**
- ✅ 模块完成状态基于其包含的步骤计算:
  - **未开始**: 所有步骤都未完成
  - **进行中**: 部分步骤已完成
  - **已完成**: 所有步骤都已完成
- ✅ 步骤状态变化时，模块状态自动更新
- ✅ 模块完成状态有对应的图标或颜色标识

**AC5: 学习进度持久化**
- ✅ 步骤完成状态保存到浏览器 localStorage
- ✅ 使用 `repoUrl` 作为存储 key（不同项目独立）
- ✅ 页面刷新后，学习进度自动恢复
- ✅ 切换到其他项目后再回来，进度仍然保留

**AC6: 整体进度展示**
- ✅ 在学习路径 Panel 顶部显示整体进度
- ✅ 格式: "已完成 X/Y 个模块" 或进度条
- ✅ 进度实时更新

### 交互体验需求

**AC7: 视觉层级清晰**
- ✅ 当前模块、已完成模块、未开始模块有明显区分
- ✅ 已完成步骤、当前步骤、未完成步骤有明显区分
- ✅ 信息密度适中，不会让用户感到拥挤

**AC8: 操作反馈及时**
- ✅ 点击模块/步骤后立即有视觉反馈
- ✅ 状态变化动画流畅（可选，如 fade in/out）
- ✅ 无明显的操作延迟

**AC9: 移动端适配**
- ✅ 学习路径在移动端仍然易于操作
- ✅ 模块列表和步骤列表在小屏幕上清晰可见
- ✅ 触摸操作友好（按钮大小合适）

### 质量需求

**AC10: 代码质量**
- ✅ 学习进度状态管理逻辑清晰，易于理解
- ✅ 使用自定义 Hook 封装进度管理逻辑
- ✅ TypeScript 类型定义完整
- ✅ 遵循 React 最佳实践（避免不必要的重渲染）

**AC11: 测试覆盖**
- ✅ 至少包含 2 个测试用例:
  - 测试步骤完成标记功能
  - 测试模块状态自动计算
- ✅ 所有测试通过

---

## 技术实现任务 (Tasks)

### Task 1: 创建学习进度状态管理 Hook
- [ ] 创建 `src/lib/hooks/useLearningProgress.ts`
- [ ] 定义状态接口:
  ```typescript
  interface LearningProgress {
    completedSteps: Set<string>;  // 已完成步骤 ID 集合
    currentModuleId: string;      // 当前模块 ID
  }
  ```
- [ ] 实现 Hook 功能:
  - `loadProgress(repoUrl)`: 从 localStorage 加载进度
  - `saveProgress(repoUrl, progress)`: 保存进度到 localStorage
  - `toggleStep(stepId)`: 切换步骤完成状态
  - `setCurrentModule(moduleId)`: 设置当前模块
  - `getModuleStatus(module)`: 计算模块完成状态
- [ ] 返回状态和操作函数

### Task 2: 更新 TutorialPage 使用进度 Hook
- [ ] 在 `src/app/tutorial/[owner]/[repo]/page.tsx` 中使用 `useLearningProgress`
- [ ] 初始化学习进度（基于 repoUrl）
- [ ] 将进度状态和操作函数传递给子组件

### Task 3: 增强 LearningPathPanel 组件
- [ ] 修改 `src/components/tutorial/LearningPathPanel.tsx`
- [ ] 接收 Props:
  - `modules`: 模块列表
  - `currentModuleId`: 当前模块 ID
  - `onModuleSelect`: 模块选择回调
  - `getModuleStatus`: 模块状态计算函数
- [ ] 实现整体进度显示（已完成/总模块数）
- [ ] 实现模块列表渲染:
  - 遍历 modules
  - 显示模块标题、描述、顺序
  - 计算并显示模块状态图标
  - 当前模块高亮
  - 添加点击事件

### Task 4: 创建 ModuleItem 组件（可选）
- [ ] 创建 `src/components/tutorial/ModuleItem.tsx`
- [ ] 接收 Props:
  - `module`: 模块数据
  - `status`: 模块状态 (未开始/进行中/已完成)
  - `isCurrent`: 是否为当前模块
  - `onClick`: 点击回调
- [ ] 实现视觉状态:
  - 未开始: 默认样式
  - 进行中: 进度图标（如 ⏳）
  - 已完成: 完成图标（如 ✅）
  - 当前模块: 高亮边框或背景

### Task 5: 增强 StepList 组件
- [ ] 修改 `src/components/tutorial/StepList.tsx`
- [ ] 接收 Props:
  - `steps`: 当前模块的步骤列表（已过滤）
  - `completedSteps`: 已完成步骤 ID 集合
  - `onStepToggle`: 步骤完成切换回调
- [ ] 传递数据给 StepItem 组件

### Task 6: 增强 StepItem 组件
- [ ] 修改 `src/components/tutorial/StepItem.tsx`
- [ ] 接收 Props:
  - `step`: 步骤数据
  - `isCompleted`: 是否已完成
  - `onToggle`: 完成切换回调
- [ ] 添加"完成"复选框或按钮
- [ ] 实现完成状态视觉反馈:
  - 已完成: 文字变灰或加删除线
  - 显示勾选图标
- [ ] 绑定点击事件

### Task 7: 实现模块切换逻辑
- [ ] 在 TutorialPage 中实现 `handleModuleSelect` 函数
- [ ] 调用 `setCurrentModule(moduleId)`
- [ ] 更新状态触发步骤列表重新渲染
- [ ] 可选: 页面滚动到步骤列表区域
  ```typescript
  const stepListRef = useRef<HTMLDivElement>(null);
  stepListRef.current?.scrollIntoView({ behavior: 'smooth' });
  ```

### Task 8: 实现步骤完成切换逻辑
- [ ] 在 TutorialPage 中实现 `handleStepToggle` 函数
- [ ] 调用 `toggleStep(stepId)`
- [ ] 自动触发模块状态重新计算
- [ ] 自动保存进度到 localStorage

### Task 9: 实现模块状态计算逻辑
- [ ] 在 `useLearningProgress` Hook 中实现 `getModuleStatus`
- [ ] 逻辑:
  ```typescript
  const moduleStepIds = module.stepIds;
  const completedCount = moduleStepIds.filter(id =>
    completedSteps.has(id)
  ).length;

  if (completedCount === 0) return 'not-started';
  if (completedCount === moduleStepIds.length) return 'completed';
  return 'in-progress';
  ```

### Task 10: 实现当前模块步骤过滤
- [ ] 在 TutorialPage 中基于 `currentModuleId` 过滤步骤
- [ ] 逻辑:
  ```typescript
  const currentModule = modules.find(m => m.id === currentModuleId);
  const currentSteps = steps.filter(step =>
    currentModule?.stepIds.includes(step.id)
  );
  ```
- [ ] 传递给 StepList 组件

### Task 11: 实现整体进度计算
- [ ] 在 LearningPathPanel 中计算已完成模块数
- [ ] 显示进度文本或进度条
- [ ] 可选: 使用 Ant Design Progress 组件

### Task 12: 样式优化
- [ ] 调整模块列表样式（间距、边框、颜色）
- [ ] 调整步骤列表样式
- [ ] 确保当前模块高亮明显
- [ ] 确保已完成状态视觉清晰
- [ ] 响应式适配

### Task 13: 编写测试
- [ ] 创建 `src/lib/hooks/__tests__/useLearningProgress.test.ts`
- [ ] 测试步骤完成切换
- [ ] 测试模块状态计算
- [ ] 测试 localStorage 持久化
- [ ] 创建 `src/components/tutorial/__tests__/LearningPathPanel.test.tsx`
- [ ] 测试模块点击事件
- [ ] 运行测试确保通过

### Task 14: 集成测试（本地验证）
- [ ] 启动后端服务
- [ ] 启动前端服务
- [ ] 测试完整流程:
  1. 访问教程页面
  2. 查看学习路径模块列表
  3. 点击不同模块，观察步骤列表变化
  4. 标记步骤为完成，观察模块状态变化
  5. 刷新页面，验证进度恢复
  6. 切换到其他项目再回来，验证进度独立

---

## 技术说明 (Dev Notes)

### 核心 Hook 示例

**`src/lib/hooks/useLearningProgress.ts`**

```typescript
import { useState, useEffect, useCallback } from "react";
import type { Module, Step } from "@/types/tutorial";

interface LearningProgress {
  completedSteps: Set<string>;
  currentModuleId: string;
}

const STORAGE_KEY_PREFIX = "learning-progress-";

export function useLearningProgress(
  repoUrl: string,
  modules: Module[]
) {
  const [progress, setProgress] = useState<LearningProgress>({
    completedSteps: new Set(),
    currentModuleId: modules[0]?.id || "",
  });

  // 加载进度
  useEffect(() => {
    const storageKey = STORAGE_KEY_PREFIX + repoUrl;
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      const parsed = JSON.parse(saved);
      setProgress({
        completedSteps: new Set(parsed.completedSteps),
        currentModuleId: parsed.currentModuleId || modules[0]?.id,
      });
    }
  }, [repoUrl, modules]);

  // 保存进度
  const saveProgress = useCallback(
    (newProgress: LearningProgress) => {
      const storageKey = STORAGE_KEY_PREFIX + repoUrl;
      localStorage.setItem(
        storageKey,
        JSON.stringify({
          completedSteps: Array.from(newProgress.completedSteps),
          currentModuleId: newProgress.currentModuleId,
        })
      );
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

  // 计算模块状态
  const getModuleStatus = useCallback(
    (module: Module) => {
      const completedCount = module.stepIds.filter((id) =>
        progress.completedSteps.has(id)
      ).length;

      if (completedCount === 0) return "not-started";
      if (completedCount === module.stepIds.length) return "completed";
      return "in-progress";
    },
    [progress.completedSteps]
  );

  return {
    completedSteps: progress.completedSteps,
    currentModuleId: progress.currentModuleId,
    toggleStep,
    setCurrentModule,
    getModuleStatus,
  };
}
```

### 模块状态图标映射

```typescript
const MODULE_STATUS_ICONS = {
  "not-started": "⚪",  // 或使用 Ant Design Icon
  "in-progress": "⏳",
  "completed": "✅",
};
```

---

## 风险与依赖

### 风险

**R1: localStorage 容量限制**
- **影响**: 用户学习多个项目后可能超出 localStorage 限制（通常 5-10MB）
- **缓解**:
  - MVP 阶段仅存储步骤 ID，数据量极小
  - 后续版本考虑服务端存储

**R2: 用户切换浏览器或设备**
- **影响**: 学习进度无法跨设备同步
- **缓解**:
  - MVP 阶段接受此限制
  - 在 UI 中提示用户进度仅保存在当前浏览器
  - 后续版本引入账号系统

### 依赖

- ✅ Story 1.2 完成（前端基础组件）
- ✅ UX 规格定义了学习路径交互规范

### 后续 Story 依赖

- Story 2.4 (学习路径生成) 将基于真实数据生成模块
- 后续版本可能引入服务端进度同步

---

## Definition of Done (完成定义)

- [x] 所有任务复选框已勾选 ✅
- [x] 模块列表可点击切换，当前模块高亮明显
- [x] 步骤列表根据当前模块自动过滤
- [x] 步骤可标记为完成，已完成步骤有视觉反馈
- [x] 模块完成状态根据步骤自动计算
- [x] 学习进度保存到 localStorage
- [x] 页面刷新后进度自动恢复
- [x] 所有测试通过
- [x] 代码质量检查通过
- [x] 移动端交互正常
- [x] 本地集成测试通过（完整学习流程可用）
- [x] 代码已提交到 Git (feature branch)
- [x] UX 团队确认交互体验符合设计规范

---

## Dev Agent Record

> 此部分由开发工程师在实施过程中更新

### Agent Model Used
- 待填写

### Debug Log References
- 待填写

### Completion Notes
- 待填写

### File List

**Created:**
- 待填写

**Modified:**
- 待填写

### Change Log

| Date | Change | Author |
|------|--------|--------|
| 2025-11-20 | Story 创建 | PM (John) |

---

## 相关文档

- [Epic: MVP v0.1](./epic-mvp-v0.1.md)
- [Story 1.1: 后端基础架构](./story-1.1-backend-foundation.md)
- [Story 1.2: 前端基础应用](./story-1.2-frontend-foundation.md)
- [UX 规格](../ux/ux-spec.md)
- [前端规格](../ux/front-end-spec.md)
- [编码标准](../architecture/coding-standards.md)
