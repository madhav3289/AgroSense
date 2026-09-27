// Password Generator Utility
export const generatePassword = (options = {}) => {
  const {
    length = 12,
    includeUppercase = true,
    includeLowercase = true,
    includeNumbers = true,
    includeSymbols = true,
    excludeSimilar = true
  } = options;

  let charset = '';
  
  if (includeLowercase) {
    charset += 'abcdefghijklmnopqrstuvwxyz';
  }
  
  if (includeUppercase) {
    charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  }
  
  if (includeNumbers) {
    charset += '0123456789';
  }
  
  if (includeSymbols) {
    charset += '!@#$%^&*()_+-=[]{}|;:,.<>?';
  }
  
  // Remove similar characters if requested
  if (excludeSimilar) {
    charset = charset.replace(/[0O1lI]/g, '');
  }
  
  let password = '';
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  
  return password;
};

// Password strength checker
export const checkPasswordStrength = (password) => {
  let score = 0;
  const feedback = [];
  
  // Length check
  if (password.length >= 8) score += 1;
  else feedback.push('At least 8 characters');
  
  if (password.length >= 12) score += 1;
  
  // Character variety checks
  if (/[a-z]/.test(password)) score += 1;
  else feedback.push('Lowercase letters');
  
  if (/[A-Z]/.test(password)) score += 1;
  else feedback.push('Uppercase letters');
  
  if (/[0-9]/.test(password)) score += 1;
  else feedback.push('Numbers');
  
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  else feedback.push('Special characters');
  
  // Common patterns check
  if (!/(.)\1{2,}/.test(password)) score += 1; // No repeated characters
  else feedback.push('Avoid repeated characters');
  
  if (!/123|abc|qwe|password|admin/i.test(password)) score += 1; // No common patterns
  else feedback.push('Avoid common patterns');
  
  // Determine strength level
  let strength = 'weak';
  let color = 'red';
  
  if (score >= 6) {
    strength = 'strong';
    color = 'green';
  } else if (score >= 4) {
    strength = 'medium';
    color = 'yellow';
  }
  
  return {
    score,
    strength,
    color,
    feedback: feedback.length > 0 ? feedback : ['Password looks good!']
  };
};

// Predefined password options
export const passwordOptions = {
  strong: {
    length: 16,
    includeUppercase: true,
    includeLowercase: true,
    includeNumbers: true,
    includeSymbols: true,
    excludeSimilar: true
  },
  medium: {
    length: 12,
    includeUppercase: true,
    includeLowercase: true,
    includeNumbers: true,
    includeSymbols: false,
    excludeSimilar: true
  },
  simple: {
    length: 10,
    includeUppercase: true,
    includeLowercase: true,
    includeNumbers: true,
    includeSymbols: false,
    excludeSimilar: false
  }
};
