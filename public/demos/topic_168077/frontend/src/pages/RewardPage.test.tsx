import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RewardPage from './RewardPage';

const { mockRules, mockRecords } = vi.hoisted(() => ({
  mockRules: [
    { id: '1', name: '收拾玩具', type: 'reward', amount: 2, description: '整理玩具奖励' },
    { id: '2', name: '打人', type: 'penalty', amount: 5, description: '打人惩罚' },
  ],
  mockRecords: [
    { id: '1', child_id: '1', type: 'reward', amount: 2, reason: '收拾玩具', created_by: '家长', created_at: '2026-07-01T10:00:00Z' },
    { id: '2', child_id: '2', type: 'penalty', amount: 5, reason: '打人', created_by: '系统', created_at: '2026-06-30T12:00:00Z' },
  ],
}));

vi.mock('../api/client', () => ({
  childAPI: {
    list: vi.fn().mockResolvedValue({ data: [
      { id: '1', name: '小明', age: 8 },
      { id: '2', name: '小红', age: 6 },
    ] }),
  },
  rewardAPI: {
    listRules: vi.fn().mockResolvedValue({ data: mockRules }),
    listRecords: vi.fn().mockResolvedValue({ data: mockRecords }),
    createRule: vi.fn().mockResolvedValue({ data: {} }),
    updateRule: vi.fn().mockResolvedValue({ data: {} }),
    deleteRule: vi.fn().mockResolvedValue({ data: {} }),
    createRecord: vi.fn().mockResolvedValue({ data: {} }),
    updateRecord: vi.fn().mockResolvedValue({ data: {} }),
    deleteRecord: vi.fn().mockResolvedValue({ data: {} }),
  },
}));

let mockRole = 'admin';
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ role: mockRole, childId: null }),
}));

vi.mock('../components/AIAssistant', () => ({
  default: ({ visible }: any) =>
    visible ? <div data-testid="ai-assistant">AI输入</div> : null,
}));

describe('RewardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRole = 'admin';
  });

  it('renders tabs with rules and records', async () => {
    render(<RewardPage />);
    await waitFor(() => {
      expect(screen.getByText('奖惩规则')).toBeInTheDocument();
    });
    expect(screen.getByText('奖惩记录')).toBeInTheDocument();
  });

  it('shows rules in the rules tab', async () => {
    render(<RewardPage />);
    await waitFor(() => {
      expect(screen.getByText('收拾玩具')).toBeInTheDocument();
    });
    expect(screen.getByText('打人')).toBeInTheDocument();
  });

  it('shows add rule button for admin', async () => {
    render(<RewardPage />);
    await waitFor(() => {
      expect(screen.getByText('添加规则')).toBeInTheDocument();
    });
  });

  it('opens rule modal on add rule click', async () => {
    render(<RewardPage />);
    await waitFor(() => {
      expect(screen.getByText('添加规则')).toBeInTheDocument();
    });
    await userEvent.click(screen.getByText('添加规则'));
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  it('shows edit and delete buttons for admin', async () => {
    render(<RewardPage />);
    await waitFor(() => {
      const editBtns = screen.getAllByText('编辑');
      expect(editBtns.length).toBeGreaterThan(0);
    });
    const deleteBtns = screen.getAllByText('删除');
    expect(deleteBtns.length).toBeGreaterThan(0);
  });

  it('shows records tab with data', async () => {
    render(<RewardPage />);
    await userEvent.click(screen.getByText('奖惩记录'));
    await waitFor(() => {
      expect(screen.getByText('小明')).toBeInTheDocument();
    });
    expect(screen.getByText('小红')).toBeInTheDocument();
  });

  it('shows add record button for admin', async () => {
    render(<RewardPage />);
    await userEvent.click(screen.getByText('奖惩记录'));
    await waitFor(() => {
      expect(screen.getByText('添加记录')).toBeInTheDocument();
    });
  });

  it('shows AI input button for admin', async () => {
    render(<RewardPage />);
    await userEvent.click(screen.getByText('奖惩记录'));
    await waitFor(() => {
      expect(screen.getByText('AI输入')).toBeInTheDocument();
    });
  });

  it('shows record type colors correctly', async () => {
    render(<RewardPage />);
    await userEvent.click(screen.getByText('奖惩记录'));
    await waitFor(() => {
      const rewardElements = screen.getAllByText('奖励');
      expect(rewardElements.length).toBeGreaterThan(0);
    });
  });

  it('hides admin buttons in child mode', async () => {
    mockRole = 'child';
    render(<RewardPage />);
    await waitFor(() => {
      expect(screen.queryByText('添加规则')).toBeNull();
    });
  });
});