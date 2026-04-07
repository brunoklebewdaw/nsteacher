'use server';

import { headers } from 'next/headers';

const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY;

export async function verifyInternalApiKey(): Promise<boolean> {
  if (!INTERNAL_API_KEY) {
    console.error('[Security] INTERNAL_API_KEY não configurada');
    return false;
  }

  const headersList = await headers();
  const providedKey = headersList.get('x-api-key');

  if (!providedKey) {
    return false;
  }

  return providedKey === INTERNAL_API_KEY;
}

export function getApiKeyHeader(): string {
  return INTERNAL_API_KEY || '';
}
