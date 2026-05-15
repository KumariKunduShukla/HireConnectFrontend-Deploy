import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Navbar from './Navbar';
import { AuthProvider } from '../context/AuthContext';
import { ThemeProvider } from '../context/ThemeContext';
import * as AuthContext from '../context/AuthContext';

describe('Navbar', () => {
  it('renders logo and basic links when logged out', () => {
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      isLoggedIn: false,
      user: null,
      logout: vi.fn(),
    });

    render(
      <BrowserRouter>
        <ThemeProvider>
          <Navbar />
        </ThemeProvider>
      </BrowserRouter>
    );
    expect(screen.getByText('HireConnect')).toBeDefined();
    expect(screen.getByText('Jobs')).toBeDefined();
    expect(screen.getByText('Sign In')).toBeDefined();
  });

  it('shows logged-in links when authenticated', () => {
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      isLoggedIn: true,
      user: { email: 'test@test.com', role: 'CANDIDATE' },
      logout: vi.fn(),
    });

    render(
      <BrowserRouter>
        <ThemeProvider>
          <Navbar />
        </ThemeProvider>
      </BrowserRouter>
    );
    
    expect(screen.getByText('Dashboard')).toBeDefined();
    expect(screen.getByRole('link', { name: /notifications/i })).toBeDefined();
  });

  it('toggles theme when button is clicked', () => {
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      isLoggedIn: false,
      user: null,
      logout: vi.fn(),
    });

    render(
      <BrowserRouter>
        <ThemeProvider>
          <Navbar />
        </ThemeProvider>
      </BrowserRouter>
    );
    
    const toggle = screen.getByTitle('Toggle Dark Mode');
    fireEvent.click(toggle);
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('calls logout when sign out is clicked', () => {
    const logoutMock = vi.fn();
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      isLoggedIn: true,
      user: { email: 'test@test.com', role: 'CANDIDATE' },
      logout: logoutMock,
    });

    render(
      <BrowserRouter>
        <ThemeProvider>
          <Navbar />
        </ThemeProvider>
      </BrowserRouter>
    );
    
    // Open dropdown
    const avatar = screen.getByText('T');
    fireEvent.click(avatar);
    
    const logoutBtn = screen.getAllByText('Sign Out')[0];
    fireEvent.click(logoutBtn);
    
    expect(logoutMock).toHaveBeenCalled();
  });
});
