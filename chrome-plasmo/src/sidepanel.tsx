import React from "react"

import "~style.css"
import { AccountPanel } from "~features/account-panel"

const SidePanel = () => {
  return (
    <div className="min-h-[10rem]">
      <AccountPanel />
    </div>
  )
}

export default SidePanel
