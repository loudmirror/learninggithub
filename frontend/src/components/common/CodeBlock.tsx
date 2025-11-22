/**
 * CodeBlock Component
 * 代码块显示组件,支持语法高亮和复制功能
 */

'use client';

import { useEffect, useRef, useState } from 'react';
import { Button, message, Typography } from 'antd';
import { CopyOutlined, CheckOutlined } from '@ant-design/icons';
import hljs from 'highlight.js/lib/core';
import 'highlight.js/styles/github.css';

// 导入常用语言
import javascript from 'highlight.js/lib/languages/javascript';
import typescript from 'highlight.js/lib/languages/typescript';
import python from 'highlight.js/lib/languages/python';
import java from 'highlight.js/lib/languages/java';
import cpp from 'highlight.js/lib/languages/cpp';
import go from 'highlight.js/lib/languages/go';
import rust from 'highlight.js/lib/languages/rust';
import json from 'highlight.js/lib/languages/json';
import yaml from 'highlight.js/lib/languages/yaml';
import bash from 'highlight.js/lib/languages/bash';
import xml from 'highlight.js/lib/languages/xml';
import css from 'highlight.js/lib/languages/css';

const { Text } = Typography;

// 注册语言
hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('typescript', typescript);
hljs.registerLanguage('python', python);
hljs.registerLanguage('java', java);
hljs.registerLanguage('cpp', cpp);
hljs.registerLanguage('go', go);
hljs.registerLanguage('rust', rust);
hljs.registerLanguage('json', json);
hljs.registerLanguage('yaml', yaml);
hljs.registerLanguage('bash', bash);
hljs.registerLanguage('xml', xml);
hljs.registerLanguage('html', xml);
hljs.registerLanguage('css', css);

interface CodeBlockProps {
  code: string;
  language?: string;
  fileName?: string;
  showLineNumbers?: boolean;
  maxHeight?: number;
}

export default function CodeBlock({
  code,
  language = 'text',
  fileName,
  showLineNumbers = true,
  maxHeight = 500,
}: CodeBlockProps) {
  const codeRef = useRef<HTMLElement>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (codeRef.current) {
      // 应用语法高亮
      hljs.highlightElement(codeRef.current);
    }
  }, [code, language]);

  /**
   * 复制代码到剪贴板
   */
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      message.success('代码已复制');

      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (error) {
      message.error('复制失败');
      console.error('Failed to copy code:', error);
    }
  };

  return (
    <div className="code-block-container">
      {/* Header */}
      {fileName && (
        <div className="code-block-header">
          <Text code>{fileName}</Text>
          <Button
            type="text"
            size="small"
            icon={copied ? <CheckOutlined /> : <CopyOutlined />}
            onClick={handleCopy}
          >
            {copied ? '已复制' : '复制'}
          </Button>
        </div>
      )}

      {/* Code Content */}
      <div className="code-block-content" style={{ maxHeight: `${maxHeight}px` }}>
        <pre className={showLineNumbers ? 'line-numbers' : ''}>
          <code ref={codeRef} className={`language-${language}`}>
            {code}
          </code>
        </pre>
      </div>

      {/* Copy Button (absolute positioned if no header) */}
      {!fileName && (
        <Button
          type="text"
          size="small"
          icon={copied ? <CheckOutlined /> : <CopyOutlined />}
          onClick={handleCopy}
          style={{
            position: 'absolute',
            top: '8px',
            right: '8px',
            zIndex: 1,
          }}
        >
          {copied ? '已复制' : '复制'}
        </Button>
      )}

      <style jsx>{`
        .code-block-container {
          position: relative;
          border: 1px solid #d9d9d9;
          border-radius: 4px;
          overflow: hidden;
          margin: 16px 0;
        }

        .code-block-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 12px;
          background: #fafafa;
          border-bottom: 1px solid #d9d9d9;
        }

        .code-block-content {
          overflow: auto;
          background: #f6f8fa;
        }

        .code-block-content pre {
          margin: 0;
          padding: 16px;
          background: transparent;
        }

        .code-block-content code {
          font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', monospace;
          font-size: 13px;
          line-height: 1.6;
        }

        /* Line numbers */
        .code-block-content pre.line-numbers {
          padding-left: 3.8em;
          position: relative;
        }

        .code-block-content pre.line-numbers code {
          counter-reset: line;
          display: block;
        }

        .code-block-content pre.line-numbers code::before {
          content: '';
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 3.5em;
          background: #f0f0f0;
          border-right: 1px solid #d9d9d9;
        }
      `}</style>
    </div>
  );
}
