# Story 2.4: 学习路径生成服务

## 📋 Story 元信息

- **Story ID**: STORY-2.4
- **Epic**: MVP v0.1
- **所属迭代**: 迭代 2 - 真实服务集成
- **状态**: Draft
- **优先级**: Medium
- **预估时间**: 1-2 天
- **负责人**: Dev Agent
- **依赖**: STORY-2.3 (RAG 教程生成服务)

---

## 📖 User Story

**As a** 用户
**I want** 系统能够根据我的学习进度生成个性化的学习路径
**So that** 我可以按照最优顺序学习仓库内容，并获得针对性的下一步建议

---

## 🎯 背景与上下文

### 项目上下文
在 Story 2.3 完成教程生成后，本 Story 需要为用户提供智能化的学习路径规划功能：
1. 根据教程结构（modules, steps）生成推荐的学习顺序
2. 基于用户的学习进度（已完成的 steps），推荐下一步学习内容
3. 提供学习路径可视化数据（用于前端展示进度）
4. （可选）根据用户背景（如技能水平）调整难度顺序

### 技术上下文
- **输入**: TutorialData + 用户学习进度（completedStepIds）
- **输出**: LearningPath（推荐顺序、下一步建议、完成度统计）
- **算法**:
  - MVP: 基于 modules 的顺序依赖（简单规则）
  - 未来: LLM 辅助的个性化路径规划
- **存储**: 学习进度存储在前端 localStorage（MVP）或后端数据库（未来）

### 迭代目标
实现基础的学习路径生成逻辑，支持前端进度追踪和下一步建议。

---

## ✅ 验收标准

### 功能性需求

1. **AC-2.4.1**: 学习路径生成服务能够分析教程结构
   - 识别 modules 的依赖关系（通过顺序隐含依赖）
   - 计算每个 module 的预估学习时间（基于 steps 数量）
   - 生成推荐的学习顺序列表

2. **AC-2.4.2**: 提供下一步建议功能
   - 输入: 已完成的 stepIds 列表
   - 输出: 下一个应该学习的 step + 所属 module
   - 逻辑: 按照 module 顺序，返回当前 module 未完成的第一个 step
   - 如果当前 module 全部完成，自动推进到下一个 module

3. **AC-2.4.3**: 计算学习进度统计
   ```typescript
   interface LearningProgress {
     totalSteps: number;
     completedSteps: number;
     completionPercentage: number;
     currentModule: {
       id: string;
       title: string;
       progress: number;  // 0-100
     };
     nextStep: Step | null;
   }
   ```

4. **AC-2.4.4**: 支持 module 级别的状态计算
   - `notStarted`: 未开始（0 steps 完成）
   - `inProgress`: 进行中（部分 steps 完成）
   - `completed`: 已完成（所有 steps 完成）

5. **AC-2.4.5**: API 端点设计符合规范
   ```
   GET /api/learning-path/{repo_owner}/{repo_name}
   Query: completedStepIds=step1,step2,step3
   Response: {
     "ok": true,
     "data": {
       "progress": { /* LearningProgress */ },
       "recommendedOrder": ["module-1", "module-2", ...],
       "moduleStats": [...]
     }
   }
   ```

6. **AC-2.4.6**: 支持重置学习进度
   ```
   POST /api/learning-path/{repo_owner}/{repo_name}/reset
   Response: { "ok": true }
   ```

7. **AC-2.4.7**: 生成学习路径元数据
   - 预估总学习时间（基于 steps 数量，如每个 step 平均 5 分钟）
   - 难度评级（基于 prerequisites 复杂度，MVP 使用固定值）
   - 知识图谱（modules 之间的依赖关系，MVP 使用线性依赖）

8. **AC-2.4.8**: 错误处理
   - 教程不存在: 返回 404
   - 无效的 stepId: 忽略并记录日志
   - 数据不一致: 返回默认值并记录警告

### 质量需求

9. **AC-2.4.9**: 性能满足要求
   - 计算学习路径 ≤ 100ms
   - 支持并发请求（无状态设计）

10. **AC-2.4.10**: 单元测试覆盖率 ≥ 80%
    - 测试进度计算逻辑
    - 测试下一步推荐逻辑
    - 测试边界情况（空进度、全部完成等）

11. **AC-2.4.11**: 代码符合项目规范
    - 遵循 `coding-standards.md`
    - 使用 Type Hints
    - 使用 Pydantic 进行数据验证

---

## 🔧 技术实现任务

### Task 1: 设计数据模型和 Schemas
**预估**: 30 分钟

在 `backend/app/schemas/` 中创建学习路径数据模型：

```python
# backend/app/schemas/learning_path.py
from typing import List, Literal, Optional
from pydantic import BaseModel, Field

class ModuleStatus(BaseModel):
    """模块状态"""
    id: str
    title: str
    status: Literal["notStarted", "inProgress", "completed"]
    progress: float = Field(..., ge=0, le=100, description="完成百分比")
    totalSteps: int
    completedSteps: int

class NextStepRecommendation(BaseModel):
    """下一步推荐"""
    step: Optional[dict] = None  # Step 对象
    module: Optional[dict] = None  # 所属 Module

class LearningProgress(BaseModel):
    """学习进度"""
    totalSteps: int
    completedSteps: int
    completionPercentage: float = Field(..., ge=0, le=100)
    currentModule: Optional[ModuleStatus] = None
    nextStep: Optional[dict] = None

class LearningPathMetadata(BaseModel):
    """学习路径元数据"""
    estimatedMinutes: int = Field(..., description="预估学习时间（分钟）")
    difficulty: Literal["beginner", "intermediate", "advanced"] = "intermediate"
    recommendedOrder: List[str] = Field(..., description="推荐的 module 学习顺序")

class LearningPathResponse(BaseModel):
    """学习路径响应"""
    progress: LearningProgress
    metadata: LearningPathMetadata
    moduleStats: List[ModuleStatus]
```

---

### Task 2: 实现学习路径计算服务
**预估**: 2.5 小时

创建 `backend/app/services/learning_path.py`:

```python
from typing import List, Set, Optional, Dict
import structlog
from app.schemas.tutorial import TutorialData, Module, Step
from app.schemas.learning_path import (
    LearningProgress,
    LearningPathMetadata,
    ModuleStatus,
    LearningPathResponse
)

logger = structlog.get_logger()

class LearningPathService:
    """学习路径计算服务"""

    MINUTES_PER_STEP = 5  # 每个 step 平均 5 分钟

    def __init__(self):
        pass

    def calculate_learning_path(
        self,
        tutorial: TutorialData,
        completed_step_ids: Set[str]
    ) -> LearningPathResponse:
        """计算学习路径"""

        # 1. 构建 step ID 到 step 对象的映射
        step_map: Dict[str, Step] = {
            step.id: step for step in tutorial.steps
        }

        # 2. 计算 module 统计
        module_stats = self._calculate_module_stats(
            tutorial.modules,
            step_map,
            completed_step_ids
        )

        # 3. 计算总体进度
        total_steps = len(tutorial.steps)
        completed_steps = len(completed_step_ids)
        completion_percentage = (
            (completed_steps / total_steps * 100) if total_steps > 0 else 0
        )

        # 4. 找到当前 module 和下一步
        current_module, next_step = self._find_next_step(
            tutorial.modules,
            step_map,
            completed_step_ids,
            module_stats
        )

        # 5. 构建进度对象
        progress = LearningProgress(
            totalSteps=total_steps,
            completedSteps=completed_steps,
            completionPercentage=round(completion_percentage, 1),
            currentModule=current_module,
            nextStep=next_step.dict() if next_step else None
        )

        # 6. 生成元数据
        metadata = LearningPathMetadata(
            estimatedMinutes=total_steps * self.MINUTES_PER_STEP,
            difficulty=self._estimate_difficulty(tutorial),
            recommendedOrder=[m.id for m in tutorial.modules]
        )

        logger.info(
            "learning_path_calculated",
            repo=f"{tutorial.repo.owner}/{tutorial.repo.name}",
            total_steps=total_steps,
            completed=completed_steps,
            completion=f"{completion_percentage:.1f}%"
        )

        return LearningPathResponse(
            progress=progress,
            metadata=metadata,
            moduleStats=module_stats
        )

    def _calculate_module_stats(
        self,
        modules: List[Module],
        step_map: Dict[str, Step],
        completed_step_ids: Set[str]
    ) -> List[ModuleStatus]:
        """计算每个 module 的统计信息"""
        stats = []

        for module in modules:
            total_steps = len(module.stepIds)
            completed_steps = sum(
                1 for step_id in module.stepIds
                if step_id in completed_step_ids
            )

            progress = (
                (completed_steps / total_steps * 100) if total_steps > 0 else 0
            )

            # 判断状态
            if completed_steps == 0:
                status = "notStarted"
            elif completed_steps == total_steps:
                status = "completed"
            else:
                status = "inProgress"

            stats.append(ModuleStatus(
                id=module.id,
                title=module.title,
                status=status,
                progress=round(progress, 1),
                totalSteps=total_steps,
                completedSteps=completed_steps
            ))

        return stats

    def _find_next_step(
        self,
        modules: List[Module],
        step_map: Dict[str, Step],
        completed_step_ids: Set[str],
        module_stats: List[ModuleStatus]
    ) -> tuple[Optional[ModuleStatus], Optional[Step]]:
        """找到下一步和当前 module"""

        # 找到第一个未完成的 module
        for i, module in enumerate(modules):
            module_stat = module_stats[i]

            if module_stat.status == "completed":
                continue

            # 找到该 module 中第一个未完成的 step
            for step_id in module.stepIds:
                if step_id not in completed_step_ids:
                    next_step = step_map.get(step_id)
                    return module_stat, next_step

        # 所有 steps 都已完成
        return None, None

    def _estimate_difficulty(self, tutorial: TutorialData) -> str:
        """估算难度"""
        # MVP: 基于 prerequisites 数量简单判断
        prereq_count = len(tutorial.prerequisites)

        if prereq_count <= 2:
            return "beginner"
        elif prereq_count <= 4:
            return "intermediate"
        else:
            return "advanced"
```

**测试**: 创建 `backend/tests/test_learning_path.py`

示例测试:

```python
import pytest
from app.services.learning_path import LearningPathService
from app.schemas.tutorial import TutorialData, Module, Step, RepoInfo

def test_calculate_learning_path_empty_progress():
    """测试：无进度时的路径计算"""
    service = LearningPathService()

    tutorial = TutorialData(
        repo=RepoInfo(owner="test", name="repo", url="https://..."),
        overview="Test" * 50,
        prerequisites=["Node.js", "Git"],
        structure={"directories": [], "files": []},
        modules=[
            Module(
                id="m1",
                title="Module 1",
                description="Desc",
                stepIds=["s1", "s2"]
            ),
            Module(
                id="m2",
                title="Module 2",
                description="Desc",
                stepIds=["s3"]
            )
        ],
        steps=[
            Step(id="s1", title="Step 1", description="Desc 1"),
            Step(id="s2", title="Step 2", description="Desc 2"),
            Step(id="s3", title="Step 3", description="Desc 3")
        ]
    )

    result = service.calculate_learning_path(tutorial, set())

    assert result.progress.totalSteps == 3
    assert result.progress.completedSteps == 0
    assert result.progress.completionPercentage == 0.0
    assert result.progress.currentModule.id == "m1"
    assert result.progress.nextStep["id"] == "s1"

    assert len(result.moduleStats) == 2
    assert result.moduleStats[0].status == "notStarted"
    assert result.moduleStats[1].status == "notStarted"

def test_calculate_learning_path_partial_progress():
    """测试：部分进度"""
    # ... similar structure ...
    completed = {"s1"}

    result = service.calculate_learning_path(tutorial, completed)

    assert result.progress.completedSteps == 1
    assert result.progress.completionPercentage == 33.3
    assert result.progress.currentModule.id == "m1"
    assert result.progress.nextStep["id"] == "s2"

    assert result.moduleStats[0].status == "inProgress"
    assert result.moduleStats[0].progress == 50.0
```

---

### Task 3: 创建 API 路由
**预估**: 1 小时

创建 `backend/app/api/routes/learning_path.py`:

```python
from fastapi import APIRouter, HTTPException, Query
from typing import List
from app.schemas.learning_path import LearningPathResponse
from app.services.learning_path import LearningPathService
from app.services.tutorial_generation import TutorialGenerationService

router = APIRouter(prefix="/api/learning-path", tags=["learning-path"])

learning_path_service = LearningPathService()
tutorial_service = TutorialGenerationService()

@router.get("/{owner}/{repo}", response_model=dict)
async def get_learning_path(
    owner: str,
    repo: str,
    completedStepIds: str = Query("", description="Comma-separated step IDs")
):
    """获取学习路径"""
    try:
        # 1. 获取教程数据
        cache_key = f"{owner}:{repo}"
        tutorial = tutorial_service.cache.get(cache_key)

        if not tutorial:
            raise HTTPException(
                status_code=404,
                detail=f"Tutorial not found for {owner}/{repo}. Generate tutorial first."
            )

        # 2. 解析已完成的 step IDs
        completed_ids = set()
        if completedStepIds:
            completed_ids = set(completedStepIds.split(","))

        # 3. 计算学习路径
        learning_path = learning_path_service.calculate_learning_path(
            tutorial,
            completed_ids
        )

        return {
            "ok": True,
            "data": learning_path.dict()
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{owner}/{repo}/reset", response_model=dict)
async def reset_learning_progress(owner: str, repo: str):
    """重置学习进度"""
    # MVP: 前端负责清除 localStorage，此接口仅作占位
    return {
        "ok": True,
        "message": "Progress reset. Clear localStorage on client side."
    }

@router.get("/{owner}/{repo}/stats", response_model=dict)
async def get_learning_stats(owner: str, repo: str):
    """获取学习统计（不含进度）"""
    try:
        cache_key = f"{owner}:{repo}"
        tutorial = tutorial_service.cache.get(cache_key)

        if not tutorial:
            raise HTTPException(status_code=404, detail="Tutorial not found")

        # 返回基础统计
        return {
            "ok": True,
            "data": {
                "totalModules": len(tutorial.modules),
                "totalSteps": len(tutorial.steps),
                "estimatedMinutes": len(tutorial.steps) * 5,
                "difficulty": "intermediate"  # 可调用 service 计算
            }
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

在 `backend/app/api/router.py` 中注册路由：

```python
from app.api.routes import learning_path

api_router.include_router(learning_path.router)
```

---

### Task 4: 前端集成更新（可选，取决于前端开发状态）
**预估**: 1 小时

如果前端已完成 Story 1.3，更新 `frontend/src/lib/api.ts`:

```typescript
// 添加学习路径 API
export async function getLearningPath(
  owner: string,
  repo: string,
  completedStepIds: string[]
): Promise<LearningPathResponse> {
  const params = new URLSearchParams();
  if (completedStepIds.length > 0) {
    params.set('completedStepIds', completedStepIds.join(','));
  }

  const response = await fetch(
    `${API_BASE_URL}/learning-path/${owner}/${repo}?${params}`
  );

  if (!response.ok) {
    throw new Error('Failed to fetch learning path');
  }

  const data = await response.json();
  return data.data;
}

export async function resetLearningProgress(
  owner: string,
  repo: string
): Promise<void> {
  await fetch(
    `${API_BASE_URL}/learning-path/${owner}/${repo}/reset`,
    { method: 'POST' }
  );
}
```

在 `useLearningProgress` hook 中调用:

```typescript
// frontend/src/hooks/useLearningProgress.ts
import { getLearningPath } from '@/lib/api';

export function useLearningProgress(repoUrl: string) {
  const [pathData, setPathData] = useState<LearningPathResponse | null>(null);

  useEffect(() => {
    const fetchPath = async () => {
      const { owner, repo } = parseRepoUrl(repoUrl);
      const completed = Array.from(completedSteps);  // 从 state 获取

      const data = await getLearningPath(owner, repo, completed);
      setPathData(data);
    };

    fetchPath();
  }, [repoUrl, completedSteps]);

  return { ...pathData };
}
```

---

### Task 5: 单元测试
**预估**: 1.5 小时

创建测试文件：
- `backend/tests/test_learning_path.py`: 测试核心计算逻辑
- `backend/tests/test_learning_path_api.py`: 测试 API 端点

运行测试:
```bash
cd backend
poetry run pytest tests/ -v --cov=app.services.learning_path --cov-report=term-missing
```

---

### Task 6: 集成测试
**预估**: 1 小时

创建 `backend/tests/integration/test_learning_path_e2e.py`:

```python
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_learning_path_e2e(setup_test_tutorial):
    """端到端测试：学习路径计算"""

    # 假设 setup_test_tutorial fixture 已创建教程

    # 1. 获取学习路径（无进度）
    response = client.get("/api/learning-path/octocat/Hello-World")
    assert response.status_code == 200
    data = response.json()["data"]

    assert data["progress"]["totalSteps"] > 0
    assert data["progress"]["completedSteps"] == 0
    assert data["progress"]["nextStep"] is not None

    # 2. 获取学习路径（有进度）
    step_id = data["progress"]["nextStep"]["id"]
    response = client.get(
        f"/api/learning-path/octocat/Hello-World?completedStepIds={step_id}"
    )
    assert response.status_code == 200
    data2 = response.json()["data"]

    assert data2["progress"]["completedSteps"] == 1
    assert data2["progress"]["nextStep"]["id"] != step_id  # 应该是下一个 step

    # 3. 重置进度
    response = client.post("/api/learning-path/octocat/Hello-World/reset")
    assert response.status_code == 200
```

---

### Task 7: 文档更新
**预估**: 30 分钟

更新 `backend/README.md`:

```markdown
## 学习路径服务

### 获取学习路径

**GET** `/api/learning-path/{owner}/{repo}`

Query Parameters:
- `completedStepIds`: 已完成的 step IDs（逗号分隔）

Response:
\`\`\`json
{
  "ok": true,
  "data": {
    "progress": {
      "totalSteps": 20,
      "completedSteps": 5,
      "completionPercentage": 25.0,
      "currentModule": {
        "id": "module-2",
        "title": "Core Concepts",
        "status": "inProgress",
        "progress": 50.0
      },
      "nextStep": {
        "id": "step-6",
        "title": "Understanding State",
        "description": "..."
      }
    },
    "metadata": {
      "estimatedMinutes": 100,
      "difficulty": "intermediate",
      "recommendedOrder": ["module-1", "module-2", "module-3"]
    },
    "moduleStats": [...]
  }
}
\`\`\`

### 重置学习进度

**POST** `/api/learning-path/{owner}/{repo}/reset`

Response:
\`\`\`json
{
  "ok": true,
  "message": "Progress reset..."
}
\`\`\`
```

---

## 🚨 风险与依赖

### 风险评估

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|----------|
| 前端未完成 Story 1.3 | 低 | 低 | API 设计向后兼容，前端可后续集成 |
| 学习路径算法过于简单 | 中 | 中 | MVP 使用线性顺序，后续可引入 LLM 优化 |
| 数据不一致（stepId 引用错误）| 低 | 中 | 输入验证和错误处理 |

### 依赖关系

**前置依赖**:
- STORY-2.3: RAG 教程生成服务（需要 TutorialData）
- STORY-1.3: 学习路径 UI（前端集成，可并行开发）

**后续依赖**:
- 无

---

## ✅ Definition of Done

- [ ] 所有 11 个验收标准通过
- [ ] 单元测试覆盖率 ≥ 80%
- [ ] 集成测试通过
- [ ] API 文档更新
- [ ] 代码符合 `coding-standards.md` 规范
- [ ] Code Review 通过
- [ ] 性能测试：计算学习路径 ≤ 100ms
- [ ] 前端集成验证（如果 Story 1.3 已完成）
- [ ] 日志记录完善

---

## 📝 Dev Agent Record

### 开发日志

**时间**: YYYY-MM-DD
**开发者**: Dev Agent

#### 进展
- [ ] Task 1: 数据模型设计
- [ ] Task 2: 学习路径计算服务
- [ ] Task 3: API 路由
- [ ] Task 4: 前端集成（可选）
- [ ] Task 5-7: 测试、文档

#### 技术决策
- 算法选择: 线性顺序（MVP），未来可升级为 LLM 辅助推荐
- 进度存储: 前端 localStorage（MVP），后端无状态
- 难度评估: 基于 prerequisites 数量（简化版）

#### 遇到的问题
_(记录实际开发中遇到的问题和解决方案)_

#### 测试结果
_(记录测试覆盖率和性能指标)_

---

## 🔗 相关文档

- [Epic: MVP v0.1](./epic-mvp-v0.1.md)
- [Story 2.3: RAG 教程生成](./story-2.3-rag-tutorial-generation.md)
- [Story 1.3: 学习路径 UI](./story-1.3-learning-path-ui.md)
- [架构文档](../architecture.md)
- [UX 规格](../ux/ux-spec.md)
- [编码规范](../architecture/coding-standards.md)
