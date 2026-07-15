import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import FestivalCountdown from './FestivalCountdown';

const mockApiGet = vi.fn();
vi.mock('../api/client', () => ({
  default: { get: (...args: any[]) => mockApiGet(...args) },
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe('FestivalCountdown', () => {
  it('shows upcoming festival countdown', async () => {
    // Set to 2026-06-15 so Dragon Boat Festival (June 19) is upcoming
    vi.setSystemTime(new Date('2026-06-15T10:00:00Z'));

    mockApiGet
      .mockResolvedValueOnce({ data: { festivals: [], theme: 'default', label: '' } })
      .mockResolvedValueOnce({
        data: [
          { key: 'dragon-boat', name: '端午节', date: '2026-06-19', type: 'lunar', theme: 'dragon-boat' },
          { key: 'qixi', name: '七夕节', date: '2026-08-19', type: 'lunar', theme: 'qixi' },
        ],
      });

    render(<FestivalCountdown />);

    await waitFor(() => {
      expect(screen.getByText(/端午节/)).toBeInTheDocument();
    });
    expect(screen.getByText(/5天后/)).toBeInTheDocument();
  });

  it('shows current festival label when festival is today', async () => {
    vi.setSystemTime(new Date('2026-06-15T10:00:00Z'));

    mockApiGet
      .mockResolvedValueOnce({
        data: {
          festivals: [{ key: 'dragon-boat', name: '端午节', type: 'lunar', theme: 'dragon-boat' }],
          theme: 'dragon-boat',
          label: '🐉 端午节快乐！',
        },
      })
      .mockResolvedValueOnce({
        data: [
          { key: 'dragon-boat', name: '端午节', date: '2026-06-15', type: 'lunar', theme: 'dragon-boat' },
        ],
      });

    render(<FestivalCountdown />);

    await waitFor(() => {
      expect(screen.getByText('🐉 端午节快乐！')).toBeInTheDocument();
    });
  });

  it('returns null when no festivals', async () => {
    mockApiGet
      .mockResolvedValueOnce({ data: { festivals: [], theme: 'default', label: '' } })
      .mockResolvedValueOnce({ data: [] });

    const { container } = render(<FestivalCountdown />);

    await waitFor(() => {
      expect(container.innerHTML).toBe('');
    });
  });

  it('handles API error silently', async () => {
    mockApiGet.mockRejectedValue(new Error('Network error'));

    const { container } = render(<FestivalCountdown />);

    await waitFor(() => {
      expect(container.innerHTML).toBe('');
    });
  });
});