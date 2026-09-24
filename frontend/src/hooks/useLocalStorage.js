import { useEffect, useState } from "react";

/**
 * Syncs a piece of React state with localStorage under the given key.
 * Useful for things like "preferred platform" (Groww/Zerodha), remembered
 * filters, etc.
 */
export function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const stored = window.localStorage.getItem(key);
      return stored !== null ? JSON.parse(stored) : initialValue;
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Ignore write errors (e.g. private browsing storage limits)
    }
  }, [key, value]);

  return [value, setValue];
}
