import { render, screen, act } from '@testing-library/react';
import { AuthProvider, useAuth } from './AuthContext';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const TestComponent = () => {
  const { isLoggedIn, user, login, logout } = useAuth();
  return (
    <div>
      <span data-testid="status">{isLoggedIn ? 'logged-in' : 'logged-out'}</span>
      <span data-testid="user">{user?.email || 'none'}</span>
      <button onClick={() => login({ email: 'test@test.com', role: 'CANDIDATE' }, 'token')}>Login</button>
      <button onClick={logout}>Logout</button>
    </div>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('provides default logged-out state', () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    expect(screen.getByTestId('status').textContent).toBe('logged-out');
  });

  it('handles login and logout correctly', () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    act(() => {
      screen.getByText('Login').click();
    });

    expect(screen.getByTestId('status').textContent).toBe('logged-in');
    expect(screen.getByTestId('user').textContent).toBe('test@test.com');
    expect(localStorage.getItem('hc_token')).toBe('token');

    act(() => {
      screen.getByText('Logout').click();
    });

    expect(screen.getByTestId('status').textContent).toBe('logged-out');
    expect(localStorage.getItem('hc_token')).toBe(null);
  });

  it('restores state from localStorage', () => {
    localStorage.setItem('hc_token', 'saved-token');
    localStorage.setItem('hc_user', JSON.stringify({ email: 'saved@test.com' }));
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    expect(screen.getByTestId('status').textContent).toBe('logged-in');
    expect(screen.getByTestId('user').textContent).toBe('saved@test.com');
  });
});
