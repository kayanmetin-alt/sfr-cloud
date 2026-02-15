/**
 * Parola gücü: 0 = zayıf, 1 = orta, 2 = güçlü
 */
export function getPasswordStrength(password) {
  if (!password || password.length === 0) return { level: 0, label: '', width: 0 };
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;
  const level = score <= 2 ? 0 : score <= 4 ? 1 : 2;
  const labels = ['Zayıf', 'Orta', 'Güçlü'];
  const width = level === 0 ? 33 : level === 1 ? 66 : 100;
  return { level, label: labels[level], width };
}
