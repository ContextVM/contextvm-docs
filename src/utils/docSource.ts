const docSourceModules = import.meta.glob('/src/content/docs/**/*.{md,mdx}', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

function normalizeDocPathToSlug(path: string) {
  return path
    .replace('/src/content/docs/', '')
    .replace(/\.(md|mdx)$/, '')
    .replace(/\/index$/, '');
}

const docSourceBySlug = Object.fromEntries(
  Object.entries(docSourceModules).map(([path, source]) => [normalizeDocPathToSlug(path), source])
);

export function getDocSourceBySlug(slug: string) {
  return docSourceBySlug[slug] ?? null;
}
