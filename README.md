# ShipBase Chrome Extensions / 项目说明

## English

This repository contains two WebExtension implementations of the ShipBase browser extension:
- `chrome-plasmo/`: Plasmo-based MV3 app (React + Tailwind + shadcn). Sources in `src/` (e.g., `src/popup.tsx`, `src/background.ts`, `src/sidepanel.tsx`).
- `chrome-wxt/`: WXT-based MV3 app (React + Tailwind + shadcn). Entry points in `entrypoints/` (popup, background, sidepanel), shared utilities in `lib/`, static assets in `assets/` and `public/`.

Architecture highlights
- Framework: React (Plasmo: 18, WXT: 19) + TailwindCSS + shadcn UI components.
- Features: Web OAuth sign-in and display of basic user info (name/email/avatar) in popup/sidepanel.
- Extension surfaces: background service worker, content scripts (where applicable), popup, side panel.

Usage
- Plasmo app
  - `cd chrome-plasmo && pnpm install`
  - Dev: `pnpm dev` → load `build/chrome-mv3-dev` as an unpacked extension.
  - Build: `pnpm build`; package: `pnpm package`.
- WXT app
  - `cd chrome-wxt && pnpm install`
  - Dev: `pnpm dev` (Chrome) or `pnpm dev:firefox`.
  - Build: `pnpm build`; zip: `pnpm zip`.

## 中文

本仓库包含 ShipBase 浏览器扩展的两套实现：
- `chrome-plasmo/`：基于 Plasmo 的 MV3 扩展（React + Tailwind + shadcn）。源码位于 `src/`（如 `src/popup.tsx`、`src/background.ts`、`src/sidepanel.tsx`）。
- `chrome-wxt/`：基于 WXT 的 MV3 扩展（React + Tailwind + shadcn）。入口位于 `entrypoints/`（popup、background、sidepanel），公共代码在 `lib/`，静态资源在 `assets/` 与 `public/`。

技术架构
- 前端框架：React（Plasmo: 18，WXT: 19）+ TailwindCSS + shadcn UI 组件。
- 功能：网页授权登录（OAuth），在弹窗/侧边栏展示用户基础信息（姓名/邮箱/头像）。
- 形态：后台 Service Worker、内容脚本（按需）、扩展弹窗、侧边面板。

使用说明
- Plasmo 项目
  - `cd chrome-plasmo && pnpm install`
  - 开发：`pnpm dev`，在浏览器加载 `build/chrome-mv3-dev` 目录。
  - 构建：`pnpm build`；打包：`pnpm package`。
- WXT 项目
  - `cd chrome-wxt && pnpm install`
  - 开发：`pnpm dev`（Chrome）或 `pnpm dev:firefox`。
  - 构建：`pnpm build`；压缩包：`pnpm zip`。

> Tips / 提示：修改权限与主机域名时，请同步更新 Plasmo `manifest` 或 WXT 的 `wxt.config.ts` 并在浏览器中重新加载扩展。

