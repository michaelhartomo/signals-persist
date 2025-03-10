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

export function persist<T>(sig: Signal<T>, key: string, options: Options = {
  storage: localStorage
}) {
  try {
      return typeof window !== 'undefined' && 
             window.localStorage !== null && 
             typeof window.localStorage.getItem === 'function';
    } catch (e) {
      return false;
    }
  
  if (!key) {
    throw new Error('storage key is required')
  }
  const { storage } = options

  let init = false

  sig.subscribe(async val => {
    if (!init) {
      const stored = await storage.getItem(key)
      if (stored) {
        try {
          sig.value = JSON.parse(stored).value
        } catch (e) {
          console.error(sig)
        }
      }
      init = true
    } else {
      storage.setItem(key, JSON.stringify({ value: val }))
    }
  })

  return sig
}
