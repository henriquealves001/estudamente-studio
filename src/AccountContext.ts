import { createContext, useContext } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
export type OwnAccount = { id: string; email: string; name: string; bio: string; avatar: string; publicProfile: boolean; ranking: boolean; identities: string[]; legacyAvailable: boolean; managedLogin: boolean };
export const AccountContext = createContext<{ account: OwnAccount | null; client: SupabaseClient | null; recovering: boolean; error: string; refresh: () => Promise<void>; logout: () => Promise<void>; recovered: () => void; accountOpen: boolean; setAccountOpen: (open: boolean) => void } | null>(null);
export function useAccount() { const value = useContext(AccountContext); if (!value) throw Error('Conta indisponível.'); return value; }
export async function accountRequest<T = { ok: boolean }>(path: string, method = 'GET', data?: unknown, bearer?: string, expectedAccount?: string): Promise<T> {
  const bytes = data instanceof Blob;
  const response = await fetch('/api/account/' + path, { method, credentials: 'same-origin', headers: { ...(data && !bytes ? { 'content-type': 'application/json' } : {}), ...(bearer ? { authorization: 'Bearer ' + bearer } : {}), ...(expectedAccount ? { 'x-em-account': expectedAccount } : {}) }, body: data ? (bytes ? data : JSON.stringify(data)) : undefined });
  const result = await response.json() as { error?: string };
  if (!response.ok) throw Error(result.error || 'Não foi possível acessar sua conta.');
  return result as T;
}
