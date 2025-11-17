import React from "react"

import "~style.css"
import { AccountPanel } from "~features/account-panel"
import { Button } from "~components/ui/button"
import { useMemo } from "react"
import { useStorage } from "~lib/use-storage"
import en from "~i18n/en.json"
import zhCN from "~i18n/zh.json"

const IndexPopup = () => {
  const [lang] = useStorage<"en" | "zh">("language", "en")
  const t = useMemo(() => ({ en, zh: zhCN } as any)[lang || "en"], [lang])
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
