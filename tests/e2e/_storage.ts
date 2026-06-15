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
      // v2.6: DB version 3 — clear kv + documents + snapshots.
      // open with version+upgrade matching the app schema (F-V11-2) to avoid
      // racing a storeless DB ahead of the app（版本须 = 应用 DB_VERSION，否则
      // 应用已升 v3 后此处开 v2 触发 VersionError → 静默不清库 / 测试串扰）。
      const open = indexedDB.open('editor', 3);
      open.onupgradeneeded = () => {
        const db = open.result;
        if (!db.objectStoreNames.contains('kv')) db.createObjectStore('kv');
        if (!db.objectStoreNames.contains('documents'))
          db.createObjectStore('documents', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('snapshots')) {
          const s = db.createObjectStore('snapshots', { keyPath: 'id' });
          s.createIndex('byDoc', 'docId');
        }
      };
      open.onsuccess = () => {
        const db = open.result;
        const tx = db.transaction(['kv', 'documents', 'snapshots'], 'readwrite');
        tx.objectStore('kv').clear();
        tx.objectStore('documents').clear();
        tx.objectStore('snapshots').clear();
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

/** Read the active doc's text from the v1.6 documents store (undefined if none). */
export async function readActiveDocText(
  page: Page,
): Promise<string | undefined> {
  return page.evaluate(
    () =>
      new Promise<string | undefined>((resolve) => {
        const open = indexedDB.open('editor', 3);
        open.onsuccess = () => {
          const db = open.result;
          const tx = db.transaction(['kv', 'documents']);
          const aReq = tx.objectStore('kv').get('activeDocId');
          aReq.onsuccess = () => {
            const id = aReq.result as string | undefined;
            if (!id) {
              db.close();
              resolve(undefined);
              return;
            }
            const dReq = tx.objectStore('documents').get(id);
            dReq.onsuccess = () => {
              db.close();
              const rec = dReq.result as { text?: string } | undefined;
              resolve(rec?.text);
            };
            dReq.onerror = () => {
              db.close();
              resolve(undefined);
            };
          };
          aReq.onerror = () => {
            db.close();
            resolve(undefined);
          };
        };
        open.onerror = () => resolve(undefined);
      }),
  );
}

/** Seed a legacy v1.0 localStorage document (for migration tests). */
export async function seedLegacyDoc(page: Page, text: string): Promise<void> {
  await page.evaluate((t) => localStorage.setItem('editor.document.v1', t), text);
}
