const files: Record<string, string> = {};

export const documentDirectory = 'file:///mock-documents/';

export async function getInfoAsync(uri: string): Promise<{ exists: boolean; size?: number }> {
  return { exists: uri in files, size: files[uri]?.length ?? 0 };
}

export async function readAsStringAsync(uri: string): Promise<string> {
  if (!(uri in files)) throw new Error(`File not found: ${uri}`);
  return files[uri];
}

export async function writeAsStringAsync(uri: string, contents: string): Promise<void> {
  files[uri] = contents;
}

export async function deleteAsync(uri: string): Promise<void> {
  delete files[uri];
}

export function __resetFiles(): void {
  for (const key of Object.keys(files)) {
    delete files[key];
  }
}
