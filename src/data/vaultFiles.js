const VAULT_BUCKET_ORIGIN = 'https://pub-3fd8855487a64e71be891aa188c2670c.r2.dev';
const VAULT_ROOT_PREFIX = 'file-cabinet/';
const VAULT_MANIFEST_FILE = 'manifest.json';

const IMAGE_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'gif', 'webp', 'avif', 'svg']);
const AUDIO_EXTENSIONS = new Set(['mp3', 'wav', 'm4a', 'aac', 'ogg', 'flac']);
const VIDEO_EXTENSIONS = new Set(['mp4', 'webm', 'mov', 'm4v']);

const manifestCandidates = [
  `${VAULT_BUCKET_ORIGIN}/${VAULT_ROOT_PREFIX}${VAULT_MANIFEST_FILE}`,
  '/vault-manifest.json',
];

export const vaultRootLabel = `C:\\MEMORY_CARD\\${VAULT_ROOT_PREFIX.replace(/\/$/, '').replaceAll('/', '\\')}`;

export async function loadVaultFiles() {
  const manifest = await loadVaultManifest();
  const files = normalizeManifestToFiles(manifest);
  return buildFileTree(files);
}

async function loadVaultManifest() {
  for (const url of manifestCandidates) {
    try {
      const response = await fetch(url, { cache: 'no-store' });

      if (!response.ok) {
        continue;
      }

      return await response.json();
    } catch {
      continue;
    }
  }

  throw new Error('Vault manifest not found.');
}

function normalizeManifestToFiles(manifest) {
  if (Array.isArray(manifest)) {
    return manifest.map(entry => normalizeManifestEntry(entry)).filter(Boolean);
  }

  if (Array.isArray(manifest?.files)) {
    return manifest.files.map(entry => normalizeManifestEntry(entry)).filter(Boolean);
  }

  if (Array.isArray(manifest?.items)) {
    return manifest.items.map(entry => normalizeManifestEntry(entry)).filter(Boolean);
  }

  throw new Error('Vault manifest format is invalid.');
}

function normalizeManifestEntry(entry) {
  if (!entry) return null;

  if (typeof entry === 'string') {
    return normalizePathEntry(entry);
  }

  if (typeof entry === 'object') {
    const path = typeof entry.path === 'string' ? entry.path : '';
    const src = typeof entry.src === 'string' ? entry.src : '';

    if (!path && !src) return null;

    const normalized = normalizePathEntry(path || src);

    if (!normalized) return null;

    return {
      name: normalized.name,
      path: normalized.path,
      type: entry.type || normalized.type,
      src: src || normalized.src,
    };
  }

  return null;
}

function normalizePathEntry(value) {
  const trimmed = value.trim();

  if (!trimmed) return null;

  if (/^https?:\/\//i.test(trimmed)) {
    const url = new URL(trimmed);
    const pathname = decodeURIComponent(url.pathname.replace(/^\/+/, ''));
    const path = stripVaultRoot(pathname);

    if (!path) return null;

    return {
      name: getFileName(path),
      path,
      type: detectFileType(path),
      src: trimmed,
    };
  }

  const path = stripVaultRoot(trimmed);

  if (!path) return null;

  return {
    name: getFileName(path),
    path,
    type: detectFileType(path),
    src: toPublicFileUrl(path),
  };
}

function stripVaultRoot(path) {
  const normalizedPath = path.replace(/^\/+/, '');

  if (!normalizedPath) return '';

  if (normalizedPath.startsWith(VAULT_ROOT_PREFIX)) {
    return normalizedPath.slice(VAULT_ROOT_PREFIX.length);
  }

  return normalizedPath;
}

function buildFileTree(files) {
  const root = [];

  files.forEach(file => {
    const segments = file.path.split('/').filter(Boolean);
    let branch = root;

    segments.forEach((segment, index) => {
      const isLeaf = index === segments.length - 1;

      if (isLeaf) {
        branch.push({
          name: file.name,
          type: file.type,
          src: file.src,
        });
        return;
      }

      let folder = branch.find(item => item.type === 'folder' && item.name === segment);

      if (!folder) {
        folder = {
          name: segment,
          type: 'folder',
          children: [],
        };
        branch.push(folder);
      }

      branch = folder.children;
    });
  });

  return sortTree(root);
}

function sortTree(items) {
  return [...items]
    .sort((left, right) => {
      if (left.type === 'folder' && right.type !== 'folder') return -1;
      if (left.type !== 'folder' && right.type === 'folder') return 1;
      return left.name.localeCompare(right.name);
    })
    .map(item => item.type === 'folder'
      ? { ...item, children: sortTree(item.children) }
      : item);
}

function getFileName(path) {
  return path.split('/').pop() ?? path;
}

function detectFileType(filePath) {
  const extension = filePath.split('.').pop()?.toLowerCase() ?? '';

  if (IMAGE_EXTENSIONS.has(extension)) return 'image';
  if (AUDIO_EXTENSIONS.has(extension)) return 'audio';
  if (VIDEO_EXTENSIONS.has(extension)) return 'video';
  return 'file';
}

function toPublicFileUrl(path) {
  const encodedPath = path
    .split('/')
    .map(segment => encodeURIComponent(segment))
    .join('/');

  return `${VAULT_BUCKET_ORIGIN}/${VAULT_ROOT_PREFIX}${encodedPath}`;
}
