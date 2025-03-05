import { Signal } from '@preact/signals-core';

export interface Storage {
  getItem(key: string): Promise<string | null> | string | null
  setItem(key: string, value: string): Promise<void> | void
  removeItem(key: string): Promise<void> | void
}

export interface Options {
  /**
   * storage to use, defaults to window.localStorage
   */
  storage?: Storage
}

// Custom storage implementation that works in SSR
const createSSRCompatibleStorage = (): Storage => {
  // Check if localStorage is available (only in browser)
  const isLocalStorageAvailable = () => {
    try {
      return typeof window !== 'undefined' && 
             window.localStorage !== null && 
             typeof window.localStorage.getItem === 'function';
    } catch (e) {
      return false;
    }
  };

  return {
    getItem: (key: string): string | null => {
      if (!isLocalStorageAvailable()) return null;
      try {
        return window.localStorage.getItem(key);
      } catch (e) {
        console.error('Error accessing localStorage:', e);
        return null;
      }
    },
    setItem: (key: string, value: string): void => {
      if (!isLocalStorageAvailable()) return;
      try {
        window.localStorage.setItem(key, value);
      } catch (e) {
        console.error('Error setting localStorage item:', e);
      }
    },
    removeItem: (key: string): void => {
      if (!isLocalStorageAvailable()) return;
      try {
        window.localStorage.removeItem(key);
      } catch (e) {
        console.error('Error removing localStorage item:', e);
      }
    }
  };
};

export function persist<T>(
  sig: Signal<T>, 
  key: string, 
  options: Options = {}
) {
  if (!key) {
    throw new Error('storage key is required');
  }

  // Use provided storage or create SSR-compatible storage
  const storage = options.storage || createSSRCompatibleStorage();
  
  let init = false;
  sig.subscribe(async val => {
    if (!init) {
      const stored = await storage.getItem(key);
      if (stored) {
        try {
          sig.value = JSON.parse(stored).value;
        } catch (e) {
          console.error('Error parsing stored value:', e);
        }
      }
      init = true;
    } else {
      storage.setItem(key, JSON.stringify({ value: val }));
    }
  });

  return sig;
}
