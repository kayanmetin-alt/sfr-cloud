const MIN_LENGTH = 8;
const MAX_LENGTH = 64;
const REQUIRE_UPPERCASE = true;
const REQUIRE_LOWERCASE = true;
const REQUIRE_NUMBERS = true;
const REQUIRE_SPECIAL = false;

export function validatePassword(password) {
  const errors = [];
  if (password.length < MIN_LENGTH) errors.push(`Parola en az ${MIN_LENGTH} karakter olmalı`);
  if (password.length > MAX_LENGTH) errors.push(`Parola en fazla ${MAX_LENGTH} karakter olabilir`);
  if (REQUIRE_UPPERCASE && !/[A-Z]/.test(password)) errors.push('En az bir büyük harf gerekli');
  if (REQUIRE_LOWERCASE && !/[a-z]/.test(password)) errors.push('En az bir küçük harf gerekli');
  if (REQUIRE_NUMBERS && !/\d/.test(password)) errors.push('En az bir rakam gerekli');
  if (REQUIRE_SPECIAL && !/[^A-Za-z0-9\s]/.test(password)) errors.push('En az bir özel karakter gerekli');
  return { valid: errors.length === 0, errors };
}

export function validateSetup(password, confirmation) {
  const r = validatePassword(password);
  if (password !== confirmation) r.errors.push('Parolalar eşleşmiyor');
  r.valid = r.errors.length === 0;
  return r;
}
