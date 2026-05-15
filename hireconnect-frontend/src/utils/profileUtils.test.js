import { describe, it, expect } from 'vitest';
import { calculateProfileCompleteness } from './profileUtils';

describe('calculateProfileCompleteness', () => {
  it('should return 0% for null profile', () => {
    const result = calculateProfileCompleteness(null);
    expect(result.percentage).toBe(0);
    expect(result.missingItems).toContain('Create your profile');
  });

  it('should calculate 100% for a complete Candidate profile', () => {
    const profile = {
      fullName: 'John Doe',
      headline: 'Software Engineer',
      bio: 'Experienced developer',
      location: 'New York',
      phone: '1234567890',
      skills: ['React', 'Node.js'],
      resumePath: '/path/to/resume.pdf'
    };
    const result = calculateProfileCompleteness(profile, 'CANDIDATE');
    expect(result.percentage).toBe(100);
    expect(result.missingItems.length).toBe(0);
  });

  it('should calculate partial percentage and identify missing items', () => {
    const profile = {
      fullName: 'John Doe',
      skills: 'React, Node.js'
    };
    const result = calculateProfileCompleteness(profile, 'CANDIDATE');
    // Name (15) + Skills (15) = 30
    expect(result.percentage).toBe(30);
    expect(result.missingItems).toContain('Professional Headline');
    expect(result.missingItems).toContain('Professional Bio');
    expect(result.missingItems).toContain('Upload Resume');
  });

  it('should calculate 100% for a complete Recruiter profile', () => {
    const profile = {
      fullName: 'Jane Smith',
      headline: 'HR Manager',
      bio: 'Hiring top talent',
      location: 'London',
      phone: '0987654321',
      skills: ['Recruitment', 'HR'],
      companyName: 'TechCorp'
    };
    const result = calculateProfileCompleteness(profile, 'RECRUITER');
    expect(result.percentage).toBe(100);
    expect(result.missingItems.length).toBe(0);
  });
});
