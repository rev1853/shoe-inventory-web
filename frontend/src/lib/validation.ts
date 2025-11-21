export function requiredText(value: string, label: string, maxLength?: number): string | null {
  const trimmed = value?.trim() ?? '';
  if (!trimmed) return `${label} is required.`;
  if (maxLength && trimmed.length > maxLength) return `${label} must be at most ${maxLength} characters.`;
  return null;
}

export function optionalText(value: string, label: string, maxLength: number): string | null {
  const trimmed = value?.trim() ?? '';
  if (!trimmed) return null;
  if (trimmed.length > maxLength) return `${label} must be at most ${maxLength} characters.`;
  return null;
}

export function nonNegativeNumber(value: string, label: string): string | null {
  const num = Number(value);
  if (Number.isNaN(num)) return `${label} must be a number.`;
  if (num < 0) return `${label} cannot be negative.`;
  return null;
}

export function decimalMax(value: string, label: string, max: number, decimals: number): string | null {
  const num = Number(value);
  if (Number.isNaN(num)) return `${label} must be a number.`;
  const fixed = Number(num.toFixed(decimals));
  if (fixed !== num) return `${label} must have at most ${decimals} decimal place${decimals === 1 ? '' : 's'}.`;
  if (num < 0) return `${label} cannot be negative.`;
  if (num > max) return `${label} must be ${max} or less.`;
  return null;
}

export function positiveInteger(value: string, label: string): string | null {
  if (!value) return `${label} is required.`;
  const num = Number(value);
  if (!Number.isInteger(num) || num <= 0) return `${label} must be a positive whole number.`;
  return null;
}

export function nonNegativeInteger(value: string, label: string): string | null {
  if (value === undefined || value === null || value === '') return `${label} is required.`;
  const num = Number(value);
  if (!Number.isInteger(num) || num < 0) return `${label} must be a whole number 0 or greater.`;
  return null;
}

export function positiveNumber(value: string, label: string): string | null {
  const num = Number(value);
  if (Number.isNaN(num)) return `${label} must be a number.`;
  if (num <= 0) return `${label} must be greater than 0.`;
  return null;
}

export function maxNumber(value: string, label: string, max: number): string | null {
  const num = Number(value);
  if (Number.isNaN(num)) return `${label} must be a number.`;
  if (num > max) return `${label} must be ${max} or less.`;
  return null;
}
