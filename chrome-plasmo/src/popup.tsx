import React, { useEffect, useMemo } from "react"

import "~style.css"
import { AccountPanel } from "~features/account-panel"
import { Button } from "~components/ui/button"
import { useStorage } from "~lib/use-storage"
import en from "~i18n/en.json"
import zhCN from "~i18n/zh.json"

const IndexPopup = () => {
  const [lang, setLang] = useStorage<"en" | "zh">("language")

  const fallbackLang = useMemo(() => {
    const ui = (chrome?.i18n?.getUILanguage?.() as string | undefined) || navigator.language || "en"
    return ui.toLowerCase().startsWith("zh") ? "zh" : "en"
  }, [])

  useEffect(() => {
    if (!lang) {
      // 首次使用：根据浏览器语言初始化并持久化
      setLang(fallbackLang)
    }
  }, [lang, fallbackLang, setLang])

  const t = useMemo(() => ({ en, zh: zhCN } as const)[(lang as any) || fallbackLang], [lang, fallbackLang])
  const openInSidePanel = async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
      if (tab?.id) {
        await chrome.sidePanel.setOptions({
          tabId: tab.id,
          path: "sidepanel.html",
          enabled: true
        })
        await chrome.sidePanel.open({ tabId: tab.id })
      }
    } catch (e) {
      // ignore
    }
  }

  return (
    <div>
      <AccountPanel />
      <div className="px-4 pb-3">
        <Button variant="outline" onClick={openInSidePanel} className="w-full text-xs">
          {t.openInSidePanel}
        </Button>
      </div>
    </div>
  )
}

export default IndexPopup
