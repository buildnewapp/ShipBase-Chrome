import React, { useEffect, useMemo, useState } from "react"
import { Button } from "~components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "~components/ui/select"
import en from "~i18n/en.json"
import zhCN from "~i18n/zh.json"

type AuthData = {
  access_token: string
  token_type: string
}

type UserInfo = Record<string, any>

type Lang = "en" | "zh"
type ThemeMode = "system" | "light" | "dark"

const STORAGE_KEYS = {
  language: "language",
  auth: "auth",
  user: "user",
  theme: "theme"
}

const translations: Record<Lang, Record<string, string>> = { en: en as any, zh: zhCN as any }

function useStorage<T>(key: string, defaultValue?: T) {
  const [value, setValue] = useState<T | undefined>(defaultValue)

  useEffect(() => {
    chrome.storage.local.get(key).then((res) => setValue(res?.[key] ?? defaultValue))
    const onChanged = (
      changes: { [key: string]: chrome.storage.StorageChange },
      area: string
    ) => {
      if (area !== "local" || !(key in changes)) return
      setValue(changes[key].newValue)
    }
    chrome.storage.onChanged.addListener(onChanged)
    return () => chrome.storage.onChanged.removeListener(onChanged)
  }, [key])

  const update = (v: T) => chrome.storage.local.set({ [key]: v })
  return [value, update] as const
}

export const AccountPanel = () => {
  const [lang, setLang] = useStorage<Lang>(STORAGE_KEYS.language)
  const fallbackLang: Lang = useMemo(() => {
    const ui = (chrome?.i18n?.getUILanguage?.() as string | undefined) || navigator.language || "en"
    return ui.toLowerCase().startsWith("zh") ? "zh" : "en"
  }, [])
  useEffect(() => {
    if (!lang) setLang(fallbackLang)
  }, [lang, fallbackLang, setLang])
  const t = useMemo(() => translations[(lang as Lang) || fallbackLang], [lang, fallbackLang])

  const [auth] = useStorage<AuthData>(STORAGE_KEYS.auth)
  const [user] = useStorage<UserInfo>(STORAGE_KEYS.user)
  const [theme, setTheme] = useStorage<ThemeMode>(STORAGE_KEYS.theme, "system")
  const [isStarting, setIsStarting] = useState(false)

  const handleSignIn = async () => {
    setIsStarting(true)
    try {
      await chrome.runtime.sendMessage({ type: "START_CLIENT_AUTH" })
    } catch (e) {
      // ignore
    }
  }

  const handleLogout = async () => {
    await chrome.runtime.sendMessage({ type: "LOGOUT" })
    setIsStarting(false)
  }

  useEffect(() => {
    const listener = (msg: any) => {
      if (msg?.type === "AUTH_UPDATED") {
        setIsStarting(false)
      }
    }
    chrome.runtime.onMessage.addListener(listener)
    return () => chrome.runtime.onMessage.removeListener(listener)
  }, [])

  useEffect(() => {
    const root = document.documentElement
    const mql = window.matchMedia("(prefers-color-scheme: dark)")

    const apply = () => {
      root.classList.remove("dark")
      const isDark = theme === "dark" || (theme === "system" && mql.matches)
      if (isDark) root.classList.add("dark")
    }

    apply()
    if (theme === "system") {
      const handler = () => apply()
      mql.addEventListener?.("change", handler)
      return () => mql.removeEventListener?.("change", handler)
    }
  }, [theme])

  return (
    <div className="w-full min-w-[400px] min-h-[10rem] p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="text-base font-semibold">{t.title}</div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">{t.language}</span>
          <Select value={lang || "en"} onValueChange={(v) => setLang(v as Lang)}>
            <SelectTrigger className="w-[120px] h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="zh">中文</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-xs text-slate-500">{t.theme}</span>
          <Select value={theme || "system"} onValueChange={(v) => setTheme(v as ThemeMode)}>
            <SelectTrigger className="w-[140px] h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="system">{t.system}</SelectItem>
              <SelectItem value="light">{t.light}</SelectItem>
              <SelectItem value="dark">{t.dark}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {!auth?.access_token ? (
        <div className="flex flex-col items-start gap-2">
          <Button onClick={handleSignIn} disabled={isStarting} className="w-full">
            {isStarting ? t.signingIn : t.signIn}
          </Button>
          <p className="text-xs text-slate-500">
            https://freesoragenerator.com/auth/signin → poll every 3s
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            {user?.avatar_url ? (
              <img
                src={user.avatar_url}
                className="w-10 h-10 rounded-full"
                alt="avatar"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-slate-200" />
            )}
            <div className="flex flex-col">
              <div className="text-sm font-medium">
                {t.loggedInAs}: {user?.nickname || user?.email || ""}
              </div>
              <div className="text-xs text-slate-500">{user?.email || ""}</div>
            </div>
          </div>
          {user?.credits ? (
            <div className="text-sm">
              {t.credits}: {user.credits.left_credits}
            </div>
          ) : null}
          <Button variant="outline" onClick={handleLogout} className="w-full">
            {t.logout}
          </Button>
        </div>
      )}
    </div>
  )
}

export default AccountPanel
