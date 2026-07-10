import { describe, it, expect, beforeEach, vi } from 'vitest';

const { mockAuthenticateRequest, mockCreateErrorResponse, mockCreateSuccessResponse } = vi.hoisted(() => ({
  mockAuthenticateRequest: vi.fn(),
  mockCreateErrorResponse: vi.fn(),
  mockCreateSuccessResponse: vi.fn(),
}));

vi.mock('@/lib/api-auth', () => ({
  authenticateRequest: mockAuthenticateRequest,
  createErrorResponse: mockCreateErrorResponse,
  createSuccessResponse: mockCreateSuccessResponse,
}));

import { resetData } from '@/lib/local-db';

beforeEach(() => {
  vi.clearAllMocks();
  resetData();
  mockAuthenticateRequest.mockResolvedValue({
    success: true,
    context: { userId: 'test-user-id' },
  });
  mockCreateErrorResponse.mockImplementation((msg: string, status: number) =>
    new Response(JSON.stringify({ error: msg }), { status, headers: { 'Content-Type': 'application/json' } })
  );
  mockCreateSuccessResponse.mockImplementation((data: any) =>
    new Response(JSON.stringify(data), { status: 200, headers: { 'Content-Type': 'application/json' } })
  );
});

describe('GET /api/challenges', () => {
  it('returns challenge list with mock data', async () => {
    const { GET } = await import('../route');
    const request = new Request('http://localhost/api/challenges');
    (request as any).nextUrl = new URL('http://localhost/api/challenges');
    const response = await GET(request as any);
    expect(response).toBeDefined();
    const data = await response.json();
    expect(data).toHaveProperty('challenges');
  });

  it('returns challenges with type field mapped from challenge_type', async () => {
    const { GET } = await import('../route');
    const request = new Request('http://localhost/api/challenges');
    (request as any).nextUrl = new URL('http://localhost/api/challenges');
    const response = await GET(request as any);
    const data = await response.json();
    
    expect(data.challenges.length).toBeGreaterThan(0);
    data.challenges.forEach((challenge: any) => {
      expect(challenge).toHaveProperty('type');
      expect(challenge).toHaveProperty('challenge_type');
      expect(challenge.type).toEqual(challenge.challenge_type);
      expect(['bronze', 'silver', 'gold']).toContain(challenge.type);
    });
  });

  it('returns user_challenges with type field on nested challenge', async () => {
    const { GET, POST } = await import('../route');
    
    // First join a challenge
    const postRequest = new Request('http://localhost/api/challenges', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ challenge_id: 'challenge_1' }),
    });
    await POST(postRequest);
    
    // Then get challenges
    const getRequest = new Request('http://localhost/api/challenges');
    (getRequest as any).nextUrl = new URL('http://localhost/api/challenges');
    const response = await GET(getRequest as any);
    const data = await response.json();
    
    expect(data.user_challenges.length).toBeGreaterThan(0);
    data.user_challenges.forEach((userChallenge: any) => {
      if (userChallenge.challenge) {
        expect(userChallenge.challenge).toHaveProperty('type');
        expect(userChallenge.challenge).toHaveProperty('challenge_type');
        expect(userChallenge.challenge.type).toEqual(userChallenge.challenge.challenge_type);
      }
    });
  });

  it('supports difficulty filter parameter', async () => {
    const { GET } = await import('../route');
    const request = new Request('http://localhost/api/challenges?difficulty=bronze');
    (request as any).nextUrl = new URL('http://localhost/api/challenges?difficulty=bronze');
    const response = await GET(request as any);
    expect(response).toBeDefined();
  });

  it('supports category filter parameter', async () => {
    const { GET } = await import('../route');
    const request = new Request('http://localhost/api/challenges?category=emotion');
    (request as any).nextUrl = new URL('http://localhost/api/challenges?category=emotion');
    const response = await GET(request as any);
    expect(response).toBeDefined();
  });

  it('returns 401 when not authenticated', async () => {
    mockAuthenticateRequest.mockResolvedValueOnce({
      success: false,
      error: 'Authentication failed',
      statusCode: 401,
    });
    const { GET } = await import('../route');
    const request = new Request('http://localhost/api/challenges');
    (request as any).nextUrl = new URL('http://localhost/api/challenges');
    const response = await GET(request as any);
    expect(response.status).toBe(401);
  });
});

describe('POST /api/challenges', () => {
  it('successfully joins a bronze challenge', async () => {
    const { POST } = await import('../route');
    const request = new Request('http://localhost/api/challenges', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ challenge_id: 'challenge_1' }),
    });
    const response = await POST(request);
    expect(response).toBeDefined();
  });

  it('prevents joining the same challenge twice while active', async () => {
    const { POST } = await import('../route');
    const joinRequest1 = new Request('http://localhost/api/challenges', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ challenge_id: 'challenge_7' }),
    });
    await POST(joinRequest1);

    const joinRequest2 = new Request('http://localhost/api/challenges', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ challenge_id: 'challenge_7' }),
    });
    const response2 = await POST(joinRequest2);
    expect(response2.status).toBe(409);
  });

  it('returns 401 when not authenticated', async () => {
    mockAuthenticateRequest.mockResolvedValueOnce({
      success: false,
      error: 'Authentication failed',
      statusCode: 401,
    });
    const { POST } = await import('../route');
    const request = new Request('http://localhost/api/challenges', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ challenge_id: 'challenge_1' }),
    });
    const response = await POST(request);
    expect(response.status).toBe(401);
  });
});

describe('PUT /api/challenges', () => {
  it('progress action validates required_tags', async () => {
    const { POST, PUT } = await import('../route');
    const joinRequest = new Request('http://localhost/api/challenges', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ challenge_id: 'challenge_1' }),
    });
    const joinResponse = await POST(joinRequest);
    const joinData = await joinResponse.json();
    const userChallengeId = joinData.user_challenge?.id;

    if (!userChallengeId) return;

    const progressRequest = new Request('http://localhost/api/challenges', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_challenge_id: userChallengeId,
        action: 'progress',
        completion_data: { tags: [], questions_answered: false, action_confirmed: false },
      }),
    });
    const response = await PUT(progressRequest);
    expect(response.status).toBe(400);
  });

  it('abandon action marks challenge as abandoned', async () => {
    const { POST, PUT } = await import('../route');
    const joinRequest = new Request('http://localhost/api/challenges', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ challenge_id: 'challenge_7' }),
    });
    const joinResponse = await POST(joinRequest);
    const joinData = await joinResponse.json();
    const userChallengeId = joinData.user_challenge?.id;

    if (!userChallengeId) return;

    const abandonRequest = new Request('http://localhost/api/challenges', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_challenge_id: userChallengeId,
        action: 'abandon',
      }),
    });
    const response = await PUT(abandonRequest);
    expect(response).toBeDefined();
    const data = await response.json();
    expect(data.user_challenge?.status).toBe('abandoned');
  });

  it('make_up action validates remaining make up count', async () => {
    const { POST, PUT } = await import('../route');
    const joinRequest = new Request('http://localhost/api/challenges', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ challenge_id: 'challenge_7' }),
    });
    const joinResponse = await POST(joinRequest);
    const joinData = await joinResponse.json();
    const userChallengeId = joinData.user_challenge?.id;

    if (!userChallengeId) return;

    const makeUpRequest1 = new Request('http://localhost/api/challenges', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_challenge_id: userChallengeId, action: 'make_up' }),
    });
    await PUT(makeUpRequest1);

    const makeUpRequest2 = new Request('http://localhost/api/challenges', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_challenge_id: userChallengeId, action: 'make_up' }),
    });
    await PUT(makeUpRequest2);

    const makeUpRequest3 = new Request('http://localhost/api/challenges', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_challenge_id: userChallengeId, action: 'make_up' }),
    });
    const response3 = await PUT(makeUpRequest3);
    expect(response3.status).toBe(400);
  });

  it('returns 401 when not authenticated', async () => {
    mockAuthenticateRequest.mockResolvedValueOnce({
      success: false,
      error: 'Authentication failed',
      statusCode: 401,
    });
    const { PUT } = await import('../route');
    const request = new Request('http://localhost/api/challenges', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_challenge_id: 'uc1', action: 'abandon' }),
    });
    const response = await PUT(request);
    expect(response.status).toBe(401);
  });
});

describe('Bronze challenge participation', () => {
  it('can join different bronze challenges', async () => {
    const { POST } = await import('../route');
    const joinRequest1 = new Request('http://localhost/api/challenges', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ challenge_id: 'challenge_1' }),
    });
    const response1 = await POST(joinRequest1);
    expect(response1.status).not.toBe(409);

    const joinRequest2 = new Request('http://localhost/api/challenges', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ challenge_id: 'challenge_2' }),
    });
    const response2 = await POST(joinRequest2);
    expect(response2.status).not.toBe(409);
  });
});

describe('Milestone reward scoring', () => {
  // 辅助：通过直接操作 db 将 userChallenge 的 current_day 设置到指定值，
  // 模拟已经完成了 (targetDay-1) 天的进度，然后做一次 PUT progress 触发 milestone。
  // 注意：挑战进度更新有"每天只能完成一次"限制，不能在同一天内多次调用 progress。
  async function setupAndProgress(userChallengeId: string, currentDay: number, challengeId: string) {
    const { PUT } = await import('../route');
    const { updateUserChallenge } = await import('@/lib/local-db');

    // 设置 current_day 到目标值（模拟已完成 currentDay-1 天）
    // 同时填充 daily_records 避免今天被标记为已完成
    const pastDates: Array<{ date: string; completed: boolean }> = [];
    for (let d = 1; d < currentDay; d++) {
      const date = new Date();
      date.setDate(date.getDate() - d);
      const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      pastDates.push({ date: dateStr, completed: true });
    }
    updateUserChallenge(userChallengeId, {
      current_day: currentDay,
      progress: currentDay - 1,
      streak_days: currentDay - 1,
      daily_records: pastDates,
    });

    // 执行一次 progress
    const req = new Request('http://localhost/api/challenges', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_challenge_id: userChallengeId,
        action: 'progress',
        tags: ['运动'],
        questions_answered: [],
        action_confirmed: true,
      }),
    });
    return await PUT(req);
  }

  it('awards milestone score when reaching milestone day (non-completion branch)', async () => {
    // challenge_8 (健康追踪): duration_days=7, milestones at day 3 (score=5) and day 7 (score=8)
    const { POST } = await import('../route');
    const joinReq = new Request('http://localhost/api/challenges', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ challenge_id: 'challenge_8' }),
    });
    const joinRes = await POST(joinReq);
    const joinData = await joinRes.json();
    const ucId = joinData.user_challenge?.id;
    expect(ucId).toBeDefined();

    // 设置 current_day=3，做一次 progress → newCurrentDay=4 → checkMilestones(3) 触发 day=3 milestone
    const response = await setupAndProgress(ucId, 3, 'challenge_8');
    const data = await response.json();

    // 验证 milestone_reward 被返回
    expect(data.milestone_reward).toBeDefined();
    expect(data.milestone_reward.score).toBe(5);
    expect(data.milestone_reward.title).toBe('动起来');

    // 验证 scoreEvents 中写入了 MILESTONE_REACHED 事件
    const { getScoreEvents } = await import('@/lib/local-db');
    const events = getScoreEvents('test-user-id');
    const milestoneEvents = events.filter(e => e.action === 'MILESTONE_REACHED');
    expect(milestoneEvents.length).toBeGreaterThan(0);
    expect(milestoneEvents[0].score).toBe(5);
  });

  it('awards both milestone and challenge completion scores when final day is milestone', async () => {
    // challenge_8 (健康追踪): duration_days=7, day 7 milestone (score=8) + 完成奖励 (score=15)
    const { POST } = await import('../route');
    const joinReq = new Request('http://localhost/api/challenges', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ challenge_id: 'challenge_8' }),
    });
    const joinRes = await POST(joinReq);
    const joinData = await joinRes.json();
    const ucId = joinData.user_challenge?.id;

    // 设置 current_day=7，做一次 progress → newProgress=7 >= duration_days=7 → 触发完成 + day 7 milestone
    const response = await setupAndProgress(ucId, 7, 'challenge_8');
    const data = await response.json();

    // 验证挑战完成
    expect(data.completed).toBe(true);
    // 验证 milestone 也触发
    expect(data.milestone_reward).toBeDefined();
    expect(data.milestone_reward.score).toBe(8);

    // 验证 scoreEvents 同时包含 CHALLENGE_COMPLETED 和 MILESTONE_REACHED
    const { getScoreEvents } = await import('@/lib/local-db');
    const events = getScoreEvents('test-user-id');
    const challengeEvents = events.filter(e => e.action === 'CHALLENGE_COMPLETED');
    const milestoneEvents = events.filter(e => e.action === 'MILESTONE_REACHED');

    expect(challengeEvents.length).toBe(1);
    expect(challengeEvents[0].score).toBe(15);
    expect(milestoneEvents.length).toBe(1);
    expect(milestoneEvents[0].score).toBe(8);
  });

  it('does not award milestone score when no milestone is defined for the day', async () => {
    // challenge_8 (健康追踪): milestones at day 3 and 7
    // 设置 current_day=1（初始值），做一次 progress → newCurrentDay=2 → checkMilestones(1) 无 milestone
    const { POST } = await import('../route');
    const joinReq = new Request('http://localhost/api/challenges', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ challenge_id: 'challenge_8' }),
    });
    const joinRes = await POST(joinReq);
    const joinData = await joinRes.json();
    const ucId = joinData.user_challenge?.id;

    // 不需要 setupAndProgress，直接做一次 progress（current_day=1 → 2，checkMilestones(1) 无 milestone）
    const req = new Request('http://localhost/api/challenges', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_challenge_id: ucId,
        action: 'progress',
        tags: ['运动'],
        questions_answered: [],
        action_confirmed: true,
      }),
    });
    const { PUT } = await import('../route');
    const response = await PUT(req);
    const data = await response.json();

    // 无 milestone 奖励（null 或 undefined 都算无奖励）
    expect(data.milestone_reward).toBeFalsy();

    // 无 MILESTONE_REACHED 事件
    const { getScoreEvents } = await import('@/lib/local-db');
    const events = getScoreEvents('test-user-id');
    const milestoneEvents = events.filter(e => e.action === 'MILESTONE_REACHED');
    expect(milestoneEvents.length).toBe(0);
  });
});
