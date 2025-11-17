/// <reference path="../lib/globals.d.ts" />
import { generateClientId, saveTokenToStorage, type TokenBundle } from "@/lib/auth";
import { WEBSITE_URL, API_BASE } from "@/lib/config";

// 注意：WXT 提供 defineBackground 宏，无需显式导入
export default defineBackground(() => {
  console.log('[background] init');
  let authInProgress = false;
  let currentLoginTabId: number | null = null;
  let pollTimer: number | null = null;

  function stopPolling() {
    if (pollTimer != null) {
      clearTimeout(pollTimer);
      pollTimer = null;
    }
    authInProgress = false;
  }

  async function startAuthFlow() {
    authInProgress = true;
    try {
      const clientId = generateClientId();
      const loginUrl = `${WEBSITE_URL}/auth/signin?client_id=${encodeURIComponent(clientId)}&redirect_uri=chrome`;

      // 打开登录页
      await new Promise<number | null>((resolve) => {
        chrome.tabs.create({ url: loginUrl, active: true }, (tab: any) => resolve(tab?.id ?? null));
      }).then((id) => (currentLoginTabId = id));

      const tick = async () => {
        try {
          const res = await fetch(`${API_BASE}/auth/client?client_id=${encodeURIComponent(clientId)}`);
          if (res.ok) {
            const json = await res.json();
            if (json && json.code === 0 && json.data?.access_token) {
              const token: TokenBundle = {
                client_id: json.data.client_id,
                access_token: json.data.access_token,
                token_type: json.data.token_type || "Bearer",
              };
              await saveTokenToStorage(token);
              // 通知所有视图
              chrome.runtime.sendMessage({ type: "auth.success", payload: token });
              // 关闭登录页
              if (currentLoginTabId != null) {
                try { chrome.tabs.remove(currentLoginTabId); } catch {}
              }
              stopPolling();
              return;
            }
          }
        } catch (e) {
          // 忽略错误，继续轮询
        }
        // 继续 3 秒后轮询
        // @ts-ignore
        pollTimer = setTimeout(tick, 3000) as unknown as number;
      };
      await tick();
    } catch (e) {
      stopPolling();
    }
  }

  chrome.runtime.onMessage.addListener((msg: any, _sender: any, sendResponse: any) => {
    if (msg?.type === 'auth.start') {
      void startAuthFlow();
      try { sendResponse({ ok: true }); } catch {}
      return true;
    }
    return false;
  });
});
