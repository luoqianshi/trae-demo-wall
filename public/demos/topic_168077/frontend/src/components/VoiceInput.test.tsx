import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import VoiceInput from './VoiceInput';

const mockOnResult = vi.fn();

function createMockSpeechRecognition() {
  const handlers: Record<string, ((event: any) => void) | null> = {};
  const mockStart = vi.fn();
  const mockStop = vi.fn();
  const mockSpeechRecognition = vi.fn(() => ({
    start: mockStart,
    stop: mockStop,
    lang: '',
    continuous: false,
    interimResults: false,
    set onresult(fn: any) { handlers.onresult = fn; },
    set onerror(fn: any) { handlers.onerror = fn; },
    set onend(fn: any) { handlers.onend = fn; },
    get onresult() { return handlers.onresult; },
    get onerror() { return handlers.onerror; },
    get onend() { return handlers.onend; },
  }));
  return { mockSpeechRecognition, mockStart, mockStop, handlers };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('VoiceInput', () => {
  it('renders microphone button', () => {
    render(<VoiceInput onResult={mockOnResult} />);
    expect(document.querySelector('.anticon-audio')).toBeInTheDocument();
  });

  it('shows alert when SpeechRecognition is not available', () => {
    const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {});
    (window as any).SpeechRecognition = undefined;
    (window as any).webkitSpeechRecognition = undefined;

    render(<VoiceInput onResult={mockOnResult} />);
    fireEvent.click(screen.getByRole('button'));

    expect(alertMock).toHaveBeenCalledWith('您的浏览器不支持语音识别，请使用Chrome浏览器');
    alertMock.mockRestore();
  });

  it('changes icon and style when listening', () => {
    const { mockSpeechRecognition, mockStart } = createMockSpeechRecognition();
    (window as any).SpeechRecognition = mockSpeechRecognition;

    render(<VoiceInput onResult={mockOnResult} />);

    fireEvent.click(screen.getByRole('button'));

    expect(mockStart).toHaveBeenCalledTimes(1);
    expect(document.querySelector('.anticon-audio-muted')).toBeInTheDocument();
  });

  it('calls onResult when speech is recognized', () => {
    const { mockSpeechRecognition, handlers } = createMockSpeechRecognition();
    (window as any).SpeechRecognition = mockSpeechRecognition;

    render(<VoiceInput onResult={mockOnResult} />);
    fireEvent.click(screen.getByRole('button'));

    handlers.onresult!({ results: [[{ transcript: '测试语音' }]] });

    expect(mockOnResult).toHaveBeenCalledWith('测试语音');
  });

  it('stops listening when button is clicked again', () => {
    const { mockSpeechRecognition, mockStop } = createMockSpeechRecognition();
    (window as any).SpeechRecognition = mockSpeechRecognition;

    render(<VoiceInput onResult={mockOnResult} />);
    // Start listening
    fireEvent.click(screen.getByRole('button'));
    expect(document.querySelector('.anticon-audio-muted')).toBeInTheDocument();

    // Stop listening
    fireEvent.click(screen.getByRole('button'));
    expect(mockStop).toHaveBeenCalled();
  });

  it('handles speech recognition error gracefully', async () => {
    const { mockSpeechRecognition, handlers } = createMockSpeechRecognition();
    (window as any).SpeechRecognition = mockSpeechRecognition;

    render(<VoiceInput onResult={mockOnResult} />);
    fireEvent.click(screen.getByRole('button'));

    // Simulate error
    handlers.onerror!({ error: 'no-speech' });

    // After error, icon should go back to regular audio
    await waitFor(() => {
      expect(document.querySelector('.anticon-audio')).toBeInTheDocument();
    });
  });

  it('resets icon on end event', async () => {
    const { mockSpeechRecognition, handlers } = createMockSpeechRecognition();
    (window as any).SpeechRecognition = mockSpeechRecognition;

    render(<VoiceInput onResult={mockOnResult} />);
    fireEvent.click(screen.getByRole('button'));

    // Simulate end event
    handlers.onend!({});

    // After end, icon should return to normal
    await waitFor(() => {
      expect(document.querySelector('.anticon-audio')).toBeInTheDocument();
    });
  });
});