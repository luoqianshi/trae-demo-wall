# 测试缺口补充实施计划

&gt; **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 补充核心功能的测试覆盖，特别是分数事件写入相关的测试，以确保重构后的代码不会出现回归问题。

**Architecture:** 采用 TDD 方式，先写测试验证现有行为，然后补充缺失的测试用例。遵循项目现有的 Vitest 测试模式。

**Tech Stack:** TypeScript, Next.js, Vitest, Local JSON DB

---

## 文件结构

| 文件 | 动作 | 职责 |
|------|------|------|
| `src/app/api/tasks/[id]/__tests__/route.test.ts` | 修改 | 添加测试 PATCH 任务完成时的分数事件写入 |
| `src/app/api/records/__tests__/route.test.ts` | 修改 | 添加测试 POST 记录创建时的分数事件写入，包括 skip_score 参数 |

---

### Task 1: 补充任务 PATCH 完成时分数事件测试

**Files:**
- Modify: `src/app/api/tasks/[id]/__tests__/route.test.ts`

- [ ] **Step 1: 在现有测试文件中添加分数事件 mock setup**

在文件顶部，更新 mock 以包含 score-engine 的 mock：

```typescript
const { mockAuthenticateRequest, mockCreateErrorResponse, mockCreateSuccessResponse, mockAddScoreEvent } = vi.hoisted(() => ({
  mockAuthenticateRequest: vi.fn(),
  mockCreateErrorResponse: vi.fn(),
  mockCreateSuccessResponse: vi.fn(),
  mockAddScoreEvent: vi.fn(),
}));

vi.mock('@/lib/api-auth', () => ({
  authenticateRequest: mockAuthenticateRequest,
  createErrorResponse: mockCreateErrorResponse,
  createSuccessResponse: mockCreateSuccessResponse,
}));

vi.mock('@/lib/quadrant-utils', () => ({
  calculateUrgency: vi.fn(() => 'medium'),
  calculateQuadrant: vi.fn(() => 2),
  DEFAULT_THRESHOLDS: {
    critical: 1,
    high: 3,
    medium: 7,
    low: 14,
    none: 30,
  },
}));

vi.mock('@/lib/score-engine', () => ({
  addScoreEvent: mockAddScoreEvent,
}));
```

- [ ] **Step 2: 在 beforeEach 中清理 mock**

在 beforeEach 块中，确保我们清理 mockAddScoreEvent：

```typescript
beforeEach(() => {
  vi.clearAllMocks();
  resetLocalDb();
  mockAuthenticateRequest.mockResolvedValue({
    success: true,
    context: { userId: '1' },
  });
  mockCreateErrorResponse.mockImplementation((msg: string, status: number = 500) =>
    new Response(JSON.stringify({ error: msg }), { status, headers: { 'Content-Type': 'application/json' } })
  );
  mockCreateSuccessResponse.mockImplementation((data: any) =>
    new Response(JSON.stringify(data), { status: 200, headers: { 'Content-Type': 'application/json' } })
  );
  mockAddScoreEvent.mockReturnValue({ id: 'test-event-id' });
});
```

- [ ] **Step 3: 添加新的测试套件 - PATCH 完成任务时写入分数事件**

在文件末尾添加新的测试套件：

```typescript
describe('PATCH /api/tasks/[id] - Score Event Writing', () => {
  it('should write TASK_NORMAL_COMPLETED event when normal task is completed', async () => {
    const task = createTask({ user_id: '1', title: 'Normal Task', task_type: 'normal' });

    const request = new Request(`http://localhost/api/tasks/${task.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'completed' }),
    });
    
    await PATCH(request as any, { params: Promise.resolve({ id: task.id }) });
    
    expect(mockAddScoreEvent).toHaveBeenCalledWith('1', 'TASK_NORMAL_COMPLETED', task.id);
  });

  it('should write TASK_QUICK_COMPLETED event when quick task is completed', async () => {
    const task = createTask({ user_id: '1', title: 'Quick Task', task_type: 'quick' });

    const request = new Request(`http://localhost/api/tasks/${task.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'completed' }),
    });
    
    await PATCH(request as any, { params: Promise.resolve({ id: task.id }) });
    
    expect(mockAddScoreEvent).toHaveBeenCalledWith('1', 'TASK_QUICK_COMPLETED', task.id);
  });

  it('should write BIG_TASK_COMPLETED event when big task is completed', async () => {
    const task = createTask({ user_id: '1', title: 'Big Task', task_type: 'big' });

    const request = new Request(`http://localhost/api/tasks/${task.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'completed' }),
    });
    
    await PATCH(request as any, { params: Promise.resolve({ id: task.id }) });
    
    expect(mockAddScoreEvent).toHaveBeenCalledWith('1', 'BIG_TASK_COMPLETED', task.id);
  });

  it('should write HABIT_CHECKIN event when habit task is completed', async () => {
    const task = createTask({ user_id: '1', title: 'Habit Task', task_type: 'habit' });

    const request = new Request(`http://localhost/api/tasks/${task.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'completed' }),
    });
    
    await PATCH(request as any, { params: Promise.resolve({ id: task.id }) });
    
    expect(mockAddScoreEvent).toHaveBeenCalledWith('1', 'HABIT_CHECKIN', task.id);
  });

  it('should write SUBTASK_COMPLETED event when subtask is completed', async () => {
    const parentTask = createTask({ user_id: '1', title: 'Parent Task', task_type: 'normal' });
    const subtask = createTask({ user_id: '1', title: 'Subtask', task_type: 'normal', parent_id: parentTask.id });

    const request = new Request(`http://localhost/api/tasks/${subtask.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'completed' }),
    });
    
    await PATCH(request as any, { params: Promise.resolve({ id: subtask.id }) });
    
    expect(mockAddScoreEvent).toHaveBeenCalledWith('1', 'SUBTASK_COMPLETED', subtask.id);
  });

  it('should NOT write score event when updating task without completing it', async () => {
    const task = createTask({ user_id: '1', title: 'Task', task_type: 'normal' });

    const request = new Request(`http://localhost/api/tasks/${task.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Updated Title' }),
    });
    
    await PATCH(request as any, { params: Promise.resolve({ id: task.id }) });
    
    expect(mockAddScoreEvent).not.toHaveBeenCalled();
  });

  it('should NOT write score event when completing task that was already completed', async () => {
    const task = createTask({ 
      user_id: '1', 
      title: 'Already Completed Task', 
      task_type: 'normal', 
      status: 'completed',
      completed_at: new Date().toISOString()
    });

    const request = new Request(`http://localhost/api/tasks/${task.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'completed' }),
    });
    
    await PATCH(request as any, { params: Promise.resolve({ id: task.id }) });
    
    expect(mockAddScoreEvent).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 4: 运行测试确认失败（因为我们先写测试）**

Run: `npm test -- src/app/api/tasks/[id]/__tests__/route.test.ts`
Expected: 新添加的测试可能失败，需要验证

- [ ] **Step 5: 运行测试确认现有测试仍然通过**

Run: `npm test -- src/app/api/tasks/[id]/__tests__/route.test.ts`
Expected: 所有测试（包括新添加的）都应该通过，因为功能已经实现

- [ ] **Step 6: 运行完整测试套件**

Run: `npm test`
Expected: 所有测试都应该通过

---

### Task 2: 补充记录 POST 时分数事件测试

**Files:**
- Modify: `src/app/api/records/__tests__/route.test.ts`

- [ ] **Step 1: 添加 POST 测试套件 - 记录创建与分数事件**

在现有的测试文件中，在 `describe('PATCH /api/records'` 之前添加新的测试套件：

```typescript
describe('POST /api/records', () => {
  it('should return 401 when authentication fails', async () => {
    mockAuthenticateRequest.mockResolvedValueOnce({
      success: false,
      error: 'Authentication failed',
      statusCode: 401,
    });
    const { POST } = await import('../route');
    const request = new Request('http://localhost/api/records', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: 'Test record' }),
    });
    const response = await POST(request as any);
    expect(response.status).toBe(401);
  });

  it('should return 400 when content is missing', async () => {
    const { POST } = await import('../route');
    const request = new Request('http://localhost/api/records', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    const response = await POST(request as any);
    expect(response.status).toBe(400);
  });

  it('should create record successfully with default values', async () => {
    const { POST } = await import('../route');
    const request = new Request('http://localhost/api/records', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: 'Test record content' }),
    });
    const response = await POST(request as any);
    expect(response.status).toBe(201);
    const data = await response.json();
    expect(data.record).toHaveProperty('id');
    expect(data.record.content).toBe('Test record content');
  });

  it('should write RECORD_CREATED score event by default', async () => {
    const { POST } = await import('../route');
    const request = new Request('http://localhost/api/records', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: 'Test record content' }),
    });
    await POST(request as any);
    
    expect(mockAddScoreEvent).toHaveBeenCalledWith('1', 'RECORD_CREATED');
  });

  it('should NOT write score event when skip_score is true', async () => {
    const { POST } = await import('../route');
    const request = new Request('http://localhost/api/records', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        content: 'Test record content', 
        skip_score: true 
      }),
    });
    await POST(request as any);
    
    expect(mockAddScoreEvent).not.toHaveBeenCalled();
  });

  it('should write score event when skip_score is false', async () => {
    const { POST } = await import('../route');
    const request = new Request('http://localhost/api/records', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        content: 'Test record content', 
        skip_score: false 
      }),
    });
    await POST(request as any);
    
    expect(mockAddScoreEvent).toHaveBeenCalledWith('1', 'RECORD_CREATED');
  });

  it('should create record with custom type and tags', async () => {
    const { POST } = await import('../route');
    const request = new Request('http://localhost/api/records', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        content: 'Test record content',
        type: 'insight',
        tags: ['tag1', 'tag2'],
        mood: 'proud'
      }),
    });
    const response = await POST(request as any);
    expect(response.status).toBe(201);
    const data = await response.json();
    expect(data.record.record_type).toBe('insight');
    expect(data.record.tags).toEqual(['tag1', 'tag2']);
    expect(data.record.mood).toBe('proud');
  });

  it('should return 400 for invalid record type', async () => {
    const { POST } = await import('../route');
    const request = new Request('http://localhost/api/records', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        content: 'Test record content',
        type: 'invalid-type'
      }),
    });
    const response = await POST(request as any);
    expect(response.status).toBe(400);
  });

  it('should return 400 for invalid mood', async () => {
    const { POST } = await import('../route');
    const request = new Request('http://localhost/api/records', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        content: 'Test record content',
        mood: 'invalid-mood'
      }),
    });
    const response = await POST(request as any);
    expect(response.status).toBe(400);
  });
});
```

- [ ] **Step 2: 运行测试确认失败（因为我们先写测试）**

Run: `npm test -- src/app/api/records/__tests__/route.test.ts`
Expected: 新添加的测试应该通过，因为功能已经实现

- [ ] **Step 3: 运行完整测试套件**

Run: `npm test`
Expected: 所有测试都应该通过

---

### Task 3: 最终验证与总结

**Files:**
- N/A

- [ ] **Step 1: 完整运行所有测试**

Run: `npm test`
Expected: 所有测试通过，包括新补充的测试用例

- [ ] **Step 2: 总结补充的测试内容**

在项目根目录创建总结文档，记录本次补充的测试覆盖范围。
