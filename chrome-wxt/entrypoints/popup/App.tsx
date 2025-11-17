import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { useI18n, type Locale } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { WEBSITE_URL } from "@/lib/config";
import {
  fetchUserInfo,
  readTokenFromStorage,
  saveTokenToStorage,
  clearTokenFromStorage,
  openAuthPage,
  pollClientToken,
  generateClientId,
  type TokenBundle,
  type UserInfo,
} from "@/lib/auth";

type AppProps = {
  variant?: "popup" | "sidepanel";
};

function App({ variant = "popup" }: AppProps) {
  const { t, locale, setLocale } = useI18n();
  const { theme, setTheme } = useTheme();
  const [token, setToken] = useState<TokenBundle | null>(null);
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<{ stop: () => void } | null>(null);

  // 初始化 token 并尝试拉取用户信息
  useEffect(() => {
    // 从 chrome.storage 读取 token（由后台写入）
    readTokenFromStorage().then((cached) => {
      if (cached) {
        setToken(cached);
        setLoading(true);
        fetchUserInfo(cached)
          .then(setUser)
          .catch((e) => setError(String(e)))
          .finally(() => setLoading(false));
      }
    });

    // 监听后台的登录成功广播
    const onMsg = (msg: any) => {
      if (msg?.type === "auth.success" && msg.payload?.access_token) {
        const tk = msg.payload as TokenBundle;
        setToken(tk);
        setLoading(true);
        fetchUserInfo(tk)
          .then(setUser)
          .catch((e) => setError(String(e)))
          .finally(() => setLoading(false));
      }
    };
    chrome.runtime.onMessage.addListener(onMsg);
    return () => chrome.runtime.onMessage.removeListener(onMsg);
  }, []);

  // 登录动作：打开页面并轮询 client token
  const startAuthFallback = () => {
    try {
      const clientId = generateClientId();
      openAuthPage(clientId);
      // 开始在 popup 侧轮询，拿到 token 后与后台对齐
      pollRef.current = pollClientToken(
        clientId,
        async (tk) => {
          try { await saveTokenToStorage(tk); } catch {}
          setToken(tk);
          try {
            const u = await fetchUserInfo(tk);
            setUser(u);
          } catch (e) {
            setError(String(e));
          } finally {
            setLoading(false);
          }
        },
        (e) => {
          // 轮询期间的错误忽略为主，仅记录
          console.warn("poll error", e);
        },
      );
    } catch (e) {
      setError(String(e));
      setLoading(false);
    }
  };

  const onSignIn = () => {
    // 由后台 Service Worker 承担打开登录页与轮询逻辑
    setError(null);
    setLoading(true);
    try {
      chrome.runtime.sendMessage({ type: "auth.start" }, (res: any) => {
        // 捕获 runtime 错误或后端返回非 ok，避免一直卡在“等待中”
        const err = chrome.runtime?.lastError;
        if (err) {
          // 后台不可达时，切换到前端兜底流程
          startAuthFallback();
          return;
        }
        if (!res || res.ok !== true) {
          // 后台未响应或返回失败，切换到前端兜底流程
          startAuthFallback();
        }
      });
    } catch (e) {
      // 异常也走兜底
      startAuthFallback();
    }
  };

  const onSignOut = () => {
    pollRef.current?.stop();
    void clearTokenFromStorage();
    setToken(null);
    setUser(null);
    setError(null);
  };

  useEffect(() => () => pollRef.current?.stop(), []);

  const isSignedIn = useMemo(() => !!token && !!user, [token, user]);

  const onOpenSidepanel = async () => {
    try {
      const url = chrome.runtime.getURL("sidepanel.html");
      if (chrome.sidePanel?.setOptions) {
        await new Promise<void>((resolve) => chrome.sidePanel.setOptions({ path: url, enabled: true }, () => resolve()));
      }
      const win = await new Promise<any>((resolve) => chrome.windows?.getCurrent?.(resolve));
      if (chrome.sidePanel?.open) {
        await new Promise<void>((resolve) => chrome.sidePanel.open({ windowId: win?.id }, () => resolve()));
      }
    } catch (e) {
      setError(String(e));
    }
  };

  const onOpenWebsite = async () => {
    try {
      await chrome.tabs.create({ url: WEBSITE_URL });
    } catch (e) {
      setError(String(e));
    }
  };

  return (
    <div className="w-full min-w-[400px] p-4 space-y-4 bg-white rounded-md shadow-md">
      {/* Header: 左名称 + 右语言/主题切换 */}
      <div className="flex items-center justify-between">
        <div className="text-base font-semibold text-gray-900">{t("app_name")}</div>
        <div className="flex items-center gap-2">
          <Select value={locale} onValueChange={(v) => setLocale(v as Locale)}>
            <SelectTrigger className="w-28 h-8 text-xs">
              <SelectValue placeholder={t("switch_language") as string} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="zh">中文</SelectItem>
            </SelectContent>
          </Select>
          <Select value={theme} onValueChange={(v) => setTheme(v as any)}>
            <SelectTrigger className="w-28 h-8 text-xs">
              <SelectValue placeholder={t("theme") as string} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="system">{t("theme_system")}</SelectItem>
              <SelectItem value="light">{t("theme_light")}</SelectItem>
              <SelectItem value="dark">{t("theme_dark")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 登录状态区块 */}
      {!isSignedIn ? (
        <div className="rounded-md border border-gray-200 p-3 space-y-3">
          <p className="text-sm text-gray-700">{t("open_login_page")}</p>
          <div className="flex items-center gap-2">
            <Button onClick={onSignIn} disabled={loading} className="flex-1">
              {loading ? t("signing_in") : t("sign_in")}
            </Button>
          </div>
          {error ? (
            <div className="text-xs text-red-600 break-all">{error}</div>
          ) : null}
        </div>
      ) : (
        <div className="rounded-md border border-gray-200 p-3 space-y-3">
          <div className="flex items-center gap-3">
            {user?.avatar_url ? (
              <img src={user.avatar_url} alt="avatar" className="h-10 w-10 rounded-full border" />
            ) : (
              <div className="h-10 w-10 rounded-full bg-gray-200" />
            )}
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-900 truncate">
                {t("signed_in_as")} {user?.nickname || user?.email}
              </div>
              <div className="text-xs text-gray-600 truncate">{user?.email}</div>
            </div>
            <Button variant="outline" size="sm" onClick={onSignOut}>
              {t("sign_out")}
            </Button>
          </div>

          {user?.credits ? (
            <div className="text-xs text-gray-700 space-y-1">
              <div>
                {t("credits")} · {t("left_credits")}: {user.credits.left_credits}
              </div>
              <div className="flex gap-2">
                {user.credits.is_pro ? (
                  <span className="inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] bg-blue-50 border-blue-200 text-blue-700">
                    {t("pro")}
                  </span>
                ) : null}
                {user.credits.is_vip ? (
                  <span className="inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] bg-yellow-50 border-yellow-200 text-yellow-700">
                    {t("vip")}
                  </span>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>
      )}
      {/* 功能区块（预留） */}
      <div className="rounded-md border border-dashed border-gray-200 p-3 min-h-16" />

      {/* Footer 菜单入口 */}
      <div className="pt-1 space-y-2">
        {variant !== "sidepanel" ? (
          <Button variant="outline" onClick={onOpenSidepanel} className="w-full">
            {t("open_in_sidebar")}
          </Button>
        ) : null}
        <Button variant="outline" onClick={onOpenWebsite} className="w-full">
          {t("open_official_website")}
        </Button>
      </div>
    </div>
  );
}

export default App;
