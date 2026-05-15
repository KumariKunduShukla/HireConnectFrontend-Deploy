
export const calculateProfileCompleteness = (profile, role = 'CANDIDATE') => {
  if (!profile) {
    return { percentage: 0, missingItems: ['Create your profile'] };
  }

  const missingItems = [];
  let score = 0;
  const totalWeight = 100;

  // Common Fields
  if (profile.fullName || profile.name) score += 15;
  else missingItems.push('Full Name');

  if (profile.headline) score += 15;
  else missingItems.push('Professional Headline');

  if (profile.bio) score += 20;
  else missingItems.push('Professional Bio');

  if (profile.location) score += 10;
  else missingItems.push('Location');

  if (profile.phone) score += 10;
  else missingItems.push('Phone Number');

  // Skills (Array or comma-separated string)
  const skills = Array.isArray(profile.skills) ? profile.skills : (profile.skills || '').split(',').filter(Boolean);
  if (skills.length > 0) score += 15;
  else missingItems.push('Skills');

  // Role-specific
  if (role === 'RECRUITER') {
    if (profile.companyName) score += 15;
    else missingItems.push('Company Name');
  } else {
    // Candidates need a resume
    if (profile.resumePath || profile.resumeUrl) score += 15;
    else missingItems.push('Upload Resume');
  }

  return {
    percentage: Math.min(score, totalWeight),
    missingItems,
  };
};
