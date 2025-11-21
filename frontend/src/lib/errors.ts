import axios from 'axios';
import { toast } from 'sonner@2.0.3';

export function parseApiError(error: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status ?? 0;
    const data = error.response?.data as Record<string, any> | undefined;

    if (data?.errors && typeof data.errors === 'object') {
      const firstError = Object.values(data.errors).flat().find((msg) => typeof msg === 'string');
      if (firstError) return firstError as string;
    }

    if (typeof data?.message === 'string' && data.message.trim()) {
      return data.message;
    }

    if (status >= 500) {
      return 'Server error. Please try again or contact support if it continues.';
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

export function showApiError(error: unknown, fallback?: string): string {
  const message = parseApiError(error, fallback);
  toast.error(message);
  return message;
}
