import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ChildrenPage from './ChildrenPage';

const { mockUseAuth } = vi.hoisted(() => ({
  mockUseAuth: vi.fn().mockReturnValue({ role: 'admin', childId: null }),
}));

vi.mock('../api/client', () => ({
  childAPI: {
    list: vi.fn().mockResolvedValue({ data: [
      { id: '1', name: '小明', age: 8, birthday: '2018-06-01', avatar: 'boy1' },
      { id: '2', name: '小红', age: 6, birthday: '2020-03-15', avatar: 'girl1' },
    ] }),
    get: vi.fn().mockResolvedValue({ data: { id: '1', name: '小明', age: 8, birthday: '2018-06-01', avatar: 'boy1' } }),
    create: vi.fn().mockResolvedValue({ data: { id: '3' } }),
    update: vi.fn().mockResolvedValue({}),
    delete: vi.fn().mockResolvedValue({}),
  },
}));

vi.mock('../context/AuthContext', () => ({
  useAuth: mockUseAuth,
}));

describe('ChildrenPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({ role: 'admin', childId: null });
  });

  it('renders table with children data', async () => {
    render(<ChildrenPage />);
    await waitFor(() => {
      expect(screen.getByText('小明')).toBeInTheDocument();
    });
    expect(screen.getByText('小红')).toBeInTheDocument();
  });

  it('shows birthday column', async () => {
    render(<ChildrenPage />);
    await waitFor(() => {
      expect(screen.getByText('2018-06-01')).toBeInTheDocument();
    });
    expect(screen.getByText('2020-03-15')).toBeInTheDocument();
  });

  it('shows add button for admin', async () => {
    render(<ChildrenPage />);
    await waitFor(() => {
      expect(screen.getByText('添加孩子')).toBeInTheDocument();
    });
  });

  it('shows read-only text for child mode', async () => {
    mockUseAuth.mockReturnValue({ role: 'child', childId: '1' });
    render(<ChildrenPage />);
    await waitFor(() => {
      expect(screen.getByText('只读')).toBeInTheDocument();
    });
  });

  it('opens create modal on add button click', async () => {
    render(<ChildrenPage />);
    await waitFor(() => {
      expect(screen.getByText('添加孩子')).toBeInTheDocument();
    });
    await userEvent.click(screen.getByText('添加孩子'));
    await waitFor(() => {
      const nameLabels = screen.getAllByText('姓名');
      expect(nameLabels.length).toBeGreaterThanOrEqual(2);
    });
  });

  it('opens edit modal on edit button click', async () => {
    render(<ChildrenPage />);
    await waitFor(() => {
      expect(screen.getByText('小明')).toBeInTheDocument();
    });
    const editBtns = screen.getAllByText('编辑');
    await userEvent.click(editBtns[0]);
    await waitFor(() => {
      expect(screen.getByText('编辑孩子')).toBeInTheDocument();
    });
  });

  it('renders delete buttons for admin', async () => {
    render(<ChildrenPage />);
    await waitFor(() => {
      expect(screen.getByText('小明')).toBeInTheDocument();
    });
    const deleteBtns = screen.getAllByText('删除');
    expect(deleteBtns.length).toBeGreaterThan(0);
  });
});