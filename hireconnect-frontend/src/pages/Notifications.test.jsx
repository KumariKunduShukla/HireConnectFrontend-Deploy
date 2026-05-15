import { render, screen, waitFor, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi, describe, it, expect } from 'vitest';
import Notifications from './Notifications';
import { useAuth } from '../context/AuthContext';
import { notificationAPI } from '../api';

// Mock the Auth Context
vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

// Mock the API
vi.mock('../api', () => ({
  notificationAPI: {
    getByUser: vi.fn(),
    markRead: vi.fn(),
    markAllRead: vi.fn(),
  },
}));

describe('Notifications Page', () => {
  it('shows loading state initially', () => {
    useAuth.mockReturnValue({ user: { userId: 1 } });
    notificationAPI.getByUser.mockReturnValue(new Promise(() => {})); // Never resolves

    render(
      <MemoryRouter>
        <Notifications />
      </MemoryRouter>
    );

    expect(screen.getByTestId('loading-skeleton')).toBeInTheDocument();
  });

  it('renders notifications list after loading', async () => {
    const mockUser = { userId: 1, profileId: 5 };
    const mockNotifications = [
      { notificationId: 1, type: 'Job Alert', message: 'New Job Posted', isRead: false, createdAt: '2023-10-01T10:00:00' },
      { notificationId: 2, type: 'Interview', message: 'Interview Scheduled', isRead: true, createdAt: '2023-10-02T11:00:00' },
    ];

    useAuth.mockReturnValue({ user: mockUser });
    notificationAPI.getByUser.mockResolvedValue({ data: mockNotifications });

    render(
      <MemoryRouter>
        <Notifications />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('New Job Posted')).toBeInTheDocument();
      expect(screen.getByText('Interview Scheduled')).toBeInTheDocument();
    });

    // Check that it used profileId
    expect(notificationAPI.getByUser).toHaveBeenCalledWith(5);
  });

  it('shows empty state when no notifications exist', async () => {
    useAuth.mockReturnValue({ user: { userId: 1 } });
    notificationAPI.getByUser.mockResolvedValue({ data: [] });

    render(
      <MemoryRouter>
        <Notifications />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/No notifications yet/i)).toBeInTheDocument();
    });
  });

  it('handles markAllRead correctly', async () => {
    const mockUser = { userId: 1 };
    const mockNotifications = [
      { notificationId: 1, type: 'Job Alert', message: 'Msg 1', isRead: false },
    ];

    useAuth.mockReturnValue({ user: mockUser });
    notificationAPI.getByUser.mockResolvedValue({ data: mockNotifications });
    notificationAPI.markAllRead.mockResolvedValue({});

    render(
      <MemoryRouter>
        <Notifications />
      </MemoryRouter>
    );

    await waitFor(() => screen.getByText('Msg 1'));
    
    const markAllBtn = screen.getByText(/Mark all read/i);
    act(() => {
      markAllBtn.click();
    });

    expect(notificationAPI.markAllRead).toHaveBeenCalled();
  });
});
