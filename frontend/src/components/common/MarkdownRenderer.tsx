/**
 * Markdown Renderer Component
 * 渲染 Markdown 内容并支持代码高亮
 */

'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github.css'; // 使用 GitHub 风格的代码高亮

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export default function MarkdownRenderer({
  content,
  className = '',
}: MarkdownRendererProps) {
  return (
    <div className={`markdown-body ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={{
          // 自定义代码块样式
          code({ node, inline, className, children, ...props }) {
            return inline ? (
              <code className={className} {...props}>
                {children}
              </code>
            ) : (
              <code className={`${className} hljs`} {...props}>
                {children}
              </code>
            );
          },
          // 自定义链接 - 在新窗口打开
          a({ node, children, href, ...props }) {
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                {...props}
              >
                {children}
              </a>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>

      <style jsx global>{`
        .markdown-body {
          font-size: 14px;
          line-height: 1.6;
          word-wrap: break-word;
        }

        .markdown-body h1,
        .markdown-body h2,
        .markdown-body h3,
        .markdown-body h4,
        .markdown-body h5,
        .markdown-body h6 {
          margin-top: 24px;
          margin-bottom: 16px;
          font-weight: 600;
          line-height: 1.25;
        }

        .markdown-body h1 {
          font-size: 2em;
          border-bottom: 1px solid #eaecef;
          padding-bottom: 0.3em;
        }

        .markdown-body h2 {
          font-size: 1.5em;
          border-bottom: 1px solid #eaecef;
          padding-bottom: 0.3em;
        }

        .markdown-body h3 {
          font-size: 1.25em;
        }

        .markdown-body p {
          margin-top: 0;
          margin-bottom: 16px;
        }

        .markdown-body code {
          padding: 0.2em 0.4em;
          margin: 0;
          font-size: 85%;
          background-color: rgba(175, 184, 193, 0.2);
          border-radius: 6px;
          font-family: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas,
            'Liberation Mono', monospace;
        }

        .markdown-body pre {
          padding: 16px;
          overflow: auto;
          font-size: 85%;
          line-height: 1.45;
          background-color: #f6f8fa;
          border-radius: 6px;
          margin-bottom: 16px;
        }

        .markdown-body pre code {
          display: inline;
          max-width: auto;
          padding: 0;
          margin: 0;
          overflow: visible;
          line-height: inherit;
          word-wrap: normal;
          background-color: transparent;
          border: 0;
        }

        .markdown-body ul,
        .markdown-body ol {
          padding-left: 2em;
          margin-top: 0;
          margin-bottom: 16px;
        }

        .markdown-body li {
          margin-top: 0.25em;
        }

        .markdown-body blockquote {
          padding: 0 1em;
          color: #57606a;
          border-left: 0.25em solid #d0d7de;
          margin: 0 0 16px 0;
        }

        .markdown-body table {
          border-spacing: 0;
          border-collapse: collapse;
          margin-bottom: 16px;
          width: 100%;
        }

        .markdown-body table th,
        .markdown-body table td {
          padding: 6px 13px;
          border: 1px solid #d0d7de;
        }

        .markdown-body table th {
          font-weight: 600;
          background-color: #f6f8fa;
        }

        .markdown-body table tr:nth-child(2n) {
          background-color: #f6f8fa;
        }

        .markdown-body a {
          color: #0969da;
          text-decoration: none;
        }

        .markdown-body a:hover {
          text-decoration: underline;
        }

        .markdown-body hr {
          height: 0.25em;
          padding: 0;
          margin: 24px 0;
          background-color: #d0d7de;
          border: 0;
        }
      `}</style>
    </div>
  );
}
