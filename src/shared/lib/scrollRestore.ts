import { useEffect } from "react";

const SCROLL_KEY_PREFIX = "scroll-";
const MAIN_SCROLL_ID = "main-scroll";
const RESTORE_TOLERANCE_PX = 10;

/**
 * Save the current scroll position of the main content area for the given pathname.
 * Called on scroll (debounced) and before navigating away so we can restore when the user goes back.
 */
export function saveScrollPosition(pathname: string): void {
  if (typeof window === "undefined") return;
  const el = document.getElementById(MAIN_SCROLL_ID);
  if (!el) return;
  const scrollTop = el.scrollTop;
  const key = SCROLL_KEY_PREFIX + pathname;
  try {
    sessionStorage.setItem(key, String(scrollTop));
  } catch {
    // ignore quota or other storage errors
  }
}

/**
 * Restore scroll position for the given pathname if we have a saved value.
 * Only removes the saved value once we've applied it within tolerance (so we can retry after content loads).
 * Returns true if a position was restored.
 */
export function restoreScrollPosition(pathname: string): boolean {
  if (typeof window === "undefined") return false;
  const key = SCROLL_KEY_PREFIX + pathname;
  const saved = sessionStorage.getItem(key);
  if (saved == null) return false;
  const scrollTop = parseInt(saved, 10);
  if (Number.isNaN(scrollTop) || scrollTop < 0) return false;
  const el = document.getElementById(MAIN_SCROLL_ID);
  if (!el) return false;
  requestAnimationFrame(() => {
    el.scrollTop = scrollTop;
    if (Math.abs(el.scrollTop - scrollTop) <= RESTORE_TOLERANCE_PX) {
      sessionStorage.removeItem(key);
    }
  });
  return true;
}

const SAVE_SCROLL_DEBOUNCE_MS = 150;

/**
 * Subscribe to scroll on the main content area and save position for the given pathname (debounced).
 * Use in list views so we have an up-to-date position before the user navigates away.
 */
export function useSaveScrollOnScroll(pathname: string): void {
  useEffect(() => {
    const el = typeof window !== "undefined" ? document.getElementById(MAIN_SCROLL_ID) : null;
    if (!el) return;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const onScroll = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        timer = null;
        saveScrollPosition(pathname);
      }, SAVE_SCROLL_DEBOUNCE_MS);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      if (timer) clearTimeout(timer);
      el.removeEventListener("scroll", onScroll);
    };
  }, [pathname]);
}

/**
 * Scroll the main content area to the top. Use when entering a page where we want
 * to show content from the start (e.g. after selecting a pokemon from a list).
 */
export function scrollMainToTop(): void {
  if (typeof window === "undefined") return;
  document.getElementById(MAIN_SCROLL_ID)?.scrollTo(0, 0);
}
