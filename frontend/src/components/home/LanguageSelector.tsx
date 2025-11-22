/**
 * LanguageSelector Component
 * 语言选择器组件
 */

'use client';

import { Radio, Space, Typography } from 'antd';
import type { RadioChangeEvent } from 'antd';

const { Text } = Typography;

export type Language = 'zh-CN' | 'en-US';

interface LanguageSelectorProps {
  value: Language;
  onChange: (language: Language) => void;
  disabled?: boolean;
}

const LANGUAGE_OPTIONS = [
  { label: '中文', value: 'zh-CN' as Language },
  { label: 'English', value: 'en-US' as Language },
];

export default function LanguageSelector({
  value,
  onChange,
  disabled = false,
}: LanguageSelectorProps) {
  const handleChange = (e: RadioChangeEvent) => {
    onChange(e.target.value as Language);
  };

  return (
    <div className="language-selector">
      <Space direction="vertical" size="small" style={{ width: '100%' }}>
        <Text type="secondary">教程语言</Text>
        <Radio.Group
          options={LANGUAGE_OPTIONS}
          onChange={handleChange}
          value={value}
          disabled={disabled}
          optionType="button"
          buttonStyle="solid"
        />
      </Space>

      <style jsx>{`
        .language-selector {
          width: 100%;
        }
      `}</style>
    </div>
  );
}
