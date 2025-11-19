import { defineConfig } from "wxt";
import tailwindcss from "@tailwindcss/vite";

// See https://wxt.dev/api/config.html
export default defineConfig({
  outDir: "build",
  modules: ["@wxt-dev/module-react"],
  vite: () => ({
    plugins: [tailwindcss()],
  }),
  // 声明 MV3 权限与域名白名单，支持跨域请求与打开登录页
  manifest: {
    default_locale: "en",
    name: "__MSG_extName__",
    description: "__MSG_extDescription__",
    permissions: [
      // 使用 chrome.tabs.create 打开授权页面
      "tabs",
      // 使用 chrome.storage 在后台与各视图共享 token
      "storage",
    ],
    host_permissions: [
      "https://freesoragenerator.com/*",
    ],
  },
});
