import type { Page } from '@playwright/test';

/**
 * Reset all persisted state between e2e tests (v1.1: doc lives in IndexedDB,
 * not localStorage — `localStorage.clear()` alone no longer isolates tests).
 *
 * Clears the `kv` store contents in-place (rather than deleteDatabase, which
 * blocks while the app holds an open connection) + wipes localStorage.
 * Call after page.goto, before page.reload.
 */
export async function resetStorage(page: Page): Promise<void> {
  await page.evaluate(async () => {
    localStorage.clear();
    await new Promise<void>((resolve) => {
      // open with version+upgrade matching the app schema (F-V11-2): a bare
      // open() racing ahead of the app would create a storeless v1 DB and
      // block the app's upgrade → missing 'kv'.
      const open = indexedDB.open('editor', 1);
      open.onupgradeneeded = () => {
        const db = open.result;
        if (!db.objectStoreNames.contains('kv')) db.createObjectStore('kv');
      };
      open.onsuccess = () => {
        const db = open.result;
        const tx = db.transaction('kv', 'readwrite');
        tx.objectStore('kv').clear();
        tx.oncomplete = () => {
          db.close();
          resolve();
        };
        tx.onerror = () => {
          db.close();
          resolve();
        };
      };
      open.onerror = () => resolve();
    });
  });
}

/** Seed a legacy v1.0 localStorage document (for migration tests). */
export async function seedLegacyDoc(page: Page, text: string): Promise<void> {
  await page.evaluate((t) => localStorage.setItem('editor.document.v1', t), text);
}

/** Read the current IndexedDB document value (undefined if absent). */
export async function readIdbDoc(page: Page): Promise<string | undefined> {
  return page.evaluate(
    () =>
      new Promise<string | undefined>((resolve) => {
        const open = indexedDB.open('editor', 1);
        open.onupgradeneeded = () => {
          const db = open.result;
          if (!db.objectStoreNames.contains('kv')) db.createObjectStore('kv');
        };
        open.onsuccess = () => {
          const db = open.result;
          const req = db.transaction('kv').objectStore('kv').get('document');
          req.onsuccess = () => {
            db.close();
            resolve(req.result as string | undefined);
          };
          req.onerror = () => {
            db.close();
            resolve(undefined);
          };
        };
        open.onerror = () => resolve(undefined);
      }),
  );
}
