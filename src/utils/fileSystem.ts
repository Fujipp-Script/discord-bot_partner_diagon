import fg from 'fast-glob';
import { pathToFileURL } from 'url';

export async function importModules(patterns: string[]) {
  const files = await fg(patterns, { dot: false });
  const modules = [];
  for (const file of files) {
    const mod = await import(pathToFileURL(file).href);
    modules.push({ path: file, mod });
  }
  return modules;
}
