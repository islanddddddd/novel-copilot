import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { Novel, Character, SettingItem, WritingStyle } from './types';

interface BanZuoDB extends DBSchema {
  novels: {
    key: string;
    value: Novel;
  };
  characters: {
    key: string;
    value: Character & { novelId: string };
    indexes: { 'novelId': string };
  };
  settings: {
    key: string;
    value: SettingItem & { novelId: string };
    indexes: { 'novelId': string };
  };
  writingStyles: {
    key: string;
    value: WritingStyle & { novelId: string };
    indexes: { 'novelId': string };
  };
  appState: {
    key: string;
    value: unknown;
  };
}

let dbPromise: Promise<IDBPDatabase<BanZuoDB>> | null = null;

const DB_NAME = 'banzuo';
const DB_VERSION = 1;

export function getDB(): Promise<IDBPDatabase<BanZuoDB>> {
  if (!dbPromise) {
    dbPromise = openDB<BanZuoDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('novels')) {
          db.createObjectStore('novels', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('characters')) {
          const charStore = db.createObjectStore('characters', { keyPath: 'id' });
          charStore.createIndex('novelId', 'novelId', { unique: false });
        }
        if (!db.objectStoreNames.contains('settings')) {
          const setStore = db.createObjectStore('settings', { keyPath: 'id' });
          setStore.createIndex('novelId', 'novelId', { unique: false });
        }
        if (!db.objectStoreNames.contains('writingStyles')) {
          const styleStore = db.createObjectStore('writingStyles', { keyPath: 'id' });
          styleStore.createIndex('novelId', 'novelId', { unique: false });
        }
        if (!db.objectStoreNames.contains('appState')) {
          db.createObjectStore('appState');
        }
      },
    });
  }
  return dbPromise;
}

export async function saveNovel(novel: Novel): Promise<void> {
  const db = await getDB();
  await db.put('novels', novel);
}

export async function getNovel(id: string): Promise<Novel | undefined> {
  const db = await getDB();
  return db.get('novels', id);
}

export async function getAllNovels(): Promise<Novel[]> {
  const db = await getDB();
  return db.getAll('novels');
}

export async function deleteNovel(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('novels', id);
}

export async function setAppState(key: string, value: unknown): Promise<void> {
  const db = await getDB();
  await db.put('appState', value, key);
}

export async function getAppState<T>(key: string): Promise<T | undefined> {
  const db = await getDB();
  return db.get('appState', key) as Promise<T | undefined>;
}
