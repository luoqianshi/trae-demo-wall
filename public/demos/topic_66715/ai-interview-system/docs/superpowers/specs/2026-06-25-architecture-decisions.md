# ADR-001: 纯前端跨标签页通信方案

## Status
Accepted

## Context
TACE大赛项目为纯前端静态HTML，无后端服务。管理端和学生端需要在不同浏览器标签页中运行，但业务流程要求：
- 管理端创建面试场次 → 学生端通知列表实时更新
- 学生端完成面试/AI检测 → 管理端审核列表实时更新
- 面试官评分 → 学生端结果页更新

## Decision
使用 `localStorage` + `window.addEventListener('storage', ...)` 事件实现跨标签页通信。

## Mechanism
```javascript
// 写入方（任意标签页）
DataStore.set('student_status_STU001_INT001', { status: 'interview', updatedAt: Date.now() });

// 监听方（其他标签页）
window.addEventListener('storage', (e) => {
  if (e.key.startsWith('ai_interview_')) {
    // 处理状态变更
  }
});
```

## Data Flow Keys
| Key Pattern | Writer | Reader | Description |
|-------------|--------|--------|-------------|
| `allInterviews` | Admin | Both | 面试场次列表 |
| `interview_{id}` | Admin | Student | 单场次详情(含TRTC房间号) |
| `student_status_{stuId}_{intId}` | Both | Both | 学生面试状态 |
| `ai_result_{stuId}_{intId}` | Student(AI) | Admin | AI检测结果 |
| `score_{stuId}_{intId}` | Admin | Both | 面试官评分 |
| `review_{stuId}_{intId}` | Admin | Both | 人工复核结果 |

## Alternatives Considered
- **BroadcastChannel API**: 更现代，但IE不支持（虽非问题），且需要额外polyfill
- **SharedWorker**: 复杂度高，不适合纯静态项目
- **轮询localStorage**: 浪费资源，不如事件驱动

## Consequences
- Positive: 零依赖、浏览器原生支持、实时响应
- Negative: 仅限同源标签页、无法跨设备、数据量受限（~5MB）
- Trade-off: 对于比赛演示场景完全够用

---

# ADR-002: 两种面试模式的状态机设计

## Status
Accepted

## Context
系统支持两种面试模式，每种有不同的阶段流程：

**自助测评模式 (self_service)**:
check → self-record → self-detect → self-result

**安排面试模式 (scheduled)**:
check → waiting → interview → guide(overlay) → ended

## Decision
使用单一 `phase` 变量管理所有阶段，通过 `mode` 字段区分模式。`student-video.html` 根据 `mode` 渲染不同的UI流程。

## State Machine
```
mode: 'self_service'
  check ──[开始录制]──→ self-record ──[停止录制]──→ self-detect ──[完成]──→ self-result

mode: 'scheduled'
  check ──[进入等候室]──→ waiting ──[准备就绪]──→ interview ──[挂断]──→ ended
                                              │
                                              └──[10秒后]──→ guide(overlay, 20秒后自动关闭)
```

## Data Structure
```javascript
// 面试场次
{
  id: 'INT001',
  title: '...',
  mode: 'scheduled' | 'self_service',
  major: '汽车维修',
  date: '2026-06-25',
  time: '09:00-12:00',
  interviewer: { name: '刘老师', id: 'INTW001' },
  students: ['STU001', 'STU002'],
  status: 'upcoming' | 'ongoing' | 'completed',
  trtcRoomId: 'TRTC-20260625-001'
}

// 学生面试状态
{
  studentId: 'STU001',
  interviewId: 'INT001',
  status: 'pending' | 'check' | 'waiting' | 'interview' | 'ended',
  phase: 'check' | 'self-record' | 'self-detect' | 'self-result' | 'waiting' | 'interview' | 'ended',
  examCompleted: false,
  aiDetectionCompleted: false,
  scored: false,
  reviewed: false
}
```

---

# ADR-003: 管理端面试场次创建流程

## Status
Accepted

## Context
参考系统采用步骤式创建（基本信息 → 面试官分配 → 学生名单），当前TACE项目只有单表单。

## Decision
将创建流程改为3步向导式弹窗：

**Step 1 — 基本信息**: 标题、专业、日期、时间、模式(安排面试/自助测评)、描述
**Step 2 — 面试官分配**: 从预设面试官列表勾选（模拟数据）
**Step 3 — 学生名单**: 从已注册学生列表勾选，或手动输入学号添加

## Consequences
- Positive: 与参考系统一致，数据关联完整
- Negative: 创建流程更长，但比赛演示更完整

---

# ADR-004: AI检测区域设计

## Status
Accepted

## Context
参考系统检测10个身体区域（上肢6个+下肢4个），当前TACE项目只检测5个。

## Decision
扩展为10个检测区域，按上肢/下肢分组：

**上肢**: 左大臂、左小臂、左手腕、右大臂、右小臂、右手腕
**下肢**: 左小腿、左脚踝、右小腿、右脚踝

每个区域独立检测结果：通过/疑似/异常 + 置信度。

## Consequences
- Positive: 与参考系统一致，检测更细致
- Negative: UI更复杂，但展示效果更好
