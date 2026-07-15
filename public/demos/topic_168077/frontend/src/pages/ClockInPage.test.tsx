import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ClockInPage from './ClockInPage';

vi.mock('../api/client', () => ({
  childAPI: {
    list: vi.fn().mockResolvedValue({ data: [
      { id: '1', name: '小明', age: 8 },
      { id: '2', name: '小红', age: 6 },
    ] }),
  },
  clockAPI: {
    listByChild: vi.fn().mockResolvedValue({ data: [
      { id: '1', event_type: 'wake_up', timestamp: '2026-06-30T07:00:00Z', status: 'confirmed' },
      { id: '2', event_type: 'sleep', timestamp: '2026-06-29T21:00:00Z', status: 'pending' },
    ] }),
    confirm: vi.fn().mockResolvedValue({}),
    reject: vi.fn().mockResolvedValue({}),
  },
  deviceLogAPI: {
    list: vi.fn().mockResolvedValue({ data: [
      { id: '3', event_type: 'wake_up', device_id: 'ESP32-01', status: 'confirmed', rfid_uid: 'ABC123', math_problem: '3+5', math_user_answer: '8', math_correct: true },
    ] }),
  },
}));

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ role: 'admin', childId: null }),
}));

describe('ClockInPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders child selector with auto-selected first child', async () => {
    render(<ClockInPage />);
    await waitFor(() => {
      expect(screen.getByText('小明')).toBeInTheDocument();
    });
  });

  it('renders tabs with device log and legacy records', async () => {
    render(<ClockInPage />);
    await waitFor(() => {
      expect(screen.getByText('设备打卡记录')).toBeInTheDocument();
    });
    expect(screen.getByText('简易打卡记录')).toBeInTheDocument();
  });

  it('shows device log columns with math data', async () => {
    render(<ClockInPage />);
    await waitFor(() => {
      expect(screen.getByText('3+5')).toBeInTheDocument();
    });
    expect(screen.getByText('8')).toBeInTheDocument();
  });

  it('renders the page with all required sections', async () => {
    render(<ClockInPage />);
    await waitFor(() => {
      expect(screen.getByText('设备打卡记录')).toBeInTheDocument();
    }, { timeout: 3000 });
    expect(screen.getByText('简易打卡记录')).toBeInTheDocument();
    expect(screen.getByText('全部')).toBeInTheDocument();
  });

  it('disables child selector in child mode', async () => {
    vi.mocked(await import('../context/AuthContext')).useAuth = () => ({ role: 'child', childId: '1' });
    render(<ClockInPage />);
    await waitFor(() => {
      const disabledSelect = document.querySelector('.ant-select-disabled');
      expect(disabledSelect).not.toBeNull();
    });
  });

  it('shows status filter with all status options', async () => {
    render(<ClockInPage />);
    await waitFor(() => {
      expect(screen.getByText('全部')).toBeInTheDocument();
    });
  });
});