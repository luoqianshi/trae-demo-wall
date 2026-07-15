import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AllowancePage from './AllowancePage';

vi.mock('../api/client', () => ({
  childAPI: {
    list: vi.fn().mockResolvedValue({ data: [
      { id: '1', name: '小明', age: 8 },
    ] }),
  },
  allowanceAPI: {
    getBalance: vi.fn().mockResolvedValue({ data: { balance: 50, child_id: '1' } }),
    listTransactions: vi.fn().mockResolvedValue({ data: [
      { id: '1', type: 'reward', amount: 10, description: '测试奖励', created_at: '2026-07-01T10:00:00Z' },
      { id: '2', type: 'spend', amount: -3, description: '买橡皮', created_at: '2026-06-30T12:00:00Z' },
    ] }),
    spend: vi.fn().mockResolvedValue({ data: {} }),
  },
}));

let mockRole = 'admin';
let mockChildId: string | null = null;
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ role: mockRole, childId: mockChildId }),
}));

describe('AllowancePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders child selector and loads data on mount', async () => {
    render(<AllowancePage />);
    await waitFor(() => {
      expect(screen.getByText('小明')).toBeInTheDocument();
    });
    expect(screen.getByText('当前零花钱')).toBeInTheDocument();
  });

  it('shows balance from API', async () => {
    render(<AllowancePage />);
    await waitFor(() => {
      // Ant Design Statistic renders decimal parts as separate nodes
      expect(screen.getByText('50')).toBeInTheDocument();
    });
  });

  it('shows transaction records', async () => {
    render(<AllowancePage />);
    await waitFor(() => {
      expect(screen.getByText('测试奖励')).toBeInTheDocument();
    });
    expect(screen.getByText('买橡皮')).toBeInTheDocument();
  });

  it('shows spend button for admin', async () => {
    render(<AllowancePage />);
    await waitFor(() => {
      expect(screen.getByText('消费记录')).toBeInTheDocument();
    });
  });

  it('opens spend modal on button click', async () => {
    render(<AllowancePage />);
    await waitFor(() => {
      expect(screen.getByText('消费记录')).toBeInTheDocument();
    });
    await userEvent.click(screen.getByText('消费记录'));
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  it('disables child selector in child mode', async () => {
    mockRole = 'child';
    mockChildId = '1';
    render(<AllowancePage />);
    await waitFor(() => {
      const disabledSelect = document.querySelector('.ant-select-disabled');
      expect(disabledSelect).not.toBeNull();
    });
  });

  it('hides spend button in child mode', async () => {
    mockRole = 'child';
    mockChildId = '1';
    render(<AllowancePage />);
    await waitFor(() => {
      expect(screen.queryByText('消费记录')).toBeNull();
    });
  });

  it('renders transaction type colors correctly', async () => {
    render(<AllowancePage />);
    await waitFor(() => {
      expect(screen.getByText('奖励')).toBeInTheDocument();
    });
    const rewardEl = screen.getByText('奖励');
    expect(rewardEl).toHaveStyle({ color: 'rgb(0, 128, 0)' });
  });
});