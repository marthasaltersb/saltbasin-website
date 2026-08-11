export const PASSWORD_POLICY = Object.freeze({ minimumLength: 12, requireUppercase: true, requireNumber: true, requireSpecial: true, historyDepth: 5 });

export function validatePasswordPolicy(password) {
  const errors = [];
  if (typeof password !== 'string' || password.length < PASSWORD_POLICY.minimumLength) errors.push(`Use at least ${PASSWORD_POLICY.minimumLength} characters.`);
  if (!/[A-Z]/.test(password || '')) errors.push('Include at least one capital letter.');
  if (!/[0-9]/.test(password || '')) errors.push('Include at least one number.');
  if (!/[^A-Za-z0-9]/.test(password || '')) errors.push('Include at least one special character.');
  return { valid: errors.length === 0, errors, policy: PASSWORD_POLICY };
}
