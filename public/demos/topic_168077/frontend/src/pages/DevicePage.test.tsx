import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DevicePage from './DevicePage';

vi.mock('../components/DeviceManager', () => ({
  default: ({ onSleepConfig }: { onSleepConfig: (device: any) => void }) => (
    <div data-testid="device-manager">
      <button onClick={() => onSleepConfig({ id: '1', name: 'Test Device' })}>设备管理器按钮</button>
    </div>
  ),
}));

vi.mock('../components/RFIDBindingManager', () => ({
  default: () => <div data-testid="rfid-manager">RFID绑定管理器</div>,
}));

vi.mock('../components/SleepConfigModal', () => ({
  default: ({ visible }: { visible: boolean }) =>
    visible ? <div data-testid="sleep-modal">休眠配置</div> : null,
}));

let mockRole = 'admin';
let mockChildId: string | null = null;
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ role: mockRole, childId: mockChildId }),
}));

describe('DevicePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRole = 'admin';
    mockChildId = null;
  });

  it('renders tabs for admin role', async () => {
    render(<DevicePage />);
    await waitFor(() => {
      expect(screen.getByText('设备列表')).toBeInTheDocument();
    });
    expect(screen.getByText('RFID卡绑定')).toBeInTheDocument();
  });

  it('renders DeviceManager component', () => {
    render(<DevicePage />);
    expect(screen.getByTestId('device-manager')).toBeInTheDocument();
  });

  it('renders RFIDBindingManager after clicking tab', async () => {
    render(<DevicePage />);
    await userEvent.click(screen.getByText('RFID卡绑定'));
    await waitFor(() => {
      expect(screen.getByTestId('rfid-manager')).toBeInTheDocument();
    });
  });

  it('shows 403 for child role', async () => {
    mockRole = 'child';
    mockChildId = '1';
    render(<DevicePage />);
    await waitFor(() => {
      expect(screen.getByText('无权限')).toBeInTheDocument();
    });
    expect(screen.getByText('孩子模式下无法访问设备管理')).toBeInTheDocument();
  });

  it('shows sleep config modal when triggered from DeviceManager', async () => {
    render(<DevicePage />);
    const triggerBtn = screen.getByText('设备管理器按钮');
    await userEvent.click(triggerBtn);
    await waitFor(() => {
      expect(screen.getByTestId('sleep-modal')).toBeInTheDocument();
    });
  });
});