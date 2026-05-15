import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import Home from './Home';
import { AuthProvider } from '../context/AuthContext';
import { ThemeProvider } from '../context/ThemeContext';

describe('Home Page', () => {
  it('renders landing page content', () => {
    render(
      <BrowserRouter>
        <ThemeProvider>
          <AuthProvider>
            <Home />
          </AuthProvider>
        </ThemeProvider>
      </BrowserRouter>
    );
    expect(screen.getByText(/Find Your Dream/i)).toBeDefined();
  });
});
