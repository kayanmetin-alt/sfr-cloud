import React from 'react';
import { getPasswordStrength } from '../lib/passwordStrength';

export function PasswordStrengthBar({ password }) {
  const { level, label, width } = getPasswordStrength(password);
  if (!password) return null;
  const colors = ['var(--danger)', 'var(--warning)', 'var(--success)'];
  return (
    <div className="password-strength">
      <div className="password-strength-bar">
        <div
          className="password-strength-fill"
          style={{ width: `${width}%`, backgroundColor: colors[level] }}
        />
      </div>
      <span className="password-strength-label" style={{ color: colors[level] }}>
        {label}
      </span>
    </div>
  );
}
