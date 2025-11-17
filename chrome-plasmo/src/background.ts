// Background service worker for client authorization login flow
// - Opens signin page with random client_id
// - Polls client token every 3s using chrome.alarms until token arrives
// - Fetches user info and stores into chrome.storage.local

type AuthData = {
  access_token: string
  token_type: string
}

type UserInfo = Record<string, any>

const ORIGIN = "https://freesoragenerator.com"
const AUTH_PAGE = `${ORIGIN}/auth/signin`
const CLIENT_POLL_API = `${ORIGIN}/api/auth/client`
const USER_INFO_API = `${ORIGIN}/api/get-user-info`

const STORAGE_KEYS = {
  language: "language",
  clientId: "client_id",
  auth: "auth",
  user: "user",
  theme: "theme"
}

const ALARM_PREFIX = "client-auth-"

const genClientId = () => crypto.getRandomValues(new Uint32Array(4)).join("")

async function setStorage(items: Record<string, any>) {
  await chrome.storage.local.set(items)
}

async function getStorage<T = any>(key: string): Promise<T | undefined> {
  const v = await chrome.storage.local.get(key)
  return v?.[key]
}

async function clearAuth() {
  await chrome.storage.local.remove([STORAGE_KEYS.auth, STORAGE_KEYS.user, STORAGE_KEYS.clientId])
}

async function openSigninTab(clientId: string) {
  const url = `${AUTH_PAGE}?client_id=${encodeURIComponent(clientId)}&redirect_uri=chrome`
  await chrome.tabs.create({ url })
}

async function pollClientToken(clientId: string): Promise<AuthData | null> {
  const url = `${CLIENT_POLL_API}?client_id=${encodeURIComponent(clientId)}`
  const res = await fetch(url, { method: "GET" })
  if (!res.ok) return null
  const data = await res.json().catch(() => null)
  if (data?.code === 0 && data?.data?.access_token) {
    return {
      access_token: data.data.access_token as string,
      token_type: (data.data.token_type as string) || "Bearer"
    }
  }
  return null
}

async function fetchUserInfo(auth: AuthData): Promise<UserInfo | null> {
  const res = await fetch(USER_INFO_API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `${auth.token_type || "Bearer"} ${auth.access_token}`
    },
    body: JSON.stringify({})
  })
  if (!res.ok) return null
  const data = await res.json().catch(() => null)
  if (data?.code === 0 && data?.data) {
    return data.data as UserInfo
  }
  return null
}

async function startAuthFlow() {
  // If already logged in, do nothing
  const existing = await getStorage<AuthData>(STORAGE_KEYS.auth)
  if (existing?.access_token) return

  const clientId = genClientId()
  await setStorage({ [STORAGE_KEYS.clientId]: clientId })
  await openSigninTab(clientId)

  // Create/update alarm every 3 seconds
  const alarmName = `${ALARM_PREFIX}${clientId}`
  await chrome.alarms.create(alarmName, { periodInMinutes: 0.05 }) // ~3s
}

async function stopAuthAlarm() {
  const clientId = await getStorage<string>(STORAGE_KEYS.clientId)
  if (!clientId) return
  const alarmName = `${ALARM_PREFIX}${clientId}`
  await chrome.alarms.clear(alarmName)
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  ;(async () => {
    if (message?.type === "START_CLIENT_AUTH") {
      await startAuthFlow()
      sendResponse({ ok: true })
      return
    }
    if (message?.type === "LOGOUT") {
      await stopAuthAlarm()
      await clearAuth()
      sendResponse({ ok: true })
      return
    }
  })()
  return true // keep sendResponse async
})

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (!alarm.name.startsWith(ALARM_PREFIX)) return

  const clientId = await getStorage<string>(STORAGE_KEYS.clientId)
  if (!clientId) {
    await stopAuthAlarm()
    return
  }

  try {
    const auth = await pollClientToken(clientId)
    if (!auth) return

    await setStorage({ [STORAGE_KEYS.auth]: auth })

    const user = await fetchUserInfo(auth)
    if (user) {
      await setStorage({ [STORAGE_KEYS.user]: user })
    }

    await stopAuthAlarm()

    // Notify any UI listeners
    chrome.runtime.sendMessage({ type: "AUTH_UPDATED" }).catch(() => {})
  } catch (e) {
    // ignore transient errors; alarm will trigger again
  }
})

// On install/update, ensure language default
chrome.runtime.onInstalled.addListener(async () => {
  const lang = await getStorage<string>(STORAGE_KEYS.language)
  if (!lang) {
    const browserLang = chrome.i18n?.getUILanguage?.() || navigator.language || "en"
    const normalized = browserLang.toLowerCase().startsWith("zh") ? "zh" : "en"
    await setStorage({ [STORAGE_KEYS.language]: normalized })
  }
  const theme = await getStorage<string>(STORAGE_KEYS.theme)
  if (!theme) {
    await setStorage({ [STORAGE_KEYS.theme]: "system" })
  }
})
