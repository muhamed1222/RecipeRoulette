const rawFunctionsBase = import.meta.env.VITE_SUPABASE_FUNCTIONS_URL || '';
const normalizedBase = rawFunctionsBase.replace(/\/+$/, '');

export function getFunctionUrl(path: string): string {
  const normalizedPath = path.replace(/^\/+/, '');
  if (normalizedBase) {
    return `${normalizedBase}/${normalizedPath}`;
  }
  return `/functions/v1/${normalizedPath}`;
}
