import { mkdir, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');

const defaultSourceDir = path.join(repoRoot, 'public', 'file_cabinet');
const defaultSiteOutput = path.join(repoRoot, 'public', 'vault-manifest.json');
const defaultBucketOutput = path.join(defaultSourceDir, 'manifest.json');

const options = parseArgs(process.argv.slice(2));
const sourceDir = path.resolve(repoRoot, options.source ?? defaultSourceDir);
const siteOutput = path.resolve(repoRoot, options.siteOutput ?? defaultSiteOutput);
const bucketOutput = path.resolve(repoRoot, options.bucketOutput ?? defaultBucketOutput);

const ignoredNames = new Set(['.DS_Store', 'manifest.json']);

async function main() {
  const files = await collectFiles(sourceDir);
  const manifest = {
    files,
  };
  const payload = `${JSON.stringify(manifest, null, 2)}\n`;

  await writeJson(siteOutput, payload);
  await writeJson(bucketOutput, payload);

  console.log(`Generated ${files.length} vault entries.`);
  console.log(`Site manifest: ${path.relative(repoRoot, siteOutput)}`);
  console.log(`Bucket manifest: ${path.relative(repoRoot, bucketOutput)}`);
}

async function collectFiles(directory, prefix = '') {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
    if (ignoredNames.has(entry.name)) continue;

    const relativePath = prefix ? `${prefix}/${entry.name}` : entry.name;
    const absolutePath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...await collectFiles(absolutePath, relativePath));
      continue;
    }

    if (entry.isFile()) {
      files.push(relativePath);
    }
  }

  return files;
}

async function writeJson(targetPath, payload) {
  await mkdir(path.dirname(targetPath), { recursive: true });
  await writeFile(targetPath, payload, 'utf8');
}

function parseArgs(args) {
  const parsed = {};

  for (let index = 0; index < args.length; index += 1) {
    const key = args[index];
    const value = args[index + 1];

    if (!key.startsWith('--') || value == null) continue;

    if (key === '--source') parsed.source = value;
    if (key === '--site-output') parsed.siteOutput = value;
    if (key === '--bucket-output') parsed.bucketOutput = value;

    index += 1;
  }

  return parsed;
}

main().catch(error => {
  console.error(error.message);
  process.exitCode = 1;
});
