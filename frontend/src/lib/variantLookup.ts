import api from './api';
import { ProductVariant } from './types';

export async function fetchVariantByCode(code: string): Promise<ProductVariant> {
  const trimmed = code.trim();
  if (!trimmed) {
    throw new Error('QR code was empty.');
  }

  const response = await api.get<{ data: ProductVariant } | ProductVariant>('/variants/scan', {
    params: { code: trimmed },
  });

  const payload = (response.data as any).data ?? response.data;

  return payload as ProductVariant;
}
