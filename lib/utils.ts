import * as path from 'path'

export function makeRelativePath(inputPath: string) {
  return inputPath.startsWith('/') ? `.${inputPath}` : inputPath
}

export function createSubpath(parentPath: string, subpath: string) {
  return path.resolve(parentPath, makeRelativePath(subpath))
}
