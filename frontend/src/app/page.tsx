/**
 * Home Page
 * 主页 - 根据 Figma 设计稿重新设计
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Spin, message } from 'antd';
import {
  LinkOutlined,
  ThunderboltOutlined,
  ReadOutlined,
  GithubOutlined,
  StarOutlined,
  ExportOutlined,
  WarningOutlined,
  ClockCircleOutlined,
  RocketOutlined,
} from '@ant-design/icons';
import { useTutorial } from '@/lib/hooks';
import type { Language } from '@/components/home/LanguageSelector';
import styles from './page.module.css';

// 热门项目数据
const POPULAR_PROJECTS = [
  {
    owner: 'tensorflow',
    repo: 'tensorflow',
    desc: 'An Open Source Machine Learning Framework',
    lang: 'C++',
    langColor: '#f34b7d',
    stars: '185k',
  },
  {
    owner: 'vuejs',
    repo: 'vue',
    desc: 'The Progressive JavaScript Framework',
    lang: 'TypeScript',
    langColor: '#3178c6',
    stars: '207k',
  },
  {
    owner: 'django',
    repo: 'django',
    desc: 'The Web framework for perfectionists',
    lang: 'Python',
    langColor: '#3572a5',
    stars: '78k',
  },
  {
    owner: 'rust-lang',
    repo: 'rust',
    desc: 'A language empowering everyone',
    lang: 'Rust',
    langColor: '#dea584',
    stars: '95k',
  },
  {
    owner: 'facebook',
    repo: 'react',
    desc: 'A JavaScript library for building user interfaces',
    lang: 'JavaScript',
    langColor: '#f7df1e',
    stars: '220k',
  },
  {
    owner: 'kubernetes',
    repo: 'kubernetes',
    desc: 'Production-Grade Container Orchestration',
    lang: 'Go',
    langColor: '#00add8',
    stars: '107k',
  },
  {
    owner: 'electron',
    repo: 'electron',
    desc: 'Build cross-platform desktop apps',
    lang: 'C++',
    langColor: '#f34b7d',
    stars: '112k',
  },
  {
    owner: 'spring-projects',
    repo: 'spring-boot',
    desc: 'Spring Boot makes it easy to create stand-alone apps',
    lang: 'Java',
    langColor: '#b07219',
    stars: '72k',
  },
  {
    owner: 'vercel',
    repo: 'next.js',
    desc: 'The React Framework for Production',
    lang: 'JavaScript',
    langColor: '#f7df1e',
    stars: '118k',
  },
  {
    owner: 'pytorch',
    repo: 'pytorch',
    desc: 'Tensors and Dynamic neural networks',
    lang: 'Python',
    langColor: '#3572a5',
    stars: '76k',
  },
  {
    owner: 'ansible',
    repo: 'ansible',
    desc: 'Ansible is a radically simple IT automation platform',
    lang: 'Python',
    langColor: '#3572a5',
    stars: '60k',
  },
  {
    owner: 'pallets',
    repo: 'flask',
    desc: 'The Python micro framework for building web applications',
    lang: 'Python',
    langColor: '#3572a5',
    stars: '66k',
  },
  {
    owner: 'rails',
    repo: 'rails',
    desc: 'Ruby on Rails web framework',
    lang: 'Ruby',
    langColor: '#cc342d',
    stars: '54k',
  },
  {
    owner: 'angular',
    repo: 'angular',
    desc: "The modern web developer's platform",
    lang: 'TypeScript',
    langColor: '#3178c6',
    stars: '93k',
  },
  {
    owner: 'laravel',
    repo: 'laravel',
    desc: 'A PHP framework for web artisans',
    lang: 'PHP',
    langColor: '#4f5d95',
    stars: '76k',
  },
  {
    owner: 'dotnet',
    repo: 'dotnet',
    desc: '.NET is a cross-platform runtime',
    lang: 'C#',
    langColor: '#178600',
    stars: '14k',
  },
];

export default function HomePage() {
  const router = useRouter();
  const { fetchTutorial, isLoading } = useTutorial();

  const [repoUrl, setRepoUrl] = useState('');
  const [language, setLanguage] = useState<Language>('zh-CN');

  /**
   * 处理表单提交
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!repoUrl.trim()) {
      message.warning('请输入 GitHub 仓库地址');
      return;
    }

    try {
      await fetchTutorial({ repoUrl: repoUrl.trim(), language });
      const encodedUrl = encodeURIComponent(repoUrl.trim());
      router.push(`/tutorial?repoUrl=${encodedUrl}&language=${language}`);
    } catch (error) {
      console.error('Failed to fetch tutorial:', error);
    }
  };

  /**
   * 点击热门项目
   */
  const handleProjectClick = (owner: string, repo: string) => {
    const url = `https://github.com/${owner}/${repo}`;
    setRepoUrl(url);
  };

  /**
   * 直接学习热门项目
   */
  const handleLearnProject = async (owner: string, repo: string) => {
    const url = `https://github.com/${owner}/${repo}`;
    try {
      await fetchTutorial({ repoUrl: url, language });
      const encodedUrl = encodeURIComponent(url);
      router.push(`/tutorial?repoUrl=${encodedUrl}&language=${language}`);
    } catch (error) {
      console.error('Failed to fetch tutorial:', error);
    }
  };

  return (
    <div className={styles.pageWrapper}>
      {/* 导航栏 */}
      <header className={styles.header}>
        <div className={styles.logo}>
          <div className={styles.logoIcon}>
            <GithubOutlined />
          </div>
          <div className={styles.logoText}>
            <span className={styles.logoTitle}>LearningGitHub</span>
            <span className={styles.logoSubtitle}>智能每一个GitHub项目</span>
          </div>
        </div>
{/* 导航链接已移除 */}
      </header>

      {/* 主内容 */}
      <main className={styles.main}>
        <div className={styles.container}>
          {/* AI 标签 */}
          <div style={{ textAlign: 'center' }}>
            <span className={styles.aiTag}>
              <RocketOutlined />
              AI 驱动的项目学习助手
            </span>
          </div>

          {/* 步骤流程 */}
          <div className={styles.stepsSection}>
            <div className={styles.step}>
              <div className={`${styles.stepIcon} ${styles.stepIcon1}`}>
                <LinkOutlined />
              </div>
              <div>
                <div className={styles.stepTitle}>粘贴仓库链接</div>
                <div className={styles.stepDesc}>复制你想学习的 GitHub 项目链接</div>
              </div>
            </div>

            <span className={styles.stepArrow}>&rarr;</span>

            <div className={styles.step}>
              <div className={`${styles.stepIcon} ${styles.stepIcon2}`}>
                <ThunderboltOutlined />
              </div>
              <div>
                <div className={styles.stepTitle}>等待解析生成</div>
                <div className={styles.stepDesc}>AI 自动分析项目生成中文教程</div>
              </div>
            </div>

            <span className={styles.stepArrow}>&rarr;</span>

            <div className={styles.step}>
              <div className={`${styles.stepIcon} ${styles.stepIcon3}`}>
                <ReadOutlined />
              </div>
              <div>
                <div className={styles.stepTitle}>跟随教程学习</div>
                <div className={styles.stepDesc}>按照步骤运行项目并理解核心概念</div>
              </div>
            </div>
          </div>

          {/* 表单卡片 */}
          <form className={styles.formCard} onSubmit={handleSubmit}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>GitHub 仓库地址</label>
              <div className={styles.inputWrapper}>
                <GithubOutlined className={styles.inputIcon} />
                <input
                  type="text"
                  className={styles.formInput}
                  placeholder="https://github.com/owner/repo"
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>教程语言</label>
              <select
                className={styles.formSelect}
                value={language}
                onChange={(e) => setLanguage(e.target.value as Language)}
                disabled={isLoading}
              >
                <option value="zh-CN">简体中文</option>
                <option value="en">English</option>
              </select>
            </div>

            <button type="submit" className={styles.submitBtn} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Spin size="small" />
                  生成中...
                </>
              ) : (
                <>
                  <RocketOutlined />
                  开始学习
                </>
              )}
            </button>

            <div className={styles.hints}>
              <div className={styles.hint}>
                <WarningOutlined className={`${styles.hintIcon} ${styles.hintIconWarning}`} />
                暂时只支持公开仓库
              </div>
              <div className={styles.hint}>
                <ClockCircleOutlined className={`${styles.hintIcon} ${styles.hintIconInfo}`} />
                解析和生成教程通常需要 30-90 秒
              </div>
            </div>
          </form>
        </div>

        {/* 热门项目 */}
        <div className={styles.popularSection}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>最近学习的项目</h2>
            <p className={styles.sectionSubtitle}>社区正在学习这些热门仓库</p>
          </div>

          <div className={styles.projectsGrid}>
            {POPULAR_PROJECTS.map((project) => (
              <div
                key={`${project.owner}/${project.repo}`}
                className={styles.projectCard}
                onClick={() => handleProjectClick(project.owner, project.repo)}
              >
                <div className={styles.projectName}>
                  {project.owner}/{project.repo}
                </div>
                <div className={styles.projectDesc}>{project.desc}</div>
                <div className={styles.projectMeta}>
                  <div className={styles.projectLang}>
                    <span
                      className={styles.langDot}
                      style={{ backgroundColor: project.langColor }}
                    />
                    {project.lang}
                    <span className={styles.projectStats}>
                      <StarOutlined />
                      {project.stars}
                    </span>
                  </div>
                  <a
                    className={styles.projectLink}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleLearnProject(project.owner, project.repo);
                    }}
                  >
                    继续学习
                    <ExportOutlined />
                  </a>
                </div>
              </div>
            ))}
          </div>

          <div className={styles.noMore}>没有更多项目了</div>
        </div>
      </main>

      {/* 页脚 */}
      <footer className={styles.footer}>
        &copy; 2025 LearningGitHub.
      </footer>
    </div>
  );
}
