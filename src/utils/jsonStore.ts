import { promises as fs } from 'fs';
import path from 'path';

async function ensureDir(dir: string) { await fs.mkdir(dir, { recursive: true }); }

export async function readJSON<T>(filePath: string, fallback: T): Promise<T> {
  try { return JSON.parse(await fs.readFile(filePath, 'utf8')) as T; }
  catch { return fallback; }
}

export async function writeJSON(filePath: string, data: unknown): Promise<void> {
  await ensureDir(path.dirname(filePath));
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
}
