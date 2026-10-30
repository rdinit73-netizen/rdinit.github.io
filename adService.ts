import { isNativeAndroid } from './storage';

const COVER_AD_COOLDOWN_KEY = 'exlibris_cover_ad_last_timestamp';
const LAST_FULLSCREEN_AD_KEY = 'exlibris_last_fullscreen_ad_timestamp';

// 60-second cooldown for Rewarded Ad on "Cerca Copertina"
export const COVER_SEARCH_COOLDOWN_SECONDS = 60;

// 5 minutes (300 seconds) for periodic Interstitial Ad
export const INTERSTITIAL_INTERVAL_SECONDS = 300;

export function getLastCoverAdTimestamp(): number {
  try {
    const raw = localStorage.getItem(COVER_AD_COOLDOWN_KEY);
    return raw ? Number(raw) : 0;
  } catch {
    return 0;
  }
}

export function setLastCoverAdTimestamp(timestamp: number): void {
  try {
    localStorage.setItem(COVER_AD_COOLDOWN_KEY, String(timestamp));
  } catch {
    // Ignore
  }
}

export function getCoverAdCooldownRemaining(): number {
  const lastTime = getLastCoverAdTimestamp();
  if (!lastTime) return 0;
  const elapsedSeconds = Math.floor((Date.now() - lastTime) / 1000);
  const remaining = COVER_SEARCH_COOLDOWN_SECONDS - elapsedSeconds;
  return remaining > 0 ? remaining : 0;
}

export function getLastFullscreenAdTimestamp(): number {
  try {
    const raw = localStorage.getItem(LAST_FULLSCREEN_AD_KEY);
    return raw ? Number(raw) : Date.now();
  } catch {
    return Date.now();
  }
}

export function resetFullscreenAdTimer(): void {
  try {
    localStorage.setItem(LAST_FULLSCREEN_AD_KEY, String(Date.now()));
  } catch {
    // Ignore
  }
}

export function recordFullscreenAdShown(): void {
  resetFullscreenAdTimer();
}

/**
 * Checks if 5 minutes have elapsed since app open or last full-screen ad seen
 */
export function isInterstitialAdReady(): boolean {
  const lastAd = getLastFullscreenAdTimestamp();
  if (!lastAd) return false;
  const elapsedMs = Date.now() - lastAd;
  return elapsedMs >= INTERSTITIAL_INTERVAL_SECONDS * 1000;
}

/**
 * Triggers native Android Rewarded Ad if in Android wrapper,
 * otherwise returns false so caller can show web-simulated rewarded ad.
 */
export function requestNativeRewardedAd(onRewardEarned: () => void): boolean {
  if (!isNativeAndroid()) return false;

  // @ts-expect-error AndroidNative bridge interface
  if (window.AndroidNative && typeof window.AndroidNative.showRewardedAd === 'function') {
    // Register global callback for native bridge
    // @ts-expect-error global callback
    window.onAndroidRewardedEarned = () => {
      recordFullscreenAdShown();
      onRewardEarned();
    };
    try {
      // @ts-expect-error AndroidNative bridge interface
      window.AndroidNative.showRewardedAd();
      return true;
    } catch (err) {
      console.warn('Error invoking native showRewardedAd:', err);
    }
  }
  return false;
}

/**
 * Triggers native Android Interstitial Ad if in Android wrapper,
 * otherwise returns false so caller can show web-simulated interstitial ad.
 */
export function requestNativeInterstitialAd(onClosed?: () => void): boolean {
  if (!isNativeAndroid()) return false;

  // @ts-expect-error AndroidNative bridge interface
  if (window.AndroidNative && typeof window.AndroidNative.showInterstitialAd === 'function') {
    // Register global callback for native bridge
    // @ts-expect-error global callback
    window.onAndroidInterstitialClosed = () => {
      recordFullscreenAdShown();
      if (onClosed) onClosed();
    };
    try {
      // @ts-expect-error AndroidNative bridge interface
      window.AndroidNative.showInterstitialAd();
      return true;
    } catch (err) {
      console.warn('Error invoking native showInterstitialAd:', err);
    }
  }
  return false;
}
