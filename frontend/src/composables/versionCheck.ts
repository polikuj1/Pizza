import { ref } from 'vue';

interface VersionInfo {
  version: string;
  buildTime: string;
}

let currentVersion: string | null = null;
export const hasNewVersion = ref(false);

async function fetchVersion(): Promise<VersionInfo | null> {
  try {
    // 加上時間戳避免快取
    const res = await fetch(`/version.json?t=${Date.now()}`, {
      cache: 'no-cache',
      headers: { 'Cache-Control': 'no-cache' },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.warn('版本檢查失敗:', err);
    return null;
  }
}

/**
 * 頁面載入時檢查一次版本
 * 如果偵測到新版本，會顯示更新提示
 */
export async function checkVersionOnce() {
  const versionInfo = await fetchVersion();
  if (!versionInfo) return;

  if (currentVersion === null) {
    // 首次載入，記錄當前版本
    currentVersion = versionInfo.version;
    return;
  }

  if (versionInfo.version !== currentVersion) {
    // 發現新版本，顯示更新提示
    hasNewVersion.value = true;
  }
}

export function useVersionCheck() {
  // 頁面載入時檢查一次
  checkVersionOnce();

  return { hasNewVersion };
}
