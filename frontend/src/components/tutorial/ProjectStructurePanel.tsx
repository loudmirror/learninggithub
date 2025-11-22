/**
 * ProjectStructurePanel Component
 * 项目结构面板组件
 */

'use client';

import { Card, Tree, Typography, Space } from 'antd';
import { FolderOutlined, FileOutlined, FolderOpenOutlined } from '@ant-design/icons';
import type { DataNode } from 'antd/es/tree';
import type { RepositoryStructure, FileNode } from '@/types/tutorial';

const { Text, Paragraph } = Typography;

interface ProjectStructurePanelProps {
  structure: RepositoryStructure;
}

/**
 * 将 FileNode 转换为 Ant Design Tree 的 DataNode
 */
function convertToTreeData(nodes: FileNode[]): DataNode[] {
  return nodes.map((node) => ({
    title: node.name,
    key: node.path,
    icon: node.type === 'directory' ? <FolderOutlined /> : <FileOutlined />,
    children: node.children ? convertToTreeData(node.children) : undefined,
    isLeaf: node.type === 'file',
  }));
}

export default function ProjectStructurePanel({ structure }: ProjectStructurePanelProps) {
  const treeData = convertToTreeData(structure.rootDirectories);

  return (
    <Card
      title={
        <>
          <FolderOpenOutlined /> 项目结构
        </>
      }
      bordered={false}
    >
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* Directory Tree */}
        <div style={{ background: '#fafafa', padding: '16px', borderRadius: '4px' }}>
          <Tree
            showIcon
            defaultExpandAll={false}
            defaultExpandedKeys={structure.rootDirectories.map((dir) => dir.path)}
            treeData={treeData}
            height={400}
            style={{ background: 'transparent' }}
          />
        </div>

        {/* Key Files */}
        {structure.keyFiles && structure.keyFiles.length > 0 && (
          <div>
            <Text strong style={{ fontSize: '15px' }}>
              关键文件说明:
            </Text>
            <div style={{ marginTop: '12px' }}>
              {structure.keyFiles.map((file, index) => (
                <div key={index} style={{ marginBottom: '12px' }}>
                  <Text code style={{ fontSize: '13px' }}>
                    {file.path}
                  </Text>
                  <Paragraph
                    type="secondary"
                    style={{ marginTop: '4px', marginBottom: 0, paddingLeft: '8px' }}
                  >
                    {file.description}
                  </Paragraph>
                </div>
              ))}
            </div>
          </div>
        )}
      </Space>
    </Card>
  );
}
