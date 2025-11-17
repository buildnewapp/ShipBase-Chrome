export type TokenBundle = {
  access_token: string;
  token_type: string; // e.g. Bearer
  client_id: string;
};

import { WEBSITE_URL, API_BASE } from "@/lib/config";

export type Credits = {
  left_credits: number;
  is_recharged: boolean;
  is_pro: boolean;
  is_vip: boolean;
};

export type UserInfo = {
  id: number;
  uuid: string;
  email: string;
  created_at: string;
  nickname: string | null;
  avatar_url: string | null;
  locale: string | null;
  signin_type: string | null;
  signin_ip: string | null;
  signin_provider: string | null;
  signin_openid: string | null;
  invite_code: string | null;
  updated_at: string | null;
  invited_by: string | null;
  is_affiliate: boolean | null;
  credits?: Credits;
};

const TOKEN_STORAGE_KEY = "auth.token";
const CLIENT_ID_STORAGE_KEY = "auth.client_id";

export function saveToken(token: TokenBundle) {
  try { localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(token)); } catch {}
}

export function readToken(): TokenBundle | null {
  try {
    const raw = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearToken() {
  try { localStorage.removeItem(TOKEN_STORAGE_KEY); } catch {}
}

export async function saveTokenToStorage(token: TokenBundle) {
  try {
    await chrome.storage?.local?.set?.({ [TOKEN_STORAGE_KEY]: token });
  } catch {}
}

export async function readTokenFromStorage(): Promise<TokenBundle | null> {
  try {
    const data = await chrome.storage?.local?.get?.(TOKEN_STORAGE_KEY);
    const tk = data?.[TOKEN_STORAGE_KEY];
    if (tk && tk.access_token) return tk as TokenBundle;
    return null;
  } catch {
    return null;
  }
}

export async function clearTokenFromStorage() {
  try { await chrome.storage?.local?.remove?.(TOKEN_STORAGE_KEY); } catch {}
}

export function generateClientId(): string {
  // 在 Service Worker 环境下没有 window.localStorage，这里需要兼容
  try {
    const cached = (typeof localStorage !== "undefined")
      ? localStorage.getItem(CLIENT_ID_STORAGE_KEY)
      : null;
    if (cached) return cached;
  } catch {}

  const id = (crypto as any)?.randomUUID?.() ?? crypto.getRandomValues(new Uint32Array(4)).join("");

  // 尽力持久化（分别尝试 localStorage 与 chrome.storage.local），失败则忽略
  try { if (typeof localStorage !== "undefined") localStorage.setItem(CLIENT_ID_STORAGE_KEY, id); } catch {}
  try { chrome?.storage?.local?.set?.({ [CLIENT_ID_STORAGE_KEY]: id }); } catch {}

  return id;
}

export function openAuthPage(clientId: string) {
  const url = `${WEBSITE_URL}/auth/signin?client_id=${encodeURIComponent(clientId)}&redirect_uri=chrome`;
  // 在 MV3 中无需声明 tabs 权限也可 create，但已在 manifest 保守声明
  chrome.tabs.create({ url });
}

export type PollHandle = { stop: () => void };

export function pollClientToken(clientId: string, onToken: (token: TokenBundle) => void, onError?: (e: unknown) => void): PollHandle {
  let stopped = false;
  const tick = async () => {
    if (stopped) return;
    try {
      const res = await fetch(`${API_BASE}/auth/client?client_id=${encodeURIComponent(clientId)}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      // 期望结构：{ code: 0, data: { client_id, access_token, token_type } }
      if (json && json.code === 0 && json.data?.access_token) {
        const token: TokenBundle = {
          client_id: json.data.client_id,
          access_token: json.data.access_token,
          token_type: json.data.token_type || "Bearer",
        };
        onToken(token);
        return; // 停止轮询
      }
    } catch (e) {
      onError?.(e);
    } finally {
      if (!stopped) {
        setTimeout(tick, 3000);
      }
    }
  };
  // 立即启动
  void tick();

  return {
    stop() {
      stopped = true;
    },
  };
}

export async function fetchUserInfo(token: TokenBundle): Promise<UserInfo> {
  const res = await fetch(`${API_BASE}/get-user-info`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `${token.token_type || "Bearer"} ${token.access_token}`,
    },
    body: "{}",
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  if (json && json.code === 0 && json.data) return json.data as UserInfo;
  throw new Error(json?.message || "Unexpected response");
}
