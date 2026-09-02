import { ZipArchive } from 'archiver';

export function buildMaterialsArchiveName(date = new Date()) {
  return `presentation-mirror-materials-${date.toISOString().slice(0, 10)}.zip`;
}

export function createMaterialsZipArchive(sourceDir) {
  const archive = new ZipArchive({
    zlib: { level: 6 }
  });

  archive.glob('**/*', {
    cwd: sourceDir,
    dot: false,
    follow: false
  });

  return archive;
}
