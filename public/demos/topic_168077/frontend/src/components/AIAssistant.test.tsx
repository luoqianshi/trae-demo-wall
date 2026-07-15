import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AIAssistant from './AIAssistant';

const { mockSettingsGet } = vi.hoisted(() => ({
  mockSettingsGet: vi.fn().mockResolvedValue({
    data: {
      ai: { api_endpoint: 'https://api.openai.com/v1/chat/completions', api_key: 'sk-test', model: 'gpt-4' },
    },
  }),
}));

vi.mock('../api/client', () => ({
  settingsAPI: { get: mockSettingsGet },
}));

describe('AIAssistant', () => {
  const onClose = vi.fn();
  const onParsed = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders modal when visible', () => {
    render(<AIAssistant visible={true} onClose={onClose} mode="child" onParsed={onParsed} />);
    expect(screen.getByText('AI 智能输入')).toBeInTheDocument();
  });

  it('does not render when not visible', () => {
    render(<AIAssistant visible={false} onClose={onClose} mode="child" onParsed={onParsed} />);
    expect(screen.queryByText('AI 智能输入')).toBeNull();
  });

  it('shows hint text for child mode', () => {
    render(<AIAssistant visible={true} onClose={onClose} mode="child" onParsed={onParsed} />);
    expect(screen.getByText(/添加一个叫小明的男孩/)).toBeInTheDocument();
  });

  it('shows hint text for schedule mode', () => {
    render(<AIAssistant visible={true} onClose={onClose} mode="schedule" onParsed={onParsed} />);
    expect(screen.getByText(/周一到周五/)).toBeInTheDocument();
  });

  it('shows hint text for reward mode', () => {
    render(<AIAssistant visible={true} onClose={onClose} mode="reward" onParsed={onParsed} />);
    expect(screen.getByText(/收拾玩具奖励2元/)).toBeInTheDocument();
  });

  it('calls onParsed with parsed child data on submit', async () => {
    render(<AIAssistant visible={true} onClose={onClose} mode="child" onParsed={onParsed} />);
    const textarea = screen.getByPlaceholderText('请输入自然语言描述...');
    await userEvent.type(textarea, '叫小明，6岁，男孩');
    await userEvent.click(screen.getByText('OK'));
    await waitFor(() => {
      expect(onParsed).toHaveBeenCalledWith(
        expect.objectContaining({ name: '小明', age: 6, gender: 'male' })
      );
    });
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onParsed with parsed schedule data on submit', async () => {
    render(<AIAssistant visible={true} onClose={onClose} mode="schedule" onParsed={onParsed} />);
    const textarea = screen.getByPlaceholderText('请输入自然语言描述...');
    await userEvent.type(textarea, '07:00起床，08:00早餐');
    await userEvent.click(screen.getByText('OK'));
    await waitFor(() => {
      expect(onParsed).toHaveBeenCalled();
      const calls = onParsed.mock.calls[0][0];
      expect(Array.isArray(calls)).toBe(true);
      expect(calls.length).toBeGreaterThanOrEqual(2);
    });
  });

  it('calls onParsed with parsed reward data on submit', async () => {
    render(<AIAssistant visible={true} onClose={onClose} mode="reward" onParsed={onParsed} />);
    const textarea = screen.getByPlaceholderText('请输入自然语言描述...');
    await userEvent.type(textarea, '收拾玩具奖励2元，打人扣5元');
    await userEvent.click(screen.getByText('OK'));
    await waitFor(() => {
      expect(onParsed).toHaveBeenCalled();
      const calls = onParsed.mock.calls[0][0];
      expect(Array.isArray(calls)).toBe(true);
      expect(calls.length).toBeGreaterThanOrEqual(2);
    });
  });

  it('shows voice input button', () => {
    render(<AIAssistant visible={true} onClose={onClose} mode="child" onParsed={onParsed} />);
    expect(screen.getByText('语音输入')).toBeInTheDocument();
  });

  it('shows AI polish button', () => {
    render(<AIAssistant visible={true} onClose={onClose} mode="child" onParsed={onParsed} />);
    expect(screen.getByText('AI 润色')).toBeInTheDocument();
  });

  it('calls onClose when cancel is clicked', async () => {
    render(<AIAssistant visible={true} onClose={onClose} mode="child" onParsed={onParsed} />);
    await userEvent.click(screen.getByText('Cancel'));
    expect(onClose).toHaveBeenCalled();
  });

  it('does not call onParsed when submitting empty text', async () => {
    render(<AIAssistant visible={true} onClose={onClose} mode="child" onParsed={onParsed} />);
    await userEvent.click(screen.getByText('OK'));
    expect(onParsed).not.toHaveBeenCalled();
  });
});