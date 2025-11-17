import { useEffect, useState } from "react"

export function useStorage<T>(key: string, defaultValue?: T) {
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

