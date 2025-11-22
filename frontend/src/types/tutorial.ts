/**
 * Tutorial Type Definitions
 * 与后端 Pydantic 模型保持一致
 */

/**
 * 仓库信息
 */
export interface Repository {
  name: string;
  url: string;
  description: string;
  language: string;
  stars?: number;
  forks?: number;
}

/**
 * 文件节点
 */
export interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileNode[];
  content?: string;
  size?: number;
}

/**
 * 仓库结构
 */
export interface RepositoryStructure {
  rootDirectories: FileNode[];
  keyFiles: {
    path: string;
    description: string;
  }[];
}

/**
 * 学习模块
 */
export interface Module {
  id: string;
  name: string;
  description: string;
  dependencies: string[];
  learningObjectives: string[];
  estimatedMinutes: number;
  stepIds?: string[]; // 该模块包含的步骤 ID 列表
}

/**
 * 学习步骤
 */
export interface Step {
  id: string;
  title: string;
  description: string;
  filePath: string;
  lineStart: number;
  lineEnd: number;
  codeSnippet: string;
  explanation: string;
  tips: string[];
  relatedFiles: string[];
  moduleId?: string;
}

/**
 * 教程数据
 */
export interface TutorialData {
  repo: Repository;
  overview: string;
  prerequisites: string[];
  structure: RepositoryStructure;
  modules: Module[];
  steps: Step[];
}

/**
 * 最近访问的项目
 */
export interface RecentProject {
  repoUrl: string;
  repoName: string;
  language: string;
  visitedAt: string;
}

/**
 * 用户设置
 */
export interface UserSettings {
  language: 'zh-CN' | 'en-US';
  theme: 'light' | 'dark';
  recentProjects: RecentProject[];
}

/**
 * 模块完成状态
 */
export type ModuleStatus = 'not-started' | 'in-progress' | 'completed';

/**
 * 学习进度数据
 */
export interface LearningProgress {
  completedSteps: Set<string>; // 已完成步骤 ID 集合
  currentModuleId: string; // 当前模块 ID
}

/**
 * 学习进度存储格式 (用于 localStorage)
 */
export interface LearningProgressStorage {
  completedSteps: string[]; // 已完成步骤 ID 数组
  currentModuleId: string;
}
