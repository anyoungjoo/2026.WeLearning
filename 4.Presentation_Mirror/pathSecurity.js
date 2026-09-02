import path from 'node:path';

/**
 * 상대 경로를 기준 디렉터리 안으로만 제한합니다.
 */
export function isPathWithinBase(baseDir, targetPath) {
  const resolvedBase = path.resolve(baseDir);
  const resolvedTarget = path.resolve(resolvedBase, targetPath);
  const relativePath = path.relative(resolvedBase, resolvedTarget);

  return relativePath === ''
    || (relativePath !== '..'
      && !relativePath.startsWith(`..${path.sep}`)
      && !path.isAbsolute(relativePath));
}
