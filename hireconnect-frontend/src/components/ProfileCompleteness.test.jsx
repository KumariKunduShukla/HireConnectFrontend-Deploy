import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect } from 'vitest';
import ProfileCompleteness from './ProfileCompleteness';

const renderWithRouter = (ui) => {
  return render(ui, { wrapper: BrowserRouter });
};

describe('ProfileCompleteness Component', () => {
  it('renders correctly for incomplete profile', () => {
    const profile = { fullName: 'John Doe' };
    renderWithRouter(<ProfileCompleteness profile={profile} role="CANDIDATE" />);
    
    expect(screen.getByText('Profile Strength')).toBeDefined();
    expect(screen.getByText('15%')).toBeDefined(); // Name only = 15%
    expect(screen.getByText(/Add Professional Headline/i)).toBeDefined();
  });

  it('renders success state for 100% complete profile', () => {
    const profile = {
      fullName: 'John Doe',
      headline: 'Dev',
      bio: 'Bio',
      location: 'Loc',
      phone: '123',
      skills: ['React'],
      resumeUrl: 'url'
    };
    renderWithRouter(<ProfileCompleteness profile={profile} role="CANDIDATE" />);
    
    expect(screen.getByText('Profile Perfected!')).toBeDefined();
    expect(screen.queryByText('Next Steps:')).toBeNull();
  });

  it('handles null profile gracefully', () => {
    renderWithRouter(<ProfileCompleteness profile={null} role="CANDIDATE" />);
    expect(screen.getByText('0%')).toBeDefined();
    expect(screen.getByText(/Add Create your profile/i)).toBeDefined();
  });
});
